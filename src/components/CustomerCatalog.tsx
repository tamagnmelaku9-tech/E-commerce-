import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../lib/supabaseClient';
import {
  Search,
  SlidersHorizontal,
  Send,
  MessageCircle,
  X,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

interface CustomerCatalogProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenAdminAuth: () => void;
  isAdminAuthenticated: boolean;
  onNavigateToAdmin: () => void;
}

export const CustomerCatalog: React.FC<CustomerCatalogProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenAdminAuth,
  isAdminAuthenticated,
  onNavigateToAdmin,
}) => {
  const { language, t, getProductTitle, getProductDesc } = useLanguage();

  // Consume bulletproof useProducts Realtime Hook
  const {
    products,
    loading: isLoadingProducts,
    refetch,
    isRealtimeConnected,
    lastUpdated,
  } = useProducts();

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Store contact details for direct ordering
  const STORE_WHATSAPP_NUMBER = '251911223344';
  const STORE_TELEGRAM_HANDLE = 'zomaboutique_et';

  // Category list
  const categoryFilters = [
    { id: 'all', label: t.catAll },
    { id: 'women', label: t.catWomen },
    { id: 'men', label: t.catMen },
    { id: 'shoes', label: t.catShoes },
    { id: 'accessories', label: t.catAccessories },
  ];

  // Manual trigger wrapper
  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await refetch();
    setIsManualSyncing(false);
  };

  // If modal is open and the product was updated in products list, keep modal data fresh
  const currentModalProduct = useMemo(() => {
    if (!activeModalProduct) return null;
    const found = products.find((p) => p.id === activeModalProduct.id);
    return found || activeModalProduct;
  }, [activeModalProduct, products]);

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // In Stock filter
        if (inStockOnly && !item.is_available) {
          return false;
        }

        // Price filter
        if (item.price > maxPrice) {
          return false;
        }

        // Search Query (matches English or Amharic title, category, description)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitleEn = item.title_en?.toLowerCase().includes(q);
          const matchTitleAm = item.title_am?.toLowerCase().includes(q);
          const matchCategory = item.category?.toLowerCase().includes(q);
          const matchDescEn = item.description_en?.toLowerCase().includes(q);
          const matchDescAm = item.description_am?.toLowerCase().includes(q);
          return matchTitleEn || matchTitleAm || matchCategory || matchDescEn || matchDescAm;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return a.price - b.price;
        }
        if (sortBy === 'price_desc') {
          return b.price - a.price;
        }
        // default newest
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });
  }, [products, selectedCategory, inStockOnly, maxPrice, searchQuery, sortBy]);

  // Open Product Modal
  const handleOpenProduct = (product: Product) => {
    setActiveModalProduct(product);
    setSelectedSize(product.sizes?.[0] || '');
  };

  // Close Product Modal
  const handleCloseProduct = () => {
    setActiveModalProduct(null);
    setSelectedSize('');
  };

  // Construct Direct Order Message for Telegram & WhatsApp
  const generateOrderMessage = (product: Product, size: string) => {
    const title = getProductTitle(product);
    const sizeStr = size ? size : 'Standard';

    if (language === 'am') {
      return `${t.orderGreeting}\n\n${t.orderInquiry}\n• የልብስ ስም: ${title}\n• ${t.orderPrice} ${product.price.toLocaleString()} ${t.etbCurrency}\n• ${t.orderSize} ${sizeStr}\n• መለያ ቁጥር (ID): #${product.id.slice(0, 8)}\n\nይህ ልብስ አሁን አለ ወይ? ከአዲስ አበባ ማድረስ ይቻላል?`;
    }

    return `${t.orderGreeting}\n\n${t.orderInquiry}\n• Garment: ${title}\n• ${t.orderPrice} ${product.price.toLocaleString()} ${t.etbCurrency}\n• ${t.orderSize} ${sizeStr}\n• Item Ref: #${product.id.slice(0, 8)}\n\nIs this piece currently available for delivery in Addis Ababa or international shipping?`;
  };

  const getWhatsAppOrderUrl = (product: Product, size: string) => {
    const text = encodeURIComponent(generateOrderMessage(product, size));
    return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${text}`;
  };

  const getTelegramOrderUrl = (product: Product, size: string) => {
    const text = encodeURIComponent(generateOrderMessage(product, size));
    return `https://t.me/share/url?url=${encodeURIComponent('https://zoma-boutique.et')}&text=${text}`;
  };

  const resetAllFilters = () => {
    onSelectCategory('all');
    setSearchQuery('');
    setInStockOnly(false);
    setMaxPrice(20000);
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen">
      
      {/* 1. STOREFRONT HERO BANNER */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-100">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/boutique_hero_fashion_1790265296755.jpg"
            alt="Zoma Boutique Collection"
            className="w-full h-full object-cover opacity-45 scale-105 transform hover:scale-100 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-200 text-xs tracking-widest uppercase mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.handcraftedInEthiopia}</span>
          </div>

          <h1 className="font-boutique-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight max-w-4xl text-white text-balance leading-tight">
            {t.brandTagline}
          </h1>

          <p className="mt-5 max-w-2xl text-stone-300 text-sm sm:text-base leading-relaxed">
            {language === 'am'
              ? 'ከጥንታዊው የሽመና ጥበብ እስከ ዘመናዊው የከፍተኛ ፋሽን ስልት ድረስ የተሰሩ ውብ የሴቶች፣ የወንዶች፣ የቆዳ ጫማዎችና ሻንጣዎች ስብስብ።'
              : 'Discover an authentic marriage of century-old Ethiopian master weaving, hand-burnished highland leathers, and tailored contemporary silhouettes.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#catalog-view"
              className="px-6 py-3 rounded-lg bg-white text-stone-950 hover:bg-stone-100 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors shadow-md cursor-pointer"
            >
              {language === 'am' ? 'ስብስቦቹን ያስሱ' : 'Explore Collections'}
            </a>
            <button
              onClick={() => {
                if (isAdminAuthenticated) {
                  onNavigateToAdmin();
                } else {
                  onOpenAdminAuth();
                }
              }}
              className="px-6 py-3 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 text-xs sm:text-sm font-medium tracking-wider uppercase border border-stone-700 backdrop-blur-md transition-colors cursor-pointer"
            >
              {t.navAdmin}
            </button>
          </div>
        </div>
      </section>

      {/* 2. CATALOG HEADER, SEARCH & CONTROLS */}
      <section id="catalog-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        
        {/* Realtime Live Status Indicator Banner */}
        <div className="mb-4 flex items-center justify-between px-3.5 py-2 bg-white border border-stone-200/80 rounded-xl text-xs text-stone-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRealtimeConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold text-stone-800">
              {isRealtimeConnected ? 'Supabase Realtime Synced' : 'Catalog Online'}
            </span>
            <span className="hidden sm:inline text-stone-400">·</span>
            <span className="hidden sm:inline text-stone-500">
              {language === 'am'
                ? 'በሌላ ስልክ ወይም በአስተዳዳሪው የሚጨመሩ/የሚሻሻሉ ልብሶች ወዲያውኑ ይታያሉ'
                : 'Instant automatic updates across all mobile devices & browsers'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-400 hidden md:inline">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={handleManualSync}
              disabled={isManualSyncing || isLoadingProducts}
              title="Force Fresh Fetch from Supabase"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isManualSyncing || isLoadingProducts ? 'animate-spin text-stone-900' : ''}`} />
              <span className="hidden sm:inline">{isManualSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Primary Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          
          {/* Real-Time Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Sorting & Filter Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label={t.sortBy}
                className="bg-transparent border-none text-xs text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="newest">{t.sortNewest}</option>
                <option value="price_asc">{t.sortPriceAsc}</option>
                <option value="price_desc">{t.sortPriceDesc}</option>
              </select>
            </div>

            <label className="flex items-center gap-2 bg-white border border-stone-300 hover:border-stone-400 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 cursor-pointer shadow-xs select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <span>{t.inStockOnly}</span>
            </label>

            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.filterTitle}</span>
            </button>
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categoryFilters.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-500">
            <span>
              {t.showingItems}: <strong className="font-semibold text-stone-800 tabular-nums">{filteredProducts.length}</strong>
            </span>
            {(selectedCategory !== 'all' || searchQuery || inStockOnly || maxPrice < 20000) && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-stone-600 hover:text-stone-950 underline underline-offset-2 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.resetFilters}</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Filter Tray (Price Range Slider) */}
        <div className="mt-4 pt-4 pb-2 border-t border-stone-100 flex items-center gap-6 text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <span className="font-medium text-stone-700">{t.priceRange}:</span>
            <span className="tabular-nums font-semibold text-stone-900">0 - {maxPrice.toLocaleString()} {t.etbCurrency}</span>
            <input
              type="range"
              min="2000"
              max="20000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label={t.priceRange}
              className="w-36 sm:w-48 accent-stone-900 cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* 3. PRODUCT CATALOG GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white border border-stone-200/80 rounded-2xl p-8 max-w-xl mx-auto shadow-xs">
            <ShoppingBag className="w-12 h-12 mx-auto text-stone-300 stroke-1 mb-4" />
            <h3 className="font-boutique-serif text-xl font-semibold text-stone-900">
              {t.noItemsFound}
            </h3>
            <p className="mt-2 text-stone-500 text-sm">
              {language === 'am'
                ? 'እባክዎ የተመረጡትን ማጣሪያዎች ይቀይሩ ወይም ሌላ ቃል ይፈልጉ።'
                : 'Try adjusting your search query, clearing filters, or increasing the price ceiling.'}
            </p>
            <button
              onClick={resetAllFilters}
              className="mt-6 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              {t.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => {
              const title = getProductTitle(product);
              const desc = getProductDesc(product);

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl overflow-hidden border border-stone-200/80 hover:border-stone-400/80 transition-all duration-300 flex flex-col shadow-xs hover:shadow-md"
                >
                  {/* Image Slot */}
                  <div
                    onClick={() => handleOpenProduct(product)}
                    className="relative aspect-3/4 bg-stone-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={product.image_url}
                      alt={title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 left-3">
                      {product.is_available ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-white/90 backdrop-blur-md text-stone-800 rounded-md border border-stone-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{t.inStock}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-stone-900/90 backdrop-blur-md text-stone-100 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span>{t.outOfStock}</span>
                        </span>
                      )}
                    </div>

                    {/* Hover Quick View Overlay */}
                    <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProduct(product);
                        }}
                        className="w-full py-2.5 px-4 bg-white/95 hover:bg-white text-stone-900 font-semibold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
                      >
                        {t.viewDetails}
                      </button>
                    </div>
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider mb-1.5 font-medium">
                        <span>{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">
                          {product.sizes?.length ? `${product.sizes.length} Sizes` : 'One Size'}
                        </span>
                      </div>

                      <h3
                        onClick={() => handleOpenProduct(product)}
                        className="font-boutique-serif text-lg font-semibold text-stone-900 hover:text-stone-700 cursor-pointer line-clamp-1"
                        title={title}
                      >
                        {title}
                      </h3>

                      <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    {/* Price & Direct Order Action */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">
                          {language === 'am' ? 'ዋጋ' : 'Price'}
                        </span>
                        <span className="text-base font-semibold text-stone-900 tabular-nums">
                          {product.price.toLocaleString()} <span className="text-xs text-stone-600 font-normal">{t.etbCurrency}</span>
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenProduct(product)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        {language === 'am' ? 'ማዘዣ' : 'Order'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. PRODUCT DETAILS & DIRECT ORDER MODAL */}
      {currentModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
            onClick={handleCloseProduct}
          />

          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[90vh] flex flex-col md:flex-row">
            
            <button
              onClick={handleCloseProduct}
              aria-label={t.close}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-950 shadow-md backdrop-blur-xs transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Product Image */}
            <div className="md:w-1/2 relative bg-stone-100 min-h-[300px] md:min-h-full">
              <img
                src={currentModalProduct.image_url}
                alt={getProductTitle(currentModalProduct)}
                className="w-full h-full object-cover object-center max-h-[420px] md:max-h-full"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                {currentModalProduct.is_available ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md text-xs font-medium text-stone-900 rounded-md border border-stone-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{t.inStock}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-900/90 backdrop-blur-md text-xs font-medium text-white rounded-md">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>{t.outOfStock}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Details & Order */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[500px] md:max-h-[600px]">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider mb-2">
                  <span>{currentModalProduct.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t.handcraftedInEthiopia}</span>
                </div>

                <h2 className="font-boutique-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  {getProductTitle(currentModalProduct)}
                </h2>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-stone-950 tabular-nums">
                    {currentModalProduct.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-stone-600">
                    {t.etbCurrency}
                  </span>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-200">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">
                    {t.descriptionTitle}
                  </h4>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {getProductDesc(currentModalProduct)}
                  </p>
                </div>

                {currentModalProduct.sizes && currentModalProduct.sizes.length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs uppercase tracking-wider font-semibold text-stone-600">
                        {t.selectSize}
                      </label>
                      {selectedSize && (
                        <span className="text-xs font-medium text-stone-500">
                          Selected: <strong className="text-stone-900">{selectedSize}</strong>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentModalProduct.sizes.map((size) => {
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`min-w-10 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-stone-900 border-stone-900 text-white'
                                : 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-800'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Ordering Module */}
              <div className="mt-6 pt-5 border-t border-stone-200 space-y-3">
                <p className="text-[11px] text-stone-500 leading-normal">
                  {t.directOrderSubtitle}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={getTelegramOrderUrl(currentModalProduct, selectedSize)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1e8bc0] text-white text-xs font-semibold tracking-wider transition-all shadow-xs cursor-pointer text-center"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.orderViaTelegram}</span>
                  </a>

                  <a
                    href={getWhatsAppOrderUrl(currentModalProduct, selectedSize)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold tracking-wider transition-all shadow-xs cursor-pointer text-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.orderViaWhatsApp}</span>
                  </a>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-stone-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Boutique Addis Ababa · Direct Owner Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. HERITAGE FOOTER SECTION */}
      <section className="bg-stone-100/70 border-t border-stone-200 py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="p-6 bg-white rounded-xl border border-stone-200/60 shadow-2xs">
              <h4 className="font-boutique-serif text-lg font-bold text-stone-900 mb-2">
                {language === 'am' ? 'ባህላዊ የሽመና ጥበብ' : 'Master Artisan Weaving'}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {language === 'am'
                  ? 'እያንዳንዱ ልብስ በኢትዮጵያዊ የጥበብ ሽማኔ ባለሙያዎች በጥንቃቄ የተሰራ ነው።'
                  : 'Every thread and border tilet is carefully hand-loomed by seasoned Shemane masters in Ethiopia.'}
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-stone-200/60 shadow-2xs">
              <h4 className="font-boutique-serif text-lg font-bold text-stone-900 mb-2">
                {language === 'am' ? 'ንፁህ የተፈጥሮ ቆዳ' : 'Highland Full-Grain Leather'}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {language === 'am'
                  ? 'የእጅ ሻንጣዎቻችንና ጫማዎቻችን የሚዘጋጁት ከምርጥ የኢትዮጵያ ሀገር በቀል ቆዳ ነው።'
                  : 'Artisan shoes and bags crafted from organically tanned Ethiopian highland leathers with hand-burnished patinas.'}
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-stone-200/60 shadow-2xs">
              <h4 className="font-boutique-serif text-lg font-bold text-stone-900 mb-2">
                {language === 'am' ? 'ፈጣን ማድረስ እና አለም አቀፍ ጭነት' : 'Concierge & Global Shipping'}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {language === 'am'
                  ? 'በአዲስ አበባ ከተማ ውስጥ በቀጥታ እናደርሳለን እንዲሁም በDHL ወደ ሁሉም አለም እንልካለን።'
                  : 'Same-day concierge hand delivery across Addis Ababa; express international dispatch via DHL.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerCatalog;
