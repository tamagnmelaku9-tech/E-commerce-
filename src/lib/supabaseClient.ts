import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Types for products
export interface Product {
  id: string;
  title_en: string;
  title_am: string;
  description_en: string;
  description_am: string;
  price: number;
  category: 'women' | 'men' | 'kids' | 'shoes' | 'accessories';
  sizes: string[];
  image_url: string;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

// Built-in initial boutique showcase items
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    title_en: 'Modern Royal Habesha Kemis',
    title_am: 'ዘመናዊ የንግስት ሀበሻ ቀሚስ',
    description_en: 'Handwoven luxury Shemane cotton dress with delicate 24k-gold thread tilet embroidery along neck and hemline. Designed for memorable occasions.',
    description_am: 'በእጅ የተሸመነ የጥበብ ሀበሻ ቀሚስ። የወርቅ ዘርፍ ጥልፍ ያለው ለሰርግና ለተለያዩ ክብረ በዓላት የሚሆን የቅንጦት ልብስ።',
    price: 12500,
    category: 'women',
    sizes: ['S', 'M', 'L', 'XL'],
    image_url: '/src/assets/images/product_habesha_dress_1790265310480.jpg',
    is_available: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'a2222222-2222-4222-8222-222222222222',
    title_en: 'Artisan Hand-Loomed Linen Jacket',
    title_am: 'በእጅ የተሰራ የሊነን የወንዶች ጃኬት',
    description_en: 'Tailored men’s unstructured blazer crafted from organic Ethiopian cotton-linen blend. Breathable, structured drape with horn buttons.',
    description_am: 'ከተፈጥሯዊ ጥጥና ሊነን የተዘጋጀ ዘመናዊ የወንዶች ጃኬት። ምቹና ለየት ያለ ውበት ያለው።',
    price: 9800,
    category: 'men',
    sizes: ['M', 'L', 'XL', 'XXL'],
    image_url: '/src/assets/images/product_mens_linen_jacket_1790265324143.jpg',
    is_available: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'a3333333-3333-4333-8333-333333333333',
    title_en: 'Handcrafted Cognac Leather Tote',
    title_am: 'የእጅ ጥበብ ኮኛክ የቆዳ ሻንጣ',
    description_en: 'Full-grain vegetable-tanned Ethiopian highland calf leather tote with brass hardware and reinforced stitching. Built to age gracefully.',
    description_am: 'ከጥራት ካለው የሀበሻ ንፁህ ቆዳ የተሰራ ውብ የእጅ ሻንጣ። ለስራና ለዕለት ተዕለት አገልግሎት የሚውል።',
    price: 6400,
    category: 'accessories',
    sizes: ['One Size'],
    image_url: '/src/assets/images/product_leather_bag_1790265336398.jpg',
    is_available: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: 'a4444444-4444-4444-8444-444444444444',
    title_en: 'Artisanal Polished Leather Oxfords',
    title_am: 'የቆዳ ኦክስፎርድ የወንዶች ጫማ',
    description_en: 'Goodyear-welted handcrafted genuine leather dress shoes featuring deep mahogany hand-burnished patina finish and durable leather sole.',
    description_am: 'በኢትዮጵያዊ የቆዳ እደ ጥበብ ባለሙያዎች የተሰራ ክላሲክ ጫማ። ለቢሮና ለክብረ በዓል የሚስማማ።',
    price: 8200,
    category: 'shoes',
    sizes: ['40', '41', '42', '43', '44'],
    image_url: '/src/assets/images/product_leather_oxford_1790265346410.jpg',
    is_available: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
  },
  {
    id: 'a5555555-5555-4555-8555-555555555555',
    title_en: 'Embroidered Silk Chiffon Shawl (Netela)',
    title_am: 'የሐር ነጠላ ከጥልፍ ጥበብ ጋር',
    description_en: 'Ethereal sheer cotton-silk shawl with traditional hand-embroidered border motifs in emerald and gold silk threads.',
    description_am: 'የለሰለሰ የጥጥና የሐር ነጠላ ከዘመናዊ የጥበብ ዘርፍ ጋር። ለክብረ በዓላትና ለልዩ ዝግጅቶች።',
    price: 4500,
    category: 'women',
    sizes: ['One Size'],
    image_url: '/src/assets/images/boutique_hero_fashion_1790265296755.jpg',
    is_available: false, // demonstrates out of stock UI
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
  }
];

// Local storage key for fallback storage when Supabase is not configured yet
const LOCAL_STORAGE_KEY = 'zoma_boutique_products_v1';
const SUPABASE_CONFIG_KEY = 'zoma_supabase_custom_credentials';

export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.key) {
        return { url: parsed.url, key: parsed.key, source: 'custom' as const };
      }
    }
  } catch (e) {
    console.error('Error reading custom supabase credentials', e);
  }

  return {
    url: envUrl,
    key: envKey,
    source: (envUrl && envKey) ? 'env' as const : 'none' as const,
  };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (!url || !key) {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
  } else {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url: url.trim(), key: key.trim() }));
  }
}

// Create Supabase Client singleton
let supabaseInstance: SupabaseClient | null = null;
const creds = getSupabaseCredentials();

if (creds.url && creds.key) {
  try {
    supabaseInstance = createClient(creds.url, creds.key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = Boolean(supabaseInstance);

// --- Local Storage Management for Products (Resilient Mode) ---
export function getLocalProducts(): Product[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading local products', e);
  }
  // Initialize with initial products
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

export function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving local products', e);
  }
}

// --- High-Level Database APIs ---

/**
 * Fetch all products directly from Supabase (bypassing browser cache) or fallback to local store.
 */
export async function fetchAllProducts(options: { forceFresh?: boolean } = { forceFresh: true }): Promise<{ data: Product[]; error: string | null; isLive: boolean }> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, falling back to local dataset:', error.message);
        return { data: getLocalProducts(), error: error.message, isLive: false };
      }

      if (data && data.length > 0) {
        // Cache locally for offline resilience
        saveLocalProducts(data as Product[]);
        return { data: data as Product[], error: null, isLive: true };
      }

      // If remote table is currently empty, return empty list (or fallback on first run)
      return { data: data || [], error: null, isLive: true };
    } catch (err: any) {
      console.warn('Network exception while contacting Supabase, using local fallback:', err);
      return { data: getLocalProducts(), error: err.message || 'Network error', isLive: false };
    }
  }

  // Local fallback
  return { data: getLocalProducts(), error: null, isLive: false };
}

/**
 * Subscribe to real-time changes on the products table across all devices.
 * Calls onPayload on any INSERT, UPDATE, DELETE event.
 */
export function subscribeToProductsRealtime(
  onPayload: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; newRow: Product | null; oldRow: Partial<Product> | null }) => void
): { unsubscribe: () => void } {
  if (!supabase) {
    return { unsubscribe: () => {} };
  }

  const channelId = `realtime-products-${Math.random().toString(36).substring(2, 9)}`;
  const channel: RealtimeChannel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
      },
      (payload: any) => {
        onPayload({
          eventType: payload.eventType,
          newRow: payload.new ? (payload.new as Product) : null,
          oldRow: payload.old ? (payload.old as Partial<Product>) : null,
        });
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.warn('Supabase realtime subscription status error:', status, err);
      }
    });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// Generate standard RFC4122 v4 UUID reliably in all environments (HTTP, mobile, webview)
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new product
 */
export async function createProduct(
  newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
  imageFile?: File | null
): Promise<{ data: Product | null; error: string | null }> {
  let finalImageUrl = newProduct.image_url;

  // If an image file was supplied, upload to Supabase Storage if configured
  if (imageFile) {
    const uploadRes = await uploadImageToStorage(imageFile);
    if (uploadRes.url) {
      finalImageUrl = uploadRes.url;
    }
  }

  const newId = generateUUID();
  const payload: Product = {
    ...newProduct,
    id: newId,
    image_url: finalImageUrl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          id: newId,
          title_en: payload.title_en,
          title_am: payload.title_am,
          description_en: payload.description_en,
          description_am: payload.description_am,
          price: payload.price,
          category: payload.category,
          sizes: payload.sizes,
          image_url: payload.image_url,
          is_available: payload.is_available,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase create failed:', error.message);
        return { data: null, error: error.message };
      }

      // Sync local store as well
      const current = getLocalProducts().filter(p => p.id !== (data as Product).id);
      saveLocalProducts([data as Product, ...current]);
      return { data: data as Product, error: null };
    } catch (err: any) {
      console.error('Supabase create error:', err);
      return { data: null, error: err?.message || 'Failed to insert product into database' };
    }
  }

  // Pure local mode
  const current = getLocalProducts();
  saveLocalProducts([payload, ...current]);
  return { data: payload, error: null };
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  updates: Partial<Product>,
  imageFile?: File | null
): Promise<{ data: Product | null; error: string | null }> {
  let updatedFields = { ...updates, updated_at: new Date().toISOString() };

  if (imageFile) {
    const uploadRes = await uploadImageToStorage(imageFile);
    if (uploadRes.url) {
      updatedFields.image_url = uploadRes.url;
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update failed:', error.message);
        return { data: null, error: error.message };
      }

      const current = getLocalProducts();
      const updated = current.map(p => (p.id === id ? (data as Product) : p));
      saveLocalProducts(updated);
      return { data: data as Product, error: null };
    } catch (err: any) {
      console.error('Supabase update error:', err);
      return { data: null, error: err?.message || 'Failed to update product in database' };
    }
  }

  const current = getLocalProducts();
  const updated = current.map(p => (p.id === id ? { ...p, ...updatedFields } : p));
  saveLocalProducts(updated);
  const target = updated.find(p => p.id === id) || null;
  return { data: target, error: null };
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete failed:', error.message);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.error('Supabase delete error:', err);
      return { success: false, error: err?.message || 'Failed to delete product from database' };
    }
  }

  const current = getLocalProducts().filter(p => p.id !== id);
  saveLocalProducts(current);
  return { success: true, error: null };
}

/**
 * Toggle stock availability quickly
 */
export async function toggleProductStock(id: string, is_available: boolean): Promise<boolean> {
  const res = await updateProduct(id, { is_available });
  return Boolean(res.data);
}

/**
 * Upload an image file to Supabase Storage 'product-images' bucket
 * or convert to base64 Data URL if local/offline
 */
export async function uploadImageToStorage(file: File): Promise<{ url: string | null; error: string | null }> {
  if (supabase) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Storage upload error, falling back to data URL:', error.message);
      } else if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return { url: publicUrlData.publicUrl, error: null };
        }
      }
    } catch (err: any) {
      console.warn('Supabase storage exception, using local image reader:', err);
    }
  }

  // Fallback: Read as base64 Data URL for local presentation
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ url: reader.result as string, error: null });
    };
    reader.onerror = () => {
      resolve({ url: null, error: 'Could not read file' });
    };
    reader.readAsDataURL(file);
  });
}
