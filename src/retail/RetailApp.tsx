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
import { SettingsPage } from './pages/SettingsPage';
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

  // Font scale zoom factor (default 1.0)
  const fontScale =
    settings.fontSizeScale !== undefined ? settings.fontSizeScale : 1.0;

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
      className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans transition-all selection:bg-emerald-200 selection:text-emerald-950"
      style={{
        fontSize: `${fontScale * 100}%`,
      }}
    >
      {/* Retail Mobile/Desktop Centered Viewport Container */}
      <div className="w-full max-w-lg mx-auto min-h-screen bg-slate-50 flex flex-col shadow-2xl relative border-x border-slate-200">
        {/* App Header */}
        <Header
          settings={settings}
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
          onInstallClick={() => setShowInstallModal(true)}
          onFontSizeChange={handleFontSizeChange}
          onExitToPortal={onBackToPortal}
        />

        {/* Page Content Switcher */}
        <main className="flex-1 overflow-y-auto">
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

          {currentPage === 'settings' && (
            <SettingsPage
              settings={settings}
              setSettings={setSettings}
              language={language}
              onLanguageChange={handleLanguageChange}
              onExitToPortal={onBackToPortal}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNav
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          language={language}
        />

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
