-- ==============================================================================
-- ENABLE SUPABASE REALTIME ON THE 'products' TABLE
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure Full replica identity so UPDATE and DELETE events broadcast full row data
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- 2. Add the 'products' table to the 'supabase_realtime' publication
DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add public.products to supabase_realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
END $$;

-- 3. Configure Row Level Security (RLS) policies for Realtime Broadcasts
-- IMPORTANT: Supabase Realtime only broadcasts records to clients that have SELECT permissions!
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated clients to read products and receive Realtime events
DROP POLICY IF EXISTS "Allow anon and authenticated read access" ON public.products;
CREATE POLICY "Allow anon and authenticated read access"
ON public.products
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated and anon clients to perform full CRUD operations
DROP POLICY IF EXISTS "Allow full management on products" ON public.products;
CREATE POLICY "Allow full management on products"
ON public.products
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Grant table permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.products TO anon, authenticated;

-- 5. Verify publication status
SELECT 
    p.pubname, 
    pt.schemaname, 
    pt.tablename,
    c.relreplident AS replica_identity -- 'f' indicates FULL replica identity
FROM pg_publication p
JOIN pg_publication_tables pt ON p.pubname = pt.pubname
JOIN pg_class c ON c.relname = pt.tablename
WHERE p.pubname = 'supabase_realtime' AND pt.tablename = 'products';

