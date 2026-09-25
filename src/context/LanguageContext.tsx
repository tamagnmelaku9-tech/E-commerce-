import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'am';

export interface Translations {
  brandName: string;
  brandTagline: string;
  navCatalog: string;
  navCategories: string;
  navAbout: string;
  navContact: string;
  navAdmin: string;
  navSignOut: string;
  
  // Category labels
  catAll: string;
  catWomen: string;
  catMen: string;
  catKids: string;
  catShoes: string;
  catAccessories: string;

  // Search and filter
  searchPlaceholder: string;
  filterTitle: string;
  priceRange: string;
  inStockOnly: string;
  sortBy: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  showingItems: string;
  noItemsFound: string;
  resetFilters: string;

  // Product cards & modal
  inStock: string;
  outOfStock: string;
  etbCurrency: string;
  viewDetails: string;
  selectSize: string;
  availableSizes: string;
  descriptionTitle: string;
  orderViaWhatsApp: string;
  orderViaTelegram: string;
  directOrderSubtitle: string;
  productDetails: string;
  close: string;
  handcraftedInEthiopia: string;

  // Admin Dashboard
  adminTitle: string;
  adminSubtitle: string;
  adminLogin: string;
  adminSignUp: string;
  emailLabel: string;
  passwordLabel: string;
  demoAdminLogin: string;
  loginBtn: string;
  signUpBtn: string;
  signOutBtn: string;
  statTotalItems: string;
  statOutOfStock: string;
  statTotalValue: string;
  statCategories: string;
  addNewProduct: string;
  editProduct: string;
  deleteProduct: string;
  tableColImage: string;
  tableColTitle: string;
  tableColCategory: string;
  tableColPrice: string;
  tableColSizes: string;
  tableColStatus: string;
  tableColActions: string;
  titleEn: string;
  titleAm: string;
  descEn: string;
  descAm: string;
  priceEtb: string;
  categorySelect: string;
  imageUpload: string;
  imageUrlOrUpload: string;
  uploadFileHint: string;
  saveChanges: string;
  cancel: string;
  confirmDeleteTitle: string;
  confirmDeleteDesc: string;
  deleteConfirmBtn: string;
  quickStockToggle: string;
  databaseSettings: string;
  copySqlSetup: string;
  sqlCopied: string;
  connectionStatus: string;
  connectedToSupabase: string;
  usingLocalMode: string;
  connectCustomSupabase: string;
  saveCredentials: string;
  supabaseUrlPlaceholder: string;
  supabaseKeyPlaceholder: string;

  // WhatsApp / Telegram Order Templates
  orderGreeting: string;
  orderInquiry: string;
  orderSize: string;
  orderPrice: string;
}

const translations: Record<Language, Translations> = {
  en: {
    brandName: 'ZOMA BOUTIQUE',
    brandTagline: 'Curated Ethiopian Haute Couture & Timeless Artisanal Fashion',
    navCatalog: 'Collection',
    navCategories: 'Categories',
    navAbout: 'Heritage',
    navContact: 'Concierge',
    navAdmin: 'Owner Portal',
    navSignOut: 'Sign Out',

    catAll: 'All Collections',
    catWomen: 'Women',
    catMen: 'Men',
    catKids: 'Kids',
    catShoes: 'Artisan Shoes',
    catAccessories: 'Leather & Accessories',

    searchPlaceholder: 'Search clothing by name, style, or fabric...',
    filterTitle: 'Filters',
    priceRange: 'Price Range',
    inStockOnly: 'In Stock Only',
    sortBy: 'Sort By',
    sortNewest: 'Newest Arrivals',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    showingItems: 'Showing items',
    noItemsFound: 'No boutique items found matching your filters.',
    resetFilters: 'Reset All Filters',

    inStock: 'In Stock',
    outOfStock: 'Sold Out',
    etbCurrency: 'ETB',
    viewDetails: 'Quick View',
    selectSize: 'Select Size',
    availableSizes: 'Available Sizes',
    descriptionTitle: 'Garment Details & Craftsmanship',
    orderViaWhatsApp: 'Order via WhatsApp',
    orderViaTelegram: 'Order via Telegram',
    directOrderSubtitle: 'Directly chat with our boutique concierge in Addis Ababa for sizing advice, local hand delivery, and international DHL shipping.',
    productDetails: 'Product Details',
    close: 'Close',
    handcraftedInEthiopia: 'Handcrafted in Ethiopia · Authentic Artisan Craft',

    adminTitle: 'Store Owner Dashboard',
    adminSubtitle: 'Manage inventory, stock availability, pricing, and live Supabase catalog.',
    adminLogin: 'Owner Sign In',
    adminSignUp: 'Create Store Manager Account',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    demoAdminLogin: '1-Click Quick Demo Sign In',
    loginBtn: 'Sign In to Dashboard',
    signUpBtn: 'Create Account',
    signOutBtn: 'Log Out',
    statTotalItems: 'Total Garments Listed',
    statOutOfStock: 'Sold Out Items',
    statTotalValue: 'Total Inventory Valuation',
    statCategories: 'Active Collections',
    addNewProduct: 'Add New Garment',
    editProduct: 'Edit Product Details',
    deleteProduct: 'Remove Item',
    tableColImage: 'Preview',
    tableColTitle: 'Title & Description',
    tableColCategory: 'Category',
    tableColPrice: 'Price (ETB)',
    tableColSizes: 'Sizes',
    tableColStatus: 'Stock Status',
    tableColActions: 'Actions',
    titleEn: 'Title (English)',
    titleAm: 'Title (Amharic)',
    descEn: 'Description (English)',
    descAm: 'Description (Amharic)',
    priceEtb: 'Price in ETB',
    categorySelect: 'Collection Category',
    imageUpload: 'Product Photograph',
    imageUrlOrUpload: 'Image URL or Upload File',
    uploadFileHint: 'Supports JPG, PNG, WEBP up to 5MB. Stored directly in Supabase Storage.',
    saveChanges: 'Save Product',
    cancel: 'Cancel',
    confirmDeleteTitle: 'Remove Product from Catalog',
    confirmDeleteDesc: 'Are you sure you want to delete this piece? This action will remove it from the catalog.',
    deleteConfirmBtn: 'Confirm Delete',
    quickStockToggle: 'Quick Stock Toggle',
    databaseSettings: 'Supabase Database & API Keys',
    copySqlSetup: 'View & Copy Supabase SQL DDL',
    sqlCopied: 'SQL Copied to Clipboard!',
    connectionStatus: 'Database Status',
    connectedToSupabase: 'Connected to Supabase PostgreSQL & Storage',
    usingLocalMode: 'Local Storage Sandbox Mode (Plug in Supabase credentials anytime)',
    connectCustomSupabase: 'Configure Supabase Connection',
    saveCredentials: 'Save & Reconnect',
    supabaseUrlPlaceholder: 'https://xyzcompany.supabase.co',
    supabaseKeyPlaceholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

    orderGreeting: 'Hello Zoma Boutique Concierge!',
    orderInquiry: 'I would like to order the following garment from your boutique:',
    orderSize: 'Selected Size:',
    orderPrice: 'Price:',
  },
  am: {
    brandName: 'ዞማ ቡቲክ',
    brandTagline: 'የተመረጡ የኢትዮጵያ ዘመናዊና ባህላዊ አልባሳትና የጥበብ ስራዎች',
    navCatalog: 'ስብስቦች',
    navCategories: 'ምድቦች',
    navAbout: 'ታሪካችን',
    navContact: 'ያግኙን',
    navAdmin: 'የባለቤት ገጽ',
    navSignOut: 'ውጣ',

    catAll: 'ሁሉም ስብስቦች',
    catWomen: 'የሴቶች አልባሳት',
    catMen: 'የወንዶች አልባሳት',
    catKids: 'የልጆች',
    catShoes: 'የቆዳ ጫማዎች',
    catAccessories: 'የቆዳ ሻንጣና ጌጣጌጦች',

    searchPlaceholder: 'በልብስ ስም፣ አይነት ወይም የጨርቅ አይነት ይፈልጉ...',
    filterTitle: 'ማጣሪያዎች',
    priceRange: 'የዋጋ ክልል',
    inStockOnly: 'አሁን ያሉትን ብቻ አሳይ',
    sortBy: 'ቅደም ተከተል',
    sortNewest: 'አዲስ የገቡ አልባሳት',
    sortPriceAsc: 'ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ',
    sortPriceDesc: 'ዋጋ፡ ከከፍተኛ ወደ ዝቅተኛ',
    showingItems: 'የተገኙ እቃዎች',
    noItemsFound: 'በተመረጠው መስፈርት የተገኘ ልብስ የለም።',
    resetFilters: 'ማጣሪያዎችን አጽዳ',

    inStock: 'አለ',
    outOfStock: 'ያለቀ',
    etbCurrency: 'ብር',
    viewDetails: 'ዝርዝር እይ',
    selectSize: 'መጠን ይምረጡ',
    availableSizes: 'ያሉ መጠኖች',
    descriptionTitle: 'የልብሱ ዝርዝር መረጃና ጥበብ',
    orderViaWhatsApp: 'በዋትስአፕ ይዘዙ',
    orderViaTelegram: 'በቴሌግራም ይዘዙ',
    directOrderSubtitle: 'የልብሱን ትክክለኛ ልክና አድራሻ ለማረጋገጥ ከአዲስ አበባው የቡቲክ ባለሙያችን ጋር በቀጥታ ይወያዩ። በአዲስ አበባ ፈጣን ማድረስ እና ወደ ውጭ ሀገራት በDHL እንልካለን።',
    productDetails: 'የእቃው ዝርዝር',
    close: 'ዝጋ',
    handcraftedInEthiopia: 'በኢትዮጵያ በእጅ የተሰራ · እውነተኛ የሀገር ጥበብ',

    adminTitle: 'የሱቅ ባለቤት ማኔጅመንት',
    adminSubtitle: 'የእቃዎችን ክምችት፣ ዋጋ፣ አዲስ ልብሶችን መመዝገብና የሱፓቤዝ ዳታቤዝ ያስተዳድሩ።',
    adminLogin: 'የባለቤት መግቢያ',
    adminSignUp: 'አዲስ የአስተዳዳሪ አካውንት',
    emailLabel: 'የኢሜይል አድራሻ',
    passwordLabel: 'የይለፍ ቃል',
    demoAdminLogin: 'በ1-ጠቅታ ፈጣን የአስተዳዳሪ ማሳያ ግባ',
    loginBtn: 'ወደ ዳሽቦርድ ግባ',
    signUpBtn: 'አካውንት ፍጠር',
    signOutBtn: 'ውጣ',
    statTotalItems: 'ጠቅላላ የተመዘገቡ እቃዎች',
    statOutOfStock: 'ያለቁ እቃዎች ብዛት',
    statTotalValue: 'ጠቅላላ የክምችት ዋጋ',
    statCategories: 'ያሉ ንቁ ምድቦች',
    addNewProduct: 'አዲስ እቃ መዝግብ',
    editProduct: 'የእቃውን መረጃ አሻሽል',
    deleteProduct: 'እቃውን ሰርዝ',
    tableColImage: 'ምስል',
    tableColTitle: 'የእቃው ስምና መግለጫ',
    tableColCategory: 'ምድብ',
    tableColPrice: 'ዋጋ (ብር)',
    tableColSizes: 'መጠኖች',
    tableColStatus: 'የክምችት ሁኔታ',
    tableColActions: 'ተግባራት',
    titleEn: 'የእቃው ስም (በእንግሊዝኛ)',
    titleAm: 'የእቃው ስም (በአማርኛ)',
    descEn: 'መግለጫ (በእንግሊዝኛ)',
    descAm: 'መግለጫ (በአማርኛ)',
    priceEtb: 'ዋጋ በኢትዮጵያ ብር',
    categorySelect: 'የስብስቡ ምድብ',
    imageUpload: 'የልብሱ ፎቶግራፍ',
    imageUrlOrUpload: 'የምስል ሊንክ ወይም ፋይል ይጫኑ',
    uploadFileHint: 'JPG, PNG, WEBP እስከ 5MB ድረስ ይደግፋል። በቀጥታ በሱፓቤዝ ስቶሬጅ ላይ ይቀመጣል።',
    saveChanges: 'እቃውን መዝግብ',
    cancel: 'ይቅር',
    confirmDeleteTitle: 'እቃውን ከስብስቡ መሰረዝ',
    confirmDeleteDesc: 'ይህን እቃ ከቡቲክ ዝርዝር ውስጥ ሙሉ በሙሉ መሰረዝ ይፈልጋሉ?',
    deleteConfirmBtn: 'አዎ ሰርዝ',
    quickStockToggle: 'ፈጣን የክምችት መቀየሪያ',
    databaseSettings: 'የሱፓቤዝ ዳታቤዝ ቅንብሮች',
    copySqlSetup: 'የሱፓቤዝ SQL ስክሪፕት ኮፒ አድርግ',
    sqlCopied: 'የSQL ስክሪፕት ኮፒ ተደርጓል!',
    connectionStatus: 'የዳታቤዝ ሁኔታ',
    connectedToSupabase: 'ከሱፓቤዝ ፖስትግረስና ስቶሬጅ ጋር ተገናኝቷል',
    usingLocalMode: 'የአካባቢ ማሳያ ሞድ (የሱፓቤዝ ቁልፎችን በማንኛውም ጊዜ ማስገባት ይችላሉ)',
    connectCustomSupabase: 'የሱፓቤዝ ግንኙነት አዋቅር',
    saveCredentials: 'መዝግብና አገናኝ',
    supabaseUrlPlaceholder: 'https://xyzcompany.supabase.co',
    supabaseKeyPlaceholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

    orderGreeting: 'ሰላም ዞማ ቡቲክ!',
    orderInquiry: 'ይህንን ልብስ ከሱቃችሁ ማዘዝ እፈልጋለሁ፡',
    orderSize: 'የተመረጠ መጠን፡',
    orderPrice: 'ዋጋ፡',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  getProductTitle: (product: { title_en?: string; title_am?: string }) => string;
  getProductDesc: (product: { description_en?: string; description_am?: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'zoma_boutique_lang';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'am') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  const t = translations[language];

  // Helper with fallback for product title based on active language
  const getProductTitle = (product: { title_en?: string; title_am?: string }): string => {
    if (language === 'am') {
      return product.title_am || product.title_en || 'ያልተሰየመ ልብስ';
    }
    return product.title_en || product.title_am || 'Untitled Garment';
  };

  // Helper with fallback for product description
  const getProductDesc = (product: { description_en?: string; description_am?: string }): string => {
    if (language === 'am') {
      return product.description_am || product.description_en || '';
    }
    return product.description_en || product.description_am || '';
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getProductTitle,
        getProductDesc,
      }}
    >
      <div className={language === 'am' ? 'font-amharic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
