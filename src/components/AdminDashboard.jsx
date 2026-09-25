import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  supabase,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
  saveSupabaseCredentials,
  getSupabaseCredentials,
  getLocalProducts,
  saveLocalProducts,
  isSupabaseConfigured,
} from '../lib/supabaseClient';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Database,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  LogOut,
  X,
  FileCode,
  DollarSign,
  Package,
  Layers,
  ArrowLeft,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard = ({
  onBackToCatalog,
  isAdminAuthenticated = false,
  onAdminLoginSuccess,
  onAdminLogout,
}) => {
  const { language, t } = useLanguage();

  // --- Real-Time State Management ---
  const [products, setProducts] = useState(() => getLocalProducts());
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(Boolean(supabase));
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [globalDbError, setGlobalDbError] = useState(null);

  // Auth Form State
  const [authEmail, setAuthEmail] = useState('owner@zoma-boutique.et');
  const [authPassword, setAuthPassword] = useState('Boutique@2026');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Table Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Product Modals State (Add / Edit / Delete)
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formTitleAm, setFormTitleAm] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescAm, setFormDescAm] = useState('');
  const [formPrice, setFormPrice] = useState(5000);
  const [formCategory, setFormCategory] = useState('women');
  const [formSizes, setFormSizes] = useState(['S', 'M', 'L']);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // SQL & Settings Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Custom Supabase Credentials State
  const creds = getSupabaseCredentials();
  const [customUrl, setCustomUrl] = useState(creds.url);
  const [customKey, setCustomKey] = useState(creds.key);
  const [configSavedMessage, setConfigSavedMessage] = useState(false);

  const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44', 'One Size'];

  // Prevent overlapping concurrent fetches
  const isFetchingRef = useRef(false);

  /**
   * REQUIREMENT 2: FORCE FRESH DATA FETCHING
   * Fetches fresh products directly from Supabase, ensuring state is synchronized.
   */
  const fetchFreshProducts = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[AdminDashboard] Supabase query returned error, using fallback:', error.message);
          setGlobalDbError(error.message);
          const local = getLocalProducts();
          setProducts(local);
        } else if (data) {
          setProducts(data);
          saveLocalProducts(data);
          setLastUpdated(new Date());
          setIsRealtimeConnected(true);
          setGlobalDbError(null);
        }
      } else {
        const local = getLocalProducts();
        setProducts(local);
        setIsRealtimeConnected(false);
      }
    } catch (err) {
      console.warn('[AdminDashboard] Network exception fetching products:', err);
      const local = getLocalProducts();
      setProducts(local);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingProducts(false);
    }
  }, []);

  /**
   * REQUIREMENT 1 & 2: SUPABASE REALTIME SUBSCRIPTION & PROPER CLEANUP
   * 1. Fetches initial fresh data on mount.
   * 2. Sets up active Realtime channel listener on table 'products'.
   * 3. On ANY postgres change event (INSERT, UPDATE, DELETE), immediately updates state.
   * 4. Properly cleans up channel subscription on unmount.
   */
  useEffect(() => {
    // 1. Initial Fresh Fetch
    fetchFreshProducts();

    if (!supabase) return;

    // 2. Setup Realtime Channel Listener
    const channelId = `admin-dashboard-realtime-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('[AdminDashboard] Realtime notification received:', payload.eventType, payload);
          // Refetch fresh products so all admin sessions and devices update in real-time
          fetchFreshProducts();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[AdminDashboard] Realtime channel status: ${status}`, err);
          setIsRealtimeConnected(false);
        }
      });

    // 3. Proper Cleanup on unmount
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchFreshProducts]);

  // Manual Trigger
  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await fetchFreshProducts();
    setIsManualSyncing(false);
  };

  // Calculate Dashboard Stats
  const stats = useMemo(() => {
    const totalItems = products.length;
    const outOfStockCount = products.filter((p) => !p.is_available).length;
    const totalValue = products.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
    const uniqueCategories = new Set(products.map((p) => p.category)).size;

    return {
      totalItems,
      inStockCount: totalItems - outOfStockCount,
      outOfStockCount,
      totalValue,
      uniqueCategories,
    };
  }, [products]);

  // Filtered products list for table
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryFilter !== 'all' && p.category !== selectedCategoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEn = p.title_en?.toLowerCase().includes(q);
        const matchAm = p.title_am?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        return matchEn || matchAm || matchCat;
      }
      return true;
    });
  }, [products, selectedCategoryFilter, searchQuery]);

  // Handle Admin Sign In
  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
          setAuthLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase auth call exception:', err);
      }
    }

    setAuthLoading(false);
    if (onAdminLoginSuccess) onAdminLoginSuccess();
  };

  const handleDemoSignIn = () => {
    if (onAdminLoginSuccess) onAdminLoginSuccess();
  };

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormTitleEn('');
    setFormTitleAm('');
    setFormDescEn('');
    setFormDescAm('');
    setFormPrice(4500);
    setFormCategory('women');
    setFormSizes(['S', 'M', 'L']);
    setFormAvailable(true);
    setFormImageUrl('/src/assets/images/product_habesha_dress_1790265310480.jpg');
    setSelectedImageFile(null);
    setImagePreviewUrl('/src/assets/images/product_habesha_dress_1790265310480.jpg');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormTitleEn(product.title_en || '');
    setFormTitleAm(product.title_am || '');
    setFormDescEn(product.description_en || '');
    setFormDescAm(product.description_am || '');
    setFormPrice(product.price);
    setFormCategory(product.category || 'women');
    setFormSizes(product.sizes || []);
    setFormAvailable(product.is_available);
    setFormImageUrl(product.image_url || '');
    setSelectedImageFile(null);
    setImagePreviewUrl(product.image_url || '');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  // Handle Image File Selection
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const tempUrl = URL.createObjectURL(file);
      setImagePreviewUrl(tempUrl);
    }
  };

  // Toggle Size selection in form
  const handleToggleSize = (size) => {
    if (formSizes.includes(size)) {
      setFormSizes(formSizes.filter((s) => s !== size));
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  /**
   * REQUIREMENT 1 & 2: CRUD RE-FETCHING LOGIC
   * Awaits database call, validates response, and immediately triggers fresh re-fetch
   */
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formTitleEn.trim() && !formTitleAm.trim()) {
      setFormError('Please provide at least an English or Amharic title.');
      return;
    }
    if (formPrice === '' || Number(formPrice) < 0) {
      setFormError('Please specify a valid price.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      title_en: formTitleEn.trim() || formTitleAm.trim(),
      title_am: formTitleAm.trim() || formTitleEn.trim(),
      description_en: formDescEn.trim(),
      description_am: formDescAm.trim(),
      price: Number(formPrice),
      category: formCategory,
      sizes: formSizes.length > 0 ? formSizes : ['One Size'],
      is_available: formAvailable,
      image_url: formImageUrl || '/src/assets/images/product_habesha_dress_1790265310480.jpg',
    };

    try {
      let res;
      if (editingProduct) {
        res = await updateProduct(editingProduct.id, payload, selectedImageFile);
      } else {
        res = await createProduct(payload, selectedImageFile);
      }

      if (res && res.error) {
        setFormError(`Database error: ${res.error}. Please check your Supabase RLS policies.`);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsAddEditModalOpen(false);

      // STATE RE-FETCHING AFTER CRUD: Immediately fetch fresh data from Supabase
      await fetchFreshProducts();
    } catch (err) {
      setIsSubmitting(false);
      setFormError(err.message || 'Failed to save product');
    }
  };

  // Handle Quick Stock Toggle + EXPLICIT REFETCH
  const handleQuickStockToggle = async (product) => {
    try {
      const newStatus = !product.is_available;
      await toggleProductStock(product.id, newStatus);
      // Immediately fetch fresh data from Supabase
      await fetchFreshProducts();
    } catch (err) {
      console.error('Failed to toggle stock:', err);
    }
  };

  // Handle Delete + EXPLICIT REFETCH
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    const targetId = deleteCandidate.id;
    setDeleteCandidate(null);

    try {
      const res = await deleteProduct(targetId);
      if (res && res.error) {
        alert(`Delete failed: ${res.error}`);
      }
      // Immediately fetch fresh data from Supabase
      await fetchFreshProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  // Handle Custom Credentials Save
  const handleSaveCredentials = (e) => {
    e.preventDefault();
    saveSupabaseCredentials(customUrl, customKey);
    setConfigSavedMessage(true);
    setTimeout(() => {
      setConfigSavedMessage(false);
      window.location.reload();
    }, 1000);
  };

  const SQL_DDL = `-- ==============================================================================
-- ENABLE SUPABASE REALTIME ON THE 'products' TABLE
-- ==============================================================================
-- 1. Ensure Full replica identity so UPDATE and DELETE events broadcast full row data
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- 2. Add the 'products' table to the 'supabase_realtime' publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

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
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon and authenticated read access" ON public.products;
CREATE POLICY "Allow anon and authenticated read access"
ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow full management on products" ON public.products;
CREATE POLICY "Allow full management on products"
ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.products TO anon, authenticated;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SQL_DDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // ============================================================================
  // VIEW A: ADMIN LOGIN REQUIRED SCREEN
  // ============================================================================
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between pb-6 border-b border-stone-100">
            <button
              onClick={onBackToCatalog}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToCatalog}</span>
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              <span>Restricted</span>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-stone-900 text-amber-300 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-boutique-serif text-2xl font-bold text-stone-900">
              {t.adminLoginTitle}
            </h2>
            <p className="text-xs text-stone-500">
              {t.adminLoginSubtitle}
            </p>
          </div>

          {authError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t.adminEmail}
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t.adminPassword}
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              {authLoading ? 'Verifying...' : t.adminLoginBtn}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col gap-2.5">
            <button
              onClick={handleDemoSignIn}
              type="button"
              className="w-full py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              ⚡ Instant Demo Sign-In (Preview Mode)
            </button>
            <p className="text-[10px] text-stone-400 text-center">
              Works seamlessly with Supabase Database and client-side failover.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW B: AUTHENTICATED ADMIN INVENTORY MANAGEMENT
  // ============================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Header Toolbar with Realtime Live Status Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToCatalog}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToCatalog}</span>
            </button>
            <span className="text-stone-300">/</span>
            <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
              {t.adminDashboard}
            </span>
          </div>
          <h1 className="font-boutique-serif text-3xl font-bold text-stone-900 mt-2">
            {t.adminDashboard}
          </h1>
        </div>

        {/* Realtime Status Indicator & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Realtime Live Pulse Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRealtimeConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-medium text-[11px]">
              {isRealtimeConnected ? 'Supabase Realtime Synced' : 'Standalone Cache'}
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-[10px] text-stone-400">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Force Re-fetch Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isManualSyncing || isLoadingProducts}
            title="Force fresh query from Supabase"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing || isLoadingProducts ? 'animate-spin text-stone-900' : ''}`} />
            <span>{isManualSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* SQL Publication Setup Helper Button */}
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            title="View Realtime Publication SQL"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Realtime SQL</span>
          </button>

          {/* Supabase Config Button */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            title="Configure Supabase Project"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Supabase</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProduct}</span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={onAdminLogout}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title={t.adminLogout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global DB Error Notice */}
      {globalDbError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Database warning: {globalDbError}. Run the SQL in "Realtime SQL" to enable full access.</span>
          </div>
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="text-[11px] underline font-semibold text-amber-950 ml-2"
          >
            Fix SQL
          </button>
        </div>
      )}

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.totalProducts}</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{stats.totalItems}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {stats.inStockCount} active in boutique
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.outOfStock}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{stats.outOfStockCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">Need replenishment</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.inventoryValue}</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {stats.totalValue.toLocaleString()} <span className="text-xs font-normal text-stone-500">{t.etbCurrency}</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Catalog retail value</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.realtimeStatus}</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isRealtimeConnected ? t.realtimeActive : t.realtimeDisconnected}</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Multi-device sync</div>
        </div>
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-stone-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'women', 'men', 'shoes', 'accessories'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                selectedCategoryFilter === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat === 'all' ? t.catAll : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Products Table */}
      <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Garment</th>
                <th className="py-3 px-4">{t.category}</th>
                <th className="py-3 px-4">{t.price}</th>
                <th className="py-3 px-4">{t.sizes}</th>
                <th className="py-3 px-4">{t.availability}</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Product Preview & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || '/src/assets/images/product_habesha_dress_1790265310480.jpg'}
                            alt={p.title_en}
                            className="w-10 h-10 rounded-md object-cover bg-stone-100 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-stone-900">{p.title_en}</div>
                            <div className="text-[11px] text-stone-500 font-amharic">{p.title_am}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-medium">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {Number(p.price).toLocaleString()} {t.etbCurrency}
                      </td>

                      {/* Sizes */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.sizes?.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Quick Availability Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleQuickStockToggle(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                            p.is_available
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {p.is_available ? t.inStock : t.outOfStock}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-md hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                            title={t.edit}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(p)}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT PRODUCT MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h2 className="font-boutique-serif text-2xl font-bold text-stone-900">
                {editingProduct ? t.editProduct : t.addProduct}
              </h2>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Garment Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. Royal Habesha Kemis"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    የልብስ ስም (በአማርኛ)
                  </label>
                  <input
                    type="text"
                    value={formTitleAm}
                    onChange={(e) => setFormTitleAm(e.target.value)}
                    placeholder="ምሳሌ: የንግስት ሀበሻ ቀሚስ"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 font-amharic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Price (ETB) *
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    min="0"
                    step="50"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 capitalize"
                  >
                    <option value="women">{t.catWomen}</option>
                    <option value="men">{t.catMen}</option>
                    <option value="shoes">{t.catShoes}</option>
                    <option value="accessories">{t.catAccessories}</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={3}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    placeholder="Details about craftsmanship, weave, materials..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    መግለጫ (በአማርኛ)
                  </label>
                  <textarea
                    rows={3}
                    value={formDescAm}
                    onChange={(e) => setFormDescAm(e.target.value)}
                    placeholder="የእደ ጥበብ፣ የሽመና ወይም የጥራት ዝርዝር..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 font-amharic"
                  />
                </div>
              </div>

              {/* Sizes Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SIZE_OPTIONS.map((sz) => {
                    const active = formSizes.includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="formAvailableCheckbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="formAvailableCheckbox" className="text-xs font-semibold text-stone-800 cursor-pointer select-none">
                  Available for Immediate Delivery in Boutique
                </label>
              </div>

              {/* Image Input & Preview */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                    <img
                      src={imagePreviewUrl || '/src/assets/images/product_habesha_dress_1790265310480.jpg'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setImagePreviewUrl(e.target.value);
                      }}
                      placeholder="Image URL (e.g. /src/assets/images/...)"
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Local Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-boutique-serif text-xl font-bold text-stone-900">
                {t.confirmDeleteTitle}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to remove <strong className="text-stone-800">{deleteCandidate.title_en}</strong>? Changes will broadcast immediately across all customer devices.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUPABASE REALTIME SQL HELPER MODAL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <div>
                <h3 className="font-boutique-serif text-xl font-bold text-stone-900">
                  Supabase Realtime Publication SQL
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Run this in your Supabase SQL Editor to enable postgres_changes broadcasting.
                </p>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <pre className="p-4 bg-stone-900 text-stone-200 text-xs rounded-xl overflow-x-auto font-mono max-h-72">
                  {SQL_DDL}
                </pre>
                <button
                  onClick={copySqlToClipboard}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs backdrop-blur-md transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="text-xs text-stone-600 space-y-1">
                <p><strong>Steps:</strong></p>
                <ol className="list-decimal pl-5 space-y-1 text-stone-500">
                  <li>Open your Supabase Project Dashboard → SQL Editor.</li>
                  <li>Paste the SQL script above and click <strong>Run</strong>.</li>
                  <li>Realtime is now enabled on the <code>products</code> table with FULL replica identity.</li>
                </ol>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SUPABASE CONNECTION SETTINGS MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <div>
                <h3 className="font-boutique-serif text-xl font-bold text-stone-900">
                  Supabase Project Credentials
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Connect this mobile device directly to your Supabase project.
                </p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Anon Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 font-mono"
                />
              </div>

              {configSavedMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Credentials saved! Reloading page to connect...</span>
                </div>
              )}

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
