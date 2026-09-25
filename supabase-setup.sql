-- ==============================================================================
-- ZOMA BOUTIQUE / ዞማ ቡቲክ - SUPABASE DATABASE & STORAGE INITIALIZATION
-- ==============================================================================
-- Run this complete SQL script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en TEXT NOT NULL,
    title_am TEXT NOT NULL,
    description_en TEXT,
    description_am TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL, -- 'women', 'men', 'kids', 'shoes', 'accessories'
    sizes TEXT[] NOT NULL DEFAULT '{}', -- e.g. ARRAY['S', 'M', 'L', 'XL']
    image_url TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for speedy search & category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. ROW LEVEL SECURITY (RLS) FOR PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public READ access for all users (guests and authenticated)
DROP POLICY IF EXISTS "Public can view all available and listed products" ON public.products;
CREATE POLICY "Public can view all available and listed products"
ON public.products
FOR SELECT
TO public
USING (true);

-- Policy 2: Full CRUD access ONLY for authenticated admins
DROP POLICY IF EXISTS "Authenticated users have full management on products" ON public.products;
CREATE POLICY "Authenticated users have full management on products"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. SUPABASE STORAGE BUCKET CONFIGURATION ('product-images')
-- Insert the public storage bucket if not already present
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

-- Storage RLS Policies:
-- 4.1 Allow public read access to product images
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
CREATE POLICY "Public can read product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4.2 Allow authenticated store owners to upload product images
DROP POLICY IF EXISTS "Authenticated admins can upload product images" ON storage.objects;
CREATE POLICY "Authenticated admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 4.3 Allow authenticated store owners to update product images
DROP POLICY IF EXISTS "Authenticated admins can update product images" ON storage.objects;
CREATE POLICY "Authenticated admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 4.4 Allow authenticated store owners to delete product images
DROP POLICY IF EXISTS "Authenticated admins can delete product images" ON storage.objects;
CREATE POLICY "Authenticated admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 5. SEED INITIAL SAMPLE DATA (High-End Ethiopian Boutique Clothing)
INSERT INTO public.products (
    id, title_en, title_am, description_en, description_am, price, category, sizes, image_url, is_available
) VALUES 
(
    'a1111111-1111-4111-8111-111111111111',
    'Modern Royal Habesha Kemis',
    'ዘመናዊ የንግስት ሀበሻ ቀሚስ',
    'Handwoven luxury Shemane cotton dress with delicate 24k-gold thread tilet embroidery along neck and hemline. Designed for memorable occasions.',
    'በእጅ የተሸመነ የጥበብ ሀበሻ ቀሚስ። የወርቅ ዘርፍ ጥልፍ ያለው ለሰርግና ለተለያዩ ክብረ በዓላት የሚሆን የቅንጦት ልብስ።',
    12500.00,
    'women',
    ARRAY['S', 'M', 'L', 'XL'],
    '/src/assets/images/product_habesha_dress_1790265310480.jpg',
    true
),
(
    'a2222222-2222-4222-8222-222222222222',
    'Artisan Hand-Loomed Linen Jacket',
    'በእጅ የተሰራ የሊነን የወንዶች ጃኬት',
    'Tailored men’s unstructured blazer crafted from organic Ethiopian cotton-linen blend. Breathable, structured drape with horn buttons.',
    'ከተፈጥሯዊ ጥጥና ሊነን የተዘጋጀ ዘመናዊ የወንዶች ጃኬት። ምቹና ለየት ያለ ውበት ያለው።',
    9800.00,
    'men',
    ARRAY['M', 'L', 'XL', 'XXL'],
    '/src/assets/images/product_mens_linen_jacket_1790265324143.jpg',
    true
),
(
    'a3333333-3333-4333-8333-333333333333',
    'Handcrafted Cognac Leather Tote',
    'የእጅ ጥበብ ኮኛክ የቆዳ ሻንጣ',
    'Full-grain vegetable-tanned Ethiopian highland calf leather tote with brass hardware and reinforced stitching. Built to age gracefully.',
    'ከጥራት ካለው የሀበሻ ንፁህ ቆዳ የተሰራ ውብ የእጅ ሻንጣ። ለስራና ለዕለት ተዕለት አገልግሎት የሚውል።',
    6400.00,
    'accessories',
    ARRAY['One Size'],
    '/src/assets/images/product_leather_bag_1790265336398.jpg',
    true
),
(
    'a4444444-4444-4444-8444-444444444444',
    'Artisanal Polished Leather Oxfords',
    'የቆዳ ኦክስፎርድ የወንዶች ጫማ',
    'Goodyear-welted handcrafted genuine leather dress shoes featuring deep mahogany hand-burnished patina finish and leather sole.',
    'በኢትዮጵያዊ የቆዳ እደ ጥበብ ባለሙያዎች የተሰራ ክላሲክ ጫማ። ለቢሮና ለክብረ በዓል የሚስማማ።',
    8200.00,
    'shoes',
    ARRAY['40', '41', '42', '43', '44'],
    '/src/assets/images/product_leather_oxford_1790265346410.jpg',
    true
)
ON CONFLICT (id) DO NOTHING;
