import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Lock, ShieldCheck, Menu, X, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  currentView: 'catalog' | 'admin';
  setCurrentView: (view: 'catalog' | 'admin') => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  isAdminAuthenticated: boolean;
  onOpenAdminAuth: () => void;
  onSignOutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  selectedCategory,
  onSelectCategory,
  isAdminAuthenticated,
  onOpenAdminAuth,
  onSignOutAdmin,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { id: 'all', label: t.catAll },
    { id: 'women', label: t.catWomen },
    { id: 'men', label: t.catMen },
    { id: 'shoes', label: t.catShoes },
    { id: 'accessories', label: t.catAccessories },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* ZONE 1: Single Brand Wordmark */}
          <button
            onClick={() => {
              setCurrentView('catalog');
              onSelectCategory('all');
            }}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="font-boutique-serif text-2xl sm:text-3xl font-bold tracking-wider text-stone-900 group-hover:text-amber-900 transition-colors uppercase">
              {t.brandName}
            </span>
          </button>

          {/* ZONE 2: 4-6 Clean Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            {categories.map((cat) => {
              const isActive = currentView === 'catalog' && selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCurrentView('catalog');
                    onSelectCategory(cat.id);
                  }}
                  className={`cursor-pointer transition-colors relative py-1 focus:outline-none ${
                    isActive
                      ? 'text-stone-950 font-semibold'
                      : 'hover:text-stone-900 text-stone-600'
                  }`}
                >
                  <span className="whitespace-nowrap">{cat.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: 1-2 Primary Action Controls */}
          <div className="flex items-center gap-3">
            {/* Bilingual Switcher Button */}
            <button
              onClick={toggleLanguage}
              title={language === 'en' ? 'ቀይር ወደ አማርኛ' : 'Switch to English'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 hover:border-stone-900 bg-white/70 hover:bg-white text-stone-800 text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-stone-600" />
              <span className="whitespace-nowrap font-mono uppercase">
                {language === 'en' ? 'አማርኛ' : 'EN'}
              </span>
            </button>

            {/* Admin Dashboard / Login Button */}
            {currentView === 'admin' ? (
              <button
                onClick={() => setCurrentView('catalog')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t.navCatalog}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isAdminAuthenticated) {
                    setCurrentView('admin');
                  } else {
                    onOpenAdminAuth();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                {isAdminAuthenticated ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.navAdmin}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-stone-300" />
                    <span>{t.navAdmin}</span>
                  </>
                )}
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-700 hover:text-stone-950 focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#FAF9F5] px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-2 px-2">
            {t.navCategories}
          </div>
          {categories.map((cat) => {
            const isActive = currentView === 'catalog' && selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCurrentView('catalog');
                  onSelectCategory(cat.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'bg-stone-200/70 text-stone-900 font-semibold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
          
          <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
            <button
              onClick={() => {
                if (isAdminAuthenticated) {
                  setCurrentView('admin');
                } else {
                  onOpenAdminAuth();
                }
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-stone-900 rounded-lg cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{t.navAdmin}</span>
            </button>
            {isAdminAuthenticated && (
              <button
                onClick={() => {
                  onSignOutAdmin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-xs font-medium text-stone-600 hover:text-red-600 transition-colors"
              >
                {t.navSignOut}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
