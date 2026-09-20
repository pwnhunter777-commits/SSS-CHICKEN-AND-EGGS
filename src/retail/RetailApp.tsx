import React, { useState, useEffect } from 'react';
import { Page, Language, ShopSettings, Product } from './types';
import {
  loadSettings,
  saveSettings,
  loadProducts,
  loadLanguage,
  saveLanguage,
  saveFontSizeScale,
} from './utils/storage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DailyPricePage } from './pages/DailyPricePage';
import { BillingPage } from './pages/BillingPage';
import { RegisterPage } from './pages/RegisterPage';
import { TotalPage } from './pages/TotalPage';
import { InstallAppModal } from './components/InstallAppModal';

interface RetailAppProps {
  onBackToPortal?: () => void;
}

export const RetailApp: React.FC<RetailAppProps> = ({ onBackToPortal }) => {
  const [currentPage, setCurrentPage] = useState<Page>('billing');
  const [language, setLanguage] = useState<Language>(() => loadLanguage());
  const [settings, setSettings] = useState<ShopSettings>(() => loadSettings());
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentPage === ('settings' as Page)) {
      setCurrentPage('billing');
    }
  }, [currentPage]);

  // Font scale zoom factor (default 1.15 for enhanced legibility)
  const fontScale =
    settings.fontSizeScale !== undefined && settings.fontSizeScale > 1.0
      ? settings.fontSizeScale
      : 1.15;

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  };

  const handleFontSizeChange = (newScale: number) => {
    const updatedSettings = { ...settings, fontSizeScale: newScale };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    saveFontSizeScale(newScale);
  };

  return (
    <div
      className="h-full min-h-0 bg-slate-100 text-slate-900 flex flex-col font-sans transition-all selection:bg-emerald-200 selection:text-emerald-950 overflow-hidden"
      style={{
        fontSize: `${fontScale * 100}%`,
      }}
    >
      {/* Retail Mobile/Desktop Centered Viewport Container */}
      <div className="w-full max-w-lg mx-auto h-full min-h-0 bg-slate-50 flex flex-col relative border-x border-slate-200 overflow-hidden">
        {/* App Header - Fixed at Top */}
        <div className="flex-shrink-0 z-30">
          <Header
            settings={settings}
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
            onInstallClick={() => setShowInstallModal(true)}
            onFontSizeChange={handleFontSizeChange}
            onExitToPortal={onBackToPortal}
          />
        </div>

        {/* Page Content Switcher - Scrollable */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {currentPage === 'daily-price' && (
            <DailyPricePage
              products={products}
              setProducts={setProducts}
              language={language}
              onPricesSaved={() => setCurrentPage('billing')}
            />
          )}

          {currentPage === 'billing' && (
            <BillingPage
              products={products}
              setProducts={setProducts}
              settings={settings}
              language={language}
            />
          )}

          {currentPage === 'register' && (
            <RegisterPage settings={settings} language={language} />
          )}

          {currentPage === 'total' && <TotalPage language={language} />}
        </main>

        {/* Bottom Navigation Bar - Pinned at Bottom */}
        <div className="flex-shrink-0 z-40">
          <BottomNav
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            language={language}
          />
        </div>

        {/* PWA / Install Application Modal */}
        <InstallAppModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          language={language}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default RetailApp;
