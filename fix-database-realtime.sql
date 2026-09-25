-- ==============================================================================
-- FIX SUPABASE REALTIME REPLICATION & ROW LEVEL SECURITY FOR PRODUCTS TABLE
-- ==============================================================================
-- Run this complete SQL script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Verify products table exists with all necessary columns
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en TEXT NOT NULL,
    title_am TEXT NOT NULL,
    description_en TEXT,
    description_am TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL,
    sizes TEXT[] NOT NULL DEFAULT '{}',
    image_url TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CRUCIAL: SET REPLICA IDENTITY FULL
-- Without this, UPDATE and DELETE postgres_changes payloads will NOT include the full record
-- or old row data, preventing clients from tracking updates and deletes reliably.
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) POLICIES FOR REALTIME
-- For Supabase Realtime to broadcast postgres_changes to clients, the connected role
-- ('anon' for public visitors and 'authenticated' for admins) MUST have explicit SELECT rights.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing select policies to prevent conflicts
DROP POLICY IF EXISTS "Public can view all available and listed products" ON public.products;
DROP POLICY IF EXISTS "Allow anon and authenticated read access" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;

-- Grant explicit SELECT access to BOTH anon (public / Device B) and authenticated users
CREATE POLICY "Allow anon and authenticated read access"
ON public.products
FOR SELECT
TO anon, authenticated
USING (true);

-- Drop and recreate full management policy for authenticated administrators
DROP POLICY IF EXISTS "Authenticated users have full management on products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users full CRUD" ON public.products;

CREATE POLICY "Allow authenticated users full CRUD"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. ADD PRODUCTS TABLE TO SUPABASE_REALTIME PUBLICATION
-- Checks if publication exists and registers public.products for instant broadcasting.
DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add public.products to supabase_realtime publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
END $$;

-- 6. GRANT TABLE PERMISSIONS TO anon AND authenticated ROLES
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT ALL ON TABLE public.products TO authenticated;

-- 7. VERIFY CONFIGURATION
SELECT 
    p.pubname, 
    pt.schemaname, 
    pt.tablename,
    c.relreplident AS replica_identity -- 'f' stands for FULL
FROM pg_publication p
JOIN pg_publication_tables pt ON p.pubname = pt.pubname
JOIN pg_class c ON c.relname = pt.tablename
WHERE p.pubname = 'supabase_realtime' AND pt.tablename = 'products';
