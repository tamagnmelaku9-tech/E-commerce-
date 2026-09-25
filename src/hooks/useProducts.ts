import { useState, useEffect, useCallback, useRef } from 'react';
import {
  supabase,
  Product,
  INITIAL_PRODUCTS,
  getLocalProducts,
  saveLocalProducts,
} from '../lib/supabaseClient';

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRealtimeConnected: boolean;
  lastUpdated: Date;
}

/**
 * Custom React Hook: useProducts
 * 
 * Guarantees fresh data across all devices:
 * 1. Fetches fresh products directly from Supabase on mount using .select('*').order('created_at', { ascending: false }).
 * 2. Subscribes to the Supabase Realtime channel `public:products`.
 * 3. Whenever ANY INSERT, UPDATE, or DELETE occurs on the table, it triggers a clean,
 *    lightweight re-fetch instead of fragile delta-splicing into stale closures.
 * 4. Automatically unsubscribes and cleans up channel resources on unmount.
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>(() => getLocalProducts());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(Boolean(supabase));
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Prevent multiple concurrent fetches from overlapping
  const isFetchingRef = useRef<boolean>(false);

  // Clean, lightweight re-fetch function that queries fresh data directly from Supabase
  const fetchProducts = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (supabase) {
        const { data, error: fetchErr } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchErr) {
          console.warn('[useProducts] Supabase fetch error, using local fallback:', fetchErr.message);
          setError(fetchErr.message);
          const local = getLocalProducts();
          setProducts(local);
        } else if (data) {
          // If remote table has rows, update state and cache locally
          if (data.length > 0) {
            setProducts(data as Product[]);
            saveLocalProducts(data as Product[]);
          } else {
            // If remote table exists and is empty
            setProducts([]);
            saveLocalProducts([]);
          }
          setError(null);
          setLastUpdated(new Date());
          setIsRealtimeConnected(true);
        }
      } else {
        // Fallback local mode
        const local = getLocalProducts();
        setProducts(local);
        setIsRealtimeConnected(false);
      }
    } catch (err: any) {
      console.warn('[useProducts] Exception during fetchProducts:', err);
      setError(err?.message || 'Network error');
      const local = getLocalProducts();
      setProducts(local);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial Fresh Fetch
    fetchProducts();

    // If Supabase is not configured yet, no channel to subscribe
    if (!supabase) {
      return;
    }

    // 2. Subscribe to Supabase Realtime channel for public:products
    const channelName = `public:products:${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload: any) => {
          // CRITICAL FIX: Trigger a clean, reliable re-fetch instead of fragile delta-splicing
          fetchProducts();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[useProducts] Realtime channel status: ${status}`, err);
          setIsRealtimeConnected(false);
        }
      });

    // 3. Proper cleanup on unmount: remove channel to prevent memory leaks and duplicate listeners
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    isRealtimeConnected,
    lastUpdated,
  };
}

export default useProducts;
