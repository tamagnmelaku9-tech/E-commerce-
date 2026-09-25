import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  supabase,
  getLocalProducts,
  saveLocalProducts,
  INITIAL_PRODUCTS,
} from '../lib/supabaseClient';
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

export const CustomerCatalog = ({
  selectedCategory = 'all',
  onSelectCategory,
  onOpenAdminAuth,
  isAdminAuthenticated = false,
  onNavigateToAdmin,
}) => {
  const { language, t, getProductTitle, getProductDesc } = useLanguage();

  // --- Real-Time State Management ---
  const [products, setProducts] = useState(() => getLocalProducts());
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(Boolean(supabase));
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(25000);
  const [sortBy, setSortBy] = useState('newest');
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
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

  // Prevent overlapping concurrent fetches
  const isFetchingRef = useRef(false);

  /**
   * REQUIREMENT 2: FORCE FRESH DATA FETCHING
   * Fetches the latest products directly from Supabase, bypassing any stale caches.
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
          console.warn('[CustomerCatalog] Supabase query returned error, using fallback:', error.message);
          const local = getLocalProducts();
          setProducts(local);
        } else if (data) {
          setProducts(data);
          saveLocalProducts(data);
          setLastUpdated(new Date());
          setIsRealtimeConnected(true);
        }
      } else {
        const local = getLocalProducts();
        setProducts(local);
        setIsRealtimeConnected(false);
      }
    } catch (err) {
      console.warn('[CustomerCatalog] Network error fetching products:', err);
      const local = getLocalProducts();
      setProducts(local);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingProducts(false);
    }
  }, []);

  /**
   * REQUIREMENT 1 & 2: SUPABASE REALTIME SUBSCRIPTION & PROPER CLEANUP
   * 1. Fetches fresh data on mount directly from Supabase.
   * 2. Sets up an active Supabase Realtime channel on table 'products'.
   * 3. Whenever any INSERT, UPDATE, or DELETE occurs, triggers instant re-fetch so all devices update.
   * 4. Cleans up subscription on unmount to prevent leaks and duplicate listeners.
   */
  useEffect(() => {
    // 1. Initial Fresh Fetch
    fetchFreshProducts();

    if (!supabase) return;

    // 2. Setup Realtime Channel Listener
    const channelId = `customer-catalog-realtime-${Math.random().toString(36).substring(2, 9)}`;
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
          console.log('[CustomerCatalog] Realtime notification received:', payload.eventType, payload);
          // Refetch fresh data from database so state immediately reflects changes on all mobile devices
          fetchFreshProducts();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[CustomerCatalog] Realtime channel state: ${status}`, err);
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

  // Manual Trigger Wrapper
  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await fetchFreshProducts();
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
        if (selectedCategory && selectedCategory !== 'all' && item.category !== selectedCategory) {
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
  const handleOpenProduct = (product) => {
    setActiveModalProduct(product);
    setSelectedSize(product.sizes?.[0] || '');
  };

  // Close Product Modal
  const handleCloseProduct = () => {
    setActiveModalProduct(null);
    setSelectedSize('');
  };

  // Construct Direct Order Message for Telegram & WhatsApp
  const generateOrderMessage = (product, size) => {
    const title = getProductTitle(product);
    const sizeStr = size ? size : 'Standard';

    if (language === 'am') {
      return `${t.orderGreeting}\n\n${t.orderInquiry}\n• የልብስ ስም: ${title}\n• ${t.orderPrice} ${Number(product.price).toLocaleString()} ${t.etbCurrency}\n• ${t.orderSize} ${sizeStr}\n• መለያ ቁጥር (ID): #${product.id.slice(0, 8)}\n\nይህ ልብስ አሁን አለ ወይ? ከአዲስ አበባ ማድረስ ይቻላል?`;
    }

    return `${t.orderGreeting}\n\n${t.orderInquiry}\n• Garment: ${title}\n• ${t.orderPrice} ${Number(product.price).toLocaleString()} ${t.etbCurrency}\n• ${t.orderSize} ${sizeStr}\n• Item Ref: #${product.id.slice(0, 8)}\n\nIs this piece currently available for delivery in Addis Ababa or international shipping?`;
  };

  const getWhatsAppOrderUrl = (product, size) => {
    const text = encodeURIComponent(generateOrderMessage(product, size));
    return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${text}`;
  };

  const getTelegramOrderUrl = (product, size) => {
    const text = encodeURIComponent(generateOrderMessage(product, size));
    return `https://t.me/share/url?url=${encodeURIComponent('https://zoma-boutique.et')}&text=${text}`;
  };

  const resetAllFilters = () => {
    if (onSelectCategory) onSelectCategory('all');
    setSearchQuery('');
    setInStockOnly(false);
    setMaxPrice(25000);
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
                if (isAdminAuthenticated && onNavigateToAdmin) {
                  onNavigateToAdmin();
                } else if (onOpenAdminAuth) {
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
              {isRealtimeConnected ? 'Supabase Realtime Live' : 'Offline / Standalone Cache'}
            </span>
            <span className="hidden sm:inline text-stone-400">·</span>
            <span className="hidden sm:inline text-stone-500">
              {language === 'am'
                ? 'በሌላ ስልክ ወይም በአስተዳዳሪው የሚጨመሩ/የሚሻሻሉ ልብሶች ወዲያውኑ ይታያሉ'
                : 'Instant real-time sync across all mobile devices & browsers'}
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
                onChange={(e) => setSortBy(e.target.value)}
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
                className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 h-3.5 w-3.5 cursor-pointer"
              />
              <span>{t.filterInStock}</span>
            </label>

            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-1.5 bg-white border border-stone-300 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.filter}</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          {categoryFilters.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Expandable Filters Panel */}
        {mobileFilterOpen && (
          <div className="md:hidden p-4 mb-6 bg-white border border-stone-200 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-stone-800">{t.filter}</span>
              <button
                onClick={resetAllFilters}
                className="text-[11px] text-stone-500 hover:text-stone-900 underline cursor-pointer"
              >
                {t.resetFilters}
              </button>
            </div>
            <div>
              <div className="flex justify-between text-xs text-stone-600 mb-1">
                <span>{t.filterPrice}</span>
                <span className="font-medium text-stone-900">{maxPrice.toLocaleString()} {t.etbCurrency}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="30000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Desktop Price Range Quick Slider */}
        <div className="hidden md:flex items-center justify-between py-2 text-xs text-stone-500">
          <div className="flex items-center gap-4">
            <span>{t.filterPrice}: <strong className="text-stone-800 font-medium">≤ {maxPrice.toLocaleString()} {t.etbCurrency}</strong></span>
            <input
              type="range"
              min="1000"
              max="30000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-36 accent-stone-900 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <span>{filteredProducts.length} {language === 'am' ? 'ልብሶች ተገኝተዋል' : 'garments listed'}</span>
            {(selectedCategory !== 'all' || searchQuery || inStockOnly || maxPrice < 25000) && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-950 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.resetFilters}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. PRODUCT GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoadingProducts && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 pt-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden border border-stone-200 animate-pulse">
                <div className="aspect-3/4 bg-stone-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-stone-200 rounded-sm w-3/4" />
                  <div className="h-3 bg-stone-100 rounded-sm w-1/2" />
                  <div className="h-5 bg-stone-200 rounded-sm w-1/3 pt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-boutique-serif text-2xl font-semibold text-stone-800 mb-2">
              {t.noProductsFound}
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm mb-6">
              {language === 'am'
                ? 'በተመረጠው መስፈርት የተገኘ ልብስ የለም። እባክዎ ፍለጋውን ወይም ማጣሪያውን ያስተካክሉ።'
                : 'No pieces match your selected filter criteria. Try adjusting the search or price slider.'}
            </p>
            <button
              onClick={resetAllFilters}
              className="px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {t.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => {
              const title = getProductTitle(product);
              const desc = getProductDesc(product);
              const isAvailable = product.is_available !== false;

              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenProduct(product)}
                  className="group bg-white rounded-xl overflow-hidden border border-stone-200/80 hover:border-stone-400/80 hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Product Image Frame */}
                  <div className="relative aspect-3/4 overflow-hidden bg-stone-100">
                    <img
                      src={product.image_url || '/src/assets/images/product_habesha_dress_1790265310480.jpg'}
                      alt={title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {isAvailable ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-200 text-[10px] font-semibold tracking-wider uppercase border border-emerald-500/30">
                          {t.inStock}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-950/85 backdrop-blur-md text-rose-200 text-[10px] font-semibold tracking-wider uppercase border border-rose-500/30">
                          {t.outOfStock}
                        </span>
                      )}
                    </div>

                    {/* Category Label */}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-stone-900/70 backdrop-blur-md text-stone-200 text-[10px] font-medium tracking-wide uppercase">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-stone-900 leading-snug line-clamp-1 group-hover:text-amber-900 transition-colors">
                        {title}
                      </h3>
                      <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase tracking-wider">
                          {t.price}
                        </span>
                        <span className="text-base sm:text-lg font-bold text-stone-900">
                          {Number(product.price).toLocaleString()} <span className="text-xs font-normal text-stone-500">{t.etbCurrency}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProduct(product);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 text-xs font-medium transition-colors cursor-pointer"
                        >
                          {t.viewDetails}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. PRODUCT DETAIL & DIRECT CONCIERGE ORDER MODAL */}
      {currentModalProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 my-8 flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseProduct}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-100/80 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Product Image */}
            <div className="md:w-1/2 aspect-square md:aspect-auto relative bg-stone-100">
              <img
                src={currentModalProduct.image_url || '/src/assets/images/product_habesha_dress_1790265310480.jpg'}
                alt={getProductTitle(currentModalProduct)}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4">
                {currentModalProduct.is_available ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-200 text-xs font-semibold tracking-wider uppercase border border-emerald-500/30">
                    {t.inStock}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-rose-950/80 backdrop-blur-md text-rose-200 text-xs font-semibold tracking-wider uppercase border border-rose-500/30">
                    {t.outOfStock}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Product Info & Order CTA */}
            <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-widest block">
                  {currentModalProduct.category}
                </span>

                <h2 className="font-boutique-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                  {getProductTitle(currentModalProduct)}
                </h2>

                <div className="text-xl sm:text-2xl font-bold text-stone-900">
                  {Number(currentModalProduct.price).toLocaleString()} <span className="text-sm font-normal text-stone-500">{t.etbCurrency}</span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-2 border-t border-stone-100">
                  {getProductDesc(currentModalProduct)}
                </p>

                {/* Available Sizes Selection */}
                {currentModalProduct.sizes && currentModalProduct.sizes.length > 0 && (
                  <div className="pt-3">
                    <span className="text-xs font-semibold text-stone-800 block mb-2">
                      {t.selectSize}:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {currentModalProduct.sizes.map((sz) => {
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Ordering Channels (WhatsApp & Telegram) */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                  {language === 'am' ? 'ቀጥታ ለማዘዝ ይምረጡ' : 'Direct Concierge Ordering'}
                </span>

                <div className="flex flex-col gap-2.5">
                  <a
                    href={getWhatsAppOrderUrl(currentModalProduct, selectedSize)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-medium text-xs tracking-wide transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.orderWhatsApp}</span>
                  </a>

                  <a
                    href={getTelegramOrderUrl(currentModalProduct, selectedSize)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#229ED9] hover:bg-[#1c8ec4] text-white font-medium text-xs tracking-wide transition-all shadow-md cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.orderTelegram}</span>
                  </a>
                </div>

                <p className="text-[10px] text-stone-400 text-center pt-1">
                  {language === 'am'
                    ? 'ትዕዛዝዎ በቀጥታ ለቦቲኩ አስተዳዳሪ ይደርሳል · የቴሌብር እና ሲቢኢ ብር ክፍያ ተቀባይነት አለው'
                    : 'Instant concierge chat with our boutique team in Addis Ababa · Telebirr & CBE Birr Accepted'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCatalog;
