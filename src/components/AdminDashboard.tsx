import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../hooks/useProducts';
import {
  Product,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
  saveSupabaseCredentials,
  getSupabaseCredentials,
  supabase,
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

interface AdminDashboardProps {
  onBackToCatalog: () => void;
  isAdminAuthenticated: boolean;
  onAdminLoginSuccess: () => void;
  onAdminLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToCatalog,
  isAdminAuthenticated,
  onAdminLoginSuccess,
  onAdminLogout,
}) => {
  const { language, t } = useLanguage();

  // Consume bulletproof useProducts Realtime Hook
  const {
    products,
    loading: isLoadingProducts,
    refetch,
    isRealtimeConnected,
    lastUpdated,
  } = useProducts();

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Auth Form State
  const [authEmail, setAuthEmail] = useState('owner@zoma-boutique.et');
  const [authPassword, setAuthPassword] = useState('Boutique@2026');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Table Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Product Modals State (Add / Edit / Delete)
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formTitleAm, setFormTitleAm] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescAm, setFormDescAm] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>(5000);
  const [formCategory, setFormCategory] = useState<'women' | 'men' | 'kids' | 'shoes' | 'accessories'>('women');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L']);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

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

  // Manual Trigger
  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await refetch();
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
      outOfStockCount,
      totalValue,
      uniqueCategories,
    };
  }, [products]);

  // Filter Table Items
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitleEn = item.title_en?.toLowerCase().includes(q);
        const matchTitleAm = item.title_am?.toLowerCase().includes(q);
        const matchDesc = item.description_en?.toLowerCase().includes(q) || item.description_am?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        return matchTitleEn || matchTitleAm || matchDesc || matchCategory;
      }
      return true;
    });
  }, [products, selectedCategoryFilter, searchQuery]);

  // Handlers for Authentication
  const handleAuthSubmit = async (e: React.FormEvent) => {
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
      } catch (err: any) {
        console.warn('Supabase auth call exception:', err);
      }
    }

    setAuthLoading(false);
    onAdminLoginSuccess();
  };

  const handleDemoSignIn = () => {
    onAdminLoginSuccess();
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
  const handleOpenEditModal = (product: Product) => {
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
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const tempUrl = URL.createObjectURL(file);
      setImagePreviewUrl(tempUrl);
    }
  };

  // Toggle Size selection in form
  const handleToggleSize = (size: string) => {
    if (formSizes.includes(size)) {
      setFormSizes(formSizes.filter((s) => s !== size));
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  // Save Product (Create or Update) + EXPLICIT HOOK REFETCH
  const handleSaveProduct = async (e: React.FormEvent) => {
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

      // CRITICAL REQUIREMENT: Await Supabase call AND call hook's explicit refetch
      await refetch();
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Failed to save product');
    }
  };

  // Handle Quick Stock Toggle + EXPLICIT HOOK REFETCH
  const handleQuickStockToggle = async (product: Product) => {
    const newStatus = !product.is_available;
    await toggleProductStock(product.id, newStatus);
    // Explicit refetch to guarantee 100% data consistency
    await refetch();
  };

  // Handle Delete + EXPLICIT HOOK REFETCH
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    const targetId = deleteCandidate.id;
    setDeleteCandidate(null);

    const res = await deleteProduct(targetId);
    if (res && res.error) {
      alert(`Delete failed: ${res.error}`);
    }
    // Explicit refetch to guarantee 100% data consistency
    await refetch();
  };

  // Handle Custom Credentials Save
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(customUrl, customKey);
    setConfigSavedMessage(true);
    setTimeout(() => {
      setConfigSavedMessage(false);
      window.location.reload();
    }, 1000);
  };

  const SQL_DDL = `-- ==============================================================================
-- FIX SUPABASE REALTIME REPLICATION & ROW LEVEL SECURITY FOR PRODUCTS TABLE
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- 1. CRUCIAL: FULL REPLICA IDENTITY
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- 2. ROW LEVEL SECURITY (RLS) FOR REALTIME BROADCASTING
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon and authenticated read access" ON public.products;
CREATE POLICY "Allow anon and authenticated read access"
ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full CRUD" ON public.products;
CREATE POLICY "Allow authenticated users full CRUD"
ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. ENABLE SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT ALL ON TABLE public.products TO authenticated;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_DDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // IF NOT AUTHENTICATED
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-2xl shadow-xl p-8">
          
          <button
            onClick={onBackToCatalog}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'ወደ ስብስቦች ተመለስ' : 'Back to Public Catalog'}</span>
          </button>

          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-boutique-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {t.adminLogin}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {t.adminSubtitle}
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                {t.emailLabel}
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="owner@zoma-boutique.et"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              {authLoading ? 'Signing In...' : t.loginBtn}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-200 text-center">
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>{t.demoAdminLogin}</span>
            </button>
            <p className="mt-2 text-[11px] text-stone-400">
              {language === 'am'
                ? 'ምንም ምዝገባ ሳያስፈልግ ዳሽቦርዱን ወዲያውኑ ለመፈተሽ ይጫኑ'
                : 'Instantly test full inventory CRUD without configuring credentials'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRealtimeConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <h1 className="font-boutique-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {t.adminTitle}
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
            <span>{t.adminSubtitle}</span>
            <span className="text-stone-300">·</span>
            <span className={isRealtimeConnected ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
              {isRealtimeConnected ? 'Realtime Broadcast Active' : 'Connecting Realtime...'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Manual Sync */}
          <button
            onClick={handleManualSync}
            disabled={isManualSyncing || isLoadingProducts}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 transition-colors shadow-2xs cursor-pointer"
            title="Force fresh pull from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-600 ${isManualSyncing || isLoadingProducts ? 'animate-spin' : ''}`} />
            <span>{isManualSyncing ? 'Syncing...' : 'Sync Fresh'}</span>
          </button>

          {/* SQL Setup Modal Trigger */}
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 transition-colors shadow-2xs cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-stone-500" />
            <span>Realtime SQL</span>
          </button>

          {/* Database Credentials Modal Trigger */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-stone-500" />
            <span>Supabase API</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewProduct}</span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={onAdminLogout}
            title={t.signOutBtn}
            className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-8">
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              {t.statTotalItems}
            </span>
            <Package className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
            {stats.totalItems}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {language === 'am' ? 'በስርዓቱ ውስጥ ያሉ' : 'Active in database catalog'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              {t.statOutOfStock}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
            {stats.outOfStockCount}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {language === 'am' ? 'በአሁኑ ሰዓት ያለቁ' : 'Unavailable for delivery'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              {t.statTotalValue}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums truncate">
            {stats.totalValue.toLocaleString()}{' '}
            <span className="text-xs font-normal text-stone-500">{t.etbCurrency}</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {language === 'am' ? 'ጠቅላላ የልብሶች የገበያ ዋጋ' : 'Aggregate inventory price'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              {t.statCategories}
            </span>
            <Layers className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
            {stats.uniqueCategories}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {language === 'am' ? 'የሴቶች፣ የወንዶች፣ ጫማዎች፣ ሻንጣዎች' : 'Women, Men, Shoes, Bags'}
          </span>
        </div>
      </div>

      {/* 3. CRUD DATA TABLE & CONTROLS */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'am' ? 'በስም ወይም በመግለጫ ፈልግ...' : 'Search items by title, category, or note...'}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              aria-label={t.categorySelect}
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="all">{t.catAll}</option>
              <option value="women">{t.catWomen}</option>
              <option value="men">{t.catMen}</option>
              <option value="shoes">{t.catShoes}</option>
              <option value="accessories">{t.catAccessories}</option>
            </select>

            <button
              onClick={handleManualSync}
              disabled={isManualSyncing || isLoadingProducts}
              title="Refresh Catalog Data"
              className="p-2 border border-stone-300 rounded-lg text-stone-600 hover:text-stone-950 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isManualSyncing || isLoadingProducts ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700 divide-y divide-stone-200">
            <thead className="bg-stone-50/70 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">{t.tableColImage}</th>
                <th className="py-3.5 px-4">{t.tableColTitle}</th>
                <th className="py-3.5 px-4">{t.tableColCategory}</th>
                <th className="py-3.5 px-4 text-right">{t.tableColPrice}</th>
                <th className="py-3.5 px-4">{t.tableColSizes}</th>
                <th className="py-3.5 px-4 text-center">{t.tableColStatus}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">{t.tableColActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400 text-sm">
                    {t.noItemsFound}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  return (
                    <tr key={product.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 sm:px-6">
                        <img
                          src={product.image_url}
                          alt={product.title_en}
                          className="w-12 h-14 object-cover rounded-lg border border-stone-200 bg-stone-100"
                          referrerPolicy="no-referrer"
                        />
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-stone-900 line-clamp-1">
                          {product.title_en}
                        </div>
                        <div className="text-xs text-stone-500 line-clamp-1 font-amharic mt-0.5">
                          {product.title_am}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="capitalize text-stone-600 font-medium text-xs">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-stone-900 tabular-nums">
                        {product.price.toLocaleString()} <span className="text-[11px] text-stone-500 font-normal">{t.etbCurrency}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {product.sizes?.slice(0, 3).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded font-mono">
                              {s}
                            </span>
                          ))}
                          {product.sizes?.length > 3 && (
                            <span className="text-[10px] text-stone-400 self-center">
                              +{product.sizes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleQuickStockToggle(product)}
                          title="Click to toggle availability across all devices"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            product.is_available
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.is_available ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{product.is_available ? t.inStock : t.outOfStock}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                            title={t.editProduct}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(product)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title={t.deleteProduct}
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

      {/* 4. ADD / EDIT PRODUCT MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddEditModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-boutique-serif text-xl sm:text-2xl font-bold text-stone-900">
                  {editingProduct ? t.editProduct : t.addNewProduct}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {language === 'am' ? 'የልብሱን መረጃ በእንግሊዝኛና በአማርኛ ይሙሉ' : 'Fill in both English & Amharic translations for seamless bilingual display.'}
                </p>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-5">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t.titleEn} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. Modern Royal Habesha Kemis"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 font-amharic">
                    {t.titleAm} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitleAm}
                    onChange={(e) => setFormTitleAm(e.target.value)}
                    placeholder="ምሳሌ፡ ዘመናዊ የንግስት ሀበሻ ቀሚስ"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-amharic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t.priceEtb} *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="50"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="8500"
                      className="w-full pl-3 pr-12 py-2 border border-stone-300 rounded-lg text-sm font-semibold text-stone-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
                      {t.etbCurrency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t.categorySelect} *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  >
                    <option value="women">{t.catWomen}</option>
                    <option value="men">{t.catMen}</option>
                    <option value="shoes">{t.catShoes}</option>
                    <option value="accessories">{t.catAccessories}</option>
                    <option value="kids">{t.catKids}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t.availableSizes}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((sz) => {
                    const isSelected = formSizes.includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3 py-1 text-xs rounded-md border font-mono transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 border-stone-900 text-white'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t.descEn}
                  </label>
                  <textarea
                    rows={2}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    placeholder="Handwoven Shemane cotton dress with delicate gold tilet embroidery..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 font-amharic">
                    {t.descAm}
                  </label>
                  <textarea
                    rows={2}
                    value={formDescAm}
                    onChange={(e) => setFormDescAm(e.target.value)}
                    placeholder="በእጅ የተሸመነ የጥበብ ሀበሻ ቀሚስ። የወርቅ ዘርፍ ጥልፍ ያለው ለሰርግና ለክብረ በዓላት የሚሆን..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-amharic"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t.imageUpload}
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-stone-300 rounded-xl bg-stone-50">
                  <div className="w-20 h-24 bg-stone-200 rounded-lg overflow-hidden shrink-0 border border-stone-300">
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 hover:bg-stone-50 cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-stone-500" />
                      <span>{language === 'am' ? 'ምስል ምረጥ (ፋይል)' : 'Choose Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-stone-400">
                      {t.uploadFileHint}
                    </p>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setImagePreviewUrl(e.target.value);
                      }}
                      placeholder="Or paste direct image URL (e.g. /src/assets/images/...)"
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-md bg-white text-stone-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formAvailableCheckbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="formAvailableCheckbox" className="text-xs font-medium text-stone-800 cursor-pointer select-none">
                  {language === 'am' ? 'ልብሱ አሁን አለ (በክምችት ላይ)' : 'Item is available and in stock'}
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
            onClick={() => setDeleteCandidate(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-boutique-serif text-xl font-bold text-stone-900">
              {t.confirmDeleteTitle}
            </h3>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              {t.confirmDeleteDesc}
            </p>
            <div className="mt-3 p-3 bg-stone-50 rounded-lg text-xs font-semibold text-stone-800">
              {deleteCandidate.title_en} ({deleteCandidate.price.toLocaleString()} {t.etbCurrency})
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                {t.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUPABASE REALTIME & SQL SETUP MODAL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
            onClick={() => setIsSqlModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-boutique-serif text-xl font-bold text-stone-900">
                  Supabase Realtime & SQL Publication Setup
                </h3>
                <p className="text-xs text-stone-500">
                  Run this SQL in your Supabase SQL Editor. It sets REPLICA IDENTITY FULL and allows public SELECT access for Realtime listeners.
                </p>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-stone-500">fix-database-realtime.sql</span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? t.sqlCopied : t.copySqlSetup}</span>
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-200 text-xs rounded-xl font-mono overflow-x-auto leading-relaxed max-h-[400px]">
                {SQL_DDL}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 7. DYNAMIC SUPABASE API CREDENTIALS MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
            onClick={() => setIsConfigModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-stone-700" />
                <h3 className="font-boutique-serif text-xl font-bold text-stone-900">
                  {t.connectCustomSupabase}
                </h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3 bg-stone-50 rounded-lg text-xs text-stone-600 space-y-1">
              <div className="font-semibold text-stone-800">
                {t.connectionStatus}:
              </div>
              <div className="text-[11px] text-stone-500">
                {isSupabaseConfigured ? t.connectedToSupabase : t.usingLocalMode}
              </div>
            </div>

            {configSavedMessage && (
              <div className="mb-4 p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Credentials saved! Reloading client...</span>
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder={t.supabaseUrlPlaceholder}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Supabase Anon Public API Key
                </label>
                <textarea
                  rows={3}
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder={t.supabaseKeyPlaceholder}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                >
                  {t.saveCredentials}
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
