import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { CustomerCatalog } from './components/CustomerCatalog';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './lib/supabaseClient';
import { Send, MessageCircle, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

const MainApp: React.FC = () => {
  const { language, t } = useLanguage();

  // Navigation and View state
  const [currentView, setCurrentView] = useState<'catalog' | 'admin'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zoma_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Check if Supabase session is active
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setIsAdminAuthenticated(true);
          try {
            localStorage.setItem('zoma_admin_auth', 'true');
          } catch {}
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setIsAdminAuthenticated(true);
          try {
            localStorage.setItem('zoma_admin_auth', 'true');
          } catch {}
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  // Auth Handlers
  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('admin');
    try {
      localStorage.setItem('zoma_admin_auth', 'true');
    } catch {}
  };

  const handleAdminLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Signout error:', e);
      }
    }
    setIsAdminAuthenticated(false);
    setCurrentView('catalog');
    try {
      localStorage.removeItem('zoma_admin_auth');
    } catch {}
  };

  const handleOpenAdminAuth = () => {
    setCurrentView('admin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      
      {/* 1. Global Announcement / Trust Banner */}
      <div className="bg-stone-900 text-stone-300 text-[11px] sm:text-xs py-2 px-4 text-center font-medium border-b border-stone-800 flex items-center justify-center gap-3">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>
          {language === 'am'
            ? 'አዲስ አበባ ውስጥ በነፃ ማድረስ · የቴሌብር እና ሲቢኢ ብር ክፍያ እንደግፋለን · አለም አቀፍ ጭነት በDHL'
            : 'Complimentary Concierge Hand-Delivery in Addis Ababa · Telebirr & CBE Accepted · Worldwide DHL Dispatch'}
        </span>
      </div>

      {/* 2. Top Bar Contract Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdminAuth={handleOpenAdminAuth}
        onSignOutAdmin={handleAdminLogout}
      />

      {/* 3. Main Content Router */}
      <main className="flex-1">
        {currentView === 'catalog' ? (
          <CustomerCatalog
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenAdminAuth={handleOpenAdminAuth}
            isAdminAuthenticated={isAdminAuthenticated}
            onNavigateToAdmin={() => setCurrentView('admin')}
          />
        ) : (
          <AdminDashboard
            onBackToCatalog={() => setCurrentView('catalog')}
            isAdminAuthenticated={isAdminAuthenticated}
            onAdminLoginSuccess={handleAdminLoginSuccess}
            onAdminLogout={handleAdminLogout}
          />
        )}
      </main>

      {/* 4. Floating Direct Telegram / WhatsApp Concierge Trigger on Catalog View */}
      {currentView === 'catalog' && (
        <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2.5">
          <a
            href="https://t.me/zomaboutique_et"
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on Telegram"
            className="w-12 h-12 rounded-full bg-[#229ED9] hover:bg-[#1c8ec4] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </a>
          <a
            href="https://wa.me/251911223344"
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          >
            <MessageCircle className="w-6 h-6" />
          </a>
        </div>
      )}

      {/* 5. Minimalist Authentic Boutique Footer */}
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-20 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800 text-xs">
            
            {/* Column 1: Brand & Ethos */}
            <div className="space-y-3">
              <span className="font-boutique-serif text-2xl font-bold tracking-wider text-white uppercase block">
                {t.brandName}
              </span>
              <p className="text-stone-400 leading-relaxed">
                {language === 'am'
                  ? 'የኢትዮጵያን ጥንታዊ የሽመና ጥበብና ንፁህ የተፈጥሮ ቆዳ ከዘመናዊ ዲዛይን ጋር አጣምሮ የሚያቀርብ ከፍተኛ የፋሽን መደብር።'
                  : 'Bridging centuries of Ethiopian Shemane loom craftsmanship, royal tilet border embroidery, and modern luxury tailoring.'}
              </p>
              <div className="flex items-center gap-1.5 text-stone-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Addis Ababa Registered Boutique</span>
              </div>
            </div>

            {/* Column 2: Collections */}
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-stone-200 mb-3 text-[11px]">
                {t.navCategories}
              </h4>
              <ul className="space-y-2 text-stone-400">
                <li>
                  <button
                    onClick={() => {
                      setCurrentView('catalog');
                      setSelectedCategory('women');
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t.catWomen}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCurrentView('catalog');
                      setSelectedCategory('men');
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t.catMen}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCurrentView('catalog');
                      setSelectedCategory('shoes');
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t.catShoes}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCurrentView('catalog');
                      setSelectedCategory('accessories');
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t.catAccessories}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Atelier & Location */}
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-stone-200 mb-3 text-[11px]">
                {language === 'am' ? 'ሱቃችንና አድራሻችን' : 'Flagship Atelier'}
              </h4>
              <ul className="space-y-2.5 text-stone-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Bole Medhanialem, Edna Mall Road, Addis Ababa, Ethiopia</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>+251 911 223 344</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>concierge@zoma-boutique.et</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Mon – Sat: 9:00 AM – 8:00 PM EAT</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Owner Portal & Orders */}
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-stone-200 mb-3 text-[11px]">
                {language === 'am' ? 'የአስተዳዳሪ መግቢያ' : 'Store Management'}
              </h4>
              <p className="text-stone-400 mb-3 leading-relaxed">
                {language === 'am'
                  ? 'የሱቅ ባለቤቶችና ስራ አስኪያጆች እቃዎችን ለማስተዳደር እዚህ ይግቡ።'
                  : 'Authorized boutique managers can update inventory, prices, and stock.'}
              </p>
              <button
                onClick={() => {
                  if (isAdminAuthenticated) {
                    setCurrentView('admin');
                  } else {
                    handleOpenAdminAuth();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium text-xs tracking-wider uppercase border border-stone-700 transition-colors cursor-pointer"
              >
                {isAdminAuthenticated ? t.adminTitle : t.adminLogin}
              </button>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            <div>
              © {new Date().getFullYear()} ZOMA BOUTIQUE / ዞማ ቡቲክ. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-stone-400">
              <span>Bilingual EN / አማርኛ</span>
              <span aria-hidden="true">·</span>
              <span>Supabase Realtime Sync</span>
              <span aria-hidden="true">·</span>
              <span>Addis Ababa, Ethiopia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
