import React, { useState, useEffect } from 'react';
import { MainScreen } from './components/MainScreen';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { DailyPricePage } from './components/DailyPricePage';
import { BillingPage } from './components/BillingPage';
import { RegisterPage } from './components/RegisterPage';
import { TotalPage } from './components/TotalPage';
import { HotelPage } from './components/HotelPage';
import { ReceiptModal } from './components/ReceiptModal';
import { BackupCleanupModal } from './components/BackupCleanupModal';
import { RetailApp } from './retail/RetailApp';
import { InvestmentApp } from './investment/InvestmentApp';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  ActiveScreen,
  AppPage,
  Bill,
  DailyPriceRecord,
  HotelItem,
  HotelPayment,
  LanguageCode,
  ProductItem,
  ShopSettings,
  StoreConfig,
} from './types';
import {
  addBill,
  addHotelPayment,
  deleteBill,
  deleteHotelPayment,
  getTodayDailyPrices,
  getTodayDateString,
  loadBills,
  loadHotelPayments,
  loadHotels,
  loadLanguage,
  loadProducts,
  loadSettings,
  saveHotels,
  saveLanguage,
  saveProducts,
  saveSettings,
  saveTodayDailyPrices,
  execute31DayDataCleanup,
  executeDataCleanup,
  checkPendingCleanup,
  exportAllDataToFile,
  initPhoneStorage,
} from './utils/storage';

const DEFAULT_STORE_CONFIG: StoreConfig = {
  name: 'SSS CHICKEN AND EGG AGENCY',
  fontSize: 28,
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('main');
  const [currentPage, setCurrentPage] = useState<AppPage>('billing');

  // Stored state for branding
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem('chicken_agency_store_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.fontSize) {
          if (parsed.name === 'Apex Poultry Agency' || parsed.name === 'SSS CHICKEN AGENCY') {
            return { ...parsed, name: 'SSS CHICKEN AND EGG AGENCY' };
          }
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_STORE_CONFIG;
  });

  // Wholesale application state
  const [settings, setSettings] = useState<ShopSettings>(() => loadSettings());
  const [language, setLanguage] = useState<LanguageCode>(() => loadLanguage());
  const [isBold, setIsBold] = useState<boolean>(() => Boolean(loadSettings().isBoldText));
  const [products, setProducts] = useState<ProductItem[]>(() => loadProducts());
  const [dailyPrices, setDailyPrices] = useState<DailyPriceRecord | null>(() => getTodayDailyPrices());
  const [bills, setBills] = useState<Bill[]>(() => loadBills());
  const [hotels, setHotels] = useState<HotelItem[]>(() => loadHotels());
  const [payments, setPayments] = useState<HotelPayment[]>(() => loadHotelPayments());

  // Cleanup & Archival backup prompt modal state
  const [cleanupModalState, setCleanupModalState] = useState<{
    isOpen: boolean;
    billsToArchive: number;
    paymentsToArchive: number;
  }>({
    isOpen: false,
    billsToArchive: 0,
    paymentsToArchive: 0,
  });

  // Check data retention and initialize on-device phone storage on application startup
  useEffect(() => {
    // 1. Initialize persistent on-device phone storage
    initPhoneStorage().then(() => {
      const refreshedBills = loadBills();
      if (refreshedBills.length > 0) setBills(refreshedBills);
      const refreshedHotels = loadHotels();
      if (refreshedHotels.length > 0) setHotels(refreshedHotels);
      const refreshedPayments = loadHotelPayments();
      if (refreshedPayments.length > 0) setPayments(refreshedPayments);
    });

    try {
      const pending = checkPendingCleanup(settings.retentionDays);
      if (pending.billsToArchive > 0) {
        setCleanupModalState({
          isOpen: true,
          billsToArchive: pending.billsToArchive,
          paymentsToArchive: pending.paymentsToArchive,
        });
      } else if (pending.willDeleteData) {
        const cleanup = executeDataCleanup(settings.retentionDays);
        if (cleanup.totalRemoved > 0) {
          setBills(loadBills());
          setPayments(loadHotelPayments());
          setDailyPrices(getTodayDailyPrices());
        }
      }
    } catch (e) {
      console.error('Data retention check error:', e);
    }
  }, []);

  const handleDownloadBackupAndCleanup = () => {
    try {
      exportAllDataToFile();
    } catch (e) {
      console.error('Backup export error:', e);
    }
    const result = executeDataCleanup(settings.retentionDays);
    if (result.totalRemoved > 0) {
      setBills(loadBills());
      setPayments(loadHotelPayments());
      setDailyPrices(getTodayDailyPrices());
    }
    setCleanupModalState({ isOpen: false, billsToArchive: 0, paymentsToArchive: 0 });
  };

  const handleCleanupNow = () => {
    const result = executeDataCleanup(settings.retentionDays);
    if (result.totalRemoved > 0) {
      setBills(loadBills());
      setPayments(loadHotelPayments());
      setDailyPrices(getTodayDailyPrices());
    }
    setCleanupModalState({ isOpen: false, billsToArchive: 0, paymentsToArchive: 0 });
  };

  // Receipt Modal State (for Print / WhatsApp Share / Reprint)
  const [receiptState, setReceiptState] = useState<{
    isOpen: boolean;
    bill: Bill | null;
    isDraft: boolean;
    autoPrintBluetooth?: boolean;
    onSaved?: () => void;
  }>({
    isOpen: false,
    bill: null,
    isDraft: false,
    autoPrintBluetooth: false,
  });

  // Keep store config persisted
  useEffect(() => {
    try {
      localStorage.setItem('chicken_agency_store_config', JSON.stringify(storeConfig));
    } catch {
      // Ignore storage errors
    }
  }, [storeConfig]);

  // Sync bold styling
  useEffect(() => {
    if (isBold) {
      document.body.classList.add('app-bold-mode');
    } else {
      document.body.classList.remove('app-bold-mode');
    }
  }, [isBold]);

  // Sync language attribute and class on document
  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'ta') {
      document.body.classList.add('lang-ta');
    } else {
      document.body.classList.remove('lang-ta');
    }
  }, [language]);

  // Sync font size scaling
  useEffect(() => {
    if (settings.fontSizeScale) {
      document.documentElement.style.fontSize = `${settings.fontSizeScale}%`;
    }
  }, [settings.fontSizeScale]);

  // Reload all data after JSON restore or major update
  const refreshAllData = () => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
    setProducts(loadProducts());
    setDailyPrices(getTodayDailyPrices());
    setBills(loadBills());
    setHotels(loadHotels());
    setPayments(loadHotelPayments());
    setIsBold(Boolean(loadedSettings.isBoldText));
    if (loadedSettings.fontSizeScale) {
      document.documentElement.style.fontSize = `${loadedSettings.fontSizeScale}%`;
    }
  };

  // Toggle Language Handler
  const handleToggleLanguage = () => {
    const nextLang: LanguageCode = language === 'en' ? 'ta' : 'en';
    setLanguage(nextLang);
    saveLanguage(nextLang);
  };

  // Toggle Bold Text Handler
  const handleToggleBold = () => {
    const nextBold = !isBold;
    setIsBold(nextBold);
    const updatedSettings: ShopSettings = { ...settings, isBoldText: nextBold };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  // Increase Font Size Handler (Accessibility for Elderly User)
  const handleIncreaseFontSize = () => {
    const current = settings.fontSizeScale || 125;
    const next = Math.min(160, current + 15);
    const updatedSettings: ShopSettings = { ...settings, fontSizeScale: next };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    document.documentElement.style.fontSize = `${next}%`;
  };

  // Decrease Font Size Handler
  const handleDecreaseFontSize = () => {
    const current = settings.fontSizeScale || 125;
    const next = Math.max(90, current - 15);
    const updatedSettings: ShopSettings = { ...settings, fontSizeScale: next };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    document.documentElement.style.fontSize = `${next}%`;
  };

  // Set Explicit Font Size Scale Handler
  const handleSetFontSize = (scale: number) => {
    const updatedSettings: ShopSettings = { ...settings, fontSizeScale: scale };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    document.documentElement.style.fontSize = `${scale}%`;
  };

  // Save Daily Prices
  const handleSaveDailyPrices = (prices: Record<string, number>) => {
    const newRecord = saveTodayDailyPrices(prices);
    setDailyPrices(newRecord);
  };

  // Save New Bill
  const handleSaveBill = (newBill: Bill) => {
    const updated = addBill(newBill);
    setBills(updated);
  };

  // Delete Bill
  const handleDeleteBill = (billId: string) => {
    const updated = deleteBill(billId);
    setBills(updated);
  };

  // Add Hotel Payment
  const handleAddPayment = (newPayment: HotelPayment) => {
    const updated = addHotelPayment(newPayment);
    setPayments(updated);
  };

  // Delete Hotel Payment
  const handleDeletePayment = (paymentId: string) => {
    const updated = deleteHotelPayment(paymentId);
    setPayments(updated);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsBold(Boolean(newSettings.isBoldText));
    if (newSettings.fontSizeScale) {
      document.documentElement.style.fontSize = `${newSettings.fontSizeScale}%`;
    }
  };

  // Save Hotels
  const handleSaveHotels = (newHotels: HotelItem[]) => {
    setHotels(newHotels);
    saveHotels(newHotels);
  };

  // Add Hotel from Billing quick add
  const handleAddHotelFromBilling = (nameEn: string, nameTa: string) => {
    const newHotel: HotelItem = {
      id: 'h_' + Date.now(),
      nameEn,
      nameTa,
    };
    const updated = [...hotels, newHotel];
    handleSaveHotels(updated);
  };

  // Add Product from Billing quick add
  const handleAddProductFromBilling = (nameEn: string, nameTa: string, price: number) => {
    const newProduct: ProductItem = {
      id: 'p_' + Date.now(),
      name: nameEn || nameTa,
      nameEn,
      nameTa,
      pricePerKg: price,
      isCustom: true,
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    saveProducts(updated);
  };

  // Delete Product
  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
  };

  // Open Receipt Modal
  const handleOpenReceipt = (
    bill: Bill,
    isDraft = false,
    onSaved?: () => void,
    autoPrintBluetooth = false
  ) => {
    setReceiptState({
      isOpen: true,
      bill,
      isDraft,
      autoPrintBluetooth,
      onSaved,
    });
  };

  // Close Receipt Modal
  const handleCloseReceipt = () => {
    setReceiptState((prev) => ({ ...prev, isOpen: false }));
  };

  // Confirm Save Draft Bill
  const handleConfirmSaveDraft = () => {
    if (receiptState.bill && receiptState.isDraft) {
      handleSaveBill(receiptState.bill);
      if (receiptState.onSaved) {
        receiptState.onSaved();
      }
    }
    handleCloseReceipt();
  };

  return (
    <div className="h-screen h-[100dvh] bg-slate-100 flex flex-col items-center justify-center p-0 font-sans overflow-hidden">
      <div
        id="mobile-app-container"
        className="w-full max-w-md h-full h-[100dvh] bg-slate-50 sm:rounded-3xl sm:h-[95vh] sm:max-h-[920px] sm:my-auto sm:border sm:border-slate-200/90 sm:shadow-lg sm:shadow-slate-300/40 flex flex-col relative transition-all overflow-hidden"
      >
        {/* VIEW 1: Main Sector Portal Screen */}
        {activeScreen === 'main' && (
          <MainScreen
            storeConfig={storeConfig}
            onUpdateStoreConfig={setStoreConfig}
            onSelectSector={(sectorId) => {
              if (sectorId === 'wholesale') {
                setActiveScreen('wholesale');
              } else if (sectorId === 'retail') {
                setActiveScreen('retail');
              } else if (sectorId === 'investment') {
                setActiveScreen('investment');
              }
            }}
            onNavigateToLogin={() => setActiveScreen('login')}
          />
        )}

        {/* VIEW 2: Login Screen */}
        {activeScreen === 'login' && (
          <LoginScreen
            storeConfig={storeConfig}
            onLoginSuccess={() => setActiveScreen('main')}
            onBackToMain={() => setActiveScreen('main')}
          />
        )}

        {/* VIEW 3: Wholesale Billing System */}
        {activeScreen === 'wholesale' && (
          <div id="wholesale-billing-app" className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
            {/* Global Wholesale Header - Fixed at Top */}
            <div className="flex-shrink-0 z-30">
              <AppHeader
                settings={settings}
                language={language}
                currentPage={currentPage}
                onLanguageChange={(newLang) => {
                  setLanguage(newLang);
                  saveLanguage(newLang);
                }}
                onToggleLanguage={handleToggleLanguage}
                onToggleBold={handleToggleBold}
                onIncreaseFontSize={handleIncreaseFontSize}
                onDecreaseFontSize={handleDecreaseFontSize}
                onSetFontSize={handleSetFontSize}
                onBackToMain={() => setCurrentPage('billing')}
                onExitToPortal={() => setActiveScreen('main')}
                onBackToPortal={() => setActiveScreen('main')}
              />
            </div>

            {/* Wholesale Pages - Scrollable Middle Area */}
            <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-4">
              {currentPage === 'daily-price' && (
                <DailyPricePage
                  products={products}
                  dailyPrices={dailyPrices}
                  language={language}
                  onSavePrices={handleSaveDailyPrices}
                  onAddProduct={handleAddProductFromBilling}
                  onDeleteProduct={handleDeleteProduct}
                  onNavigateToBilling={() => setCurrentPage('billing')}
                />
              )}

              {currentPage === 'billing' && (
                <BillingPage
                  products={products}
                  dailyPrices={dailyPrices}
                  hotels={hotels}
                  bills={bills}
                  payments={payments}
                  settings={settings}
                  language={language}
                  onSaveBill={handleSaveBill}
                  onOpenReceipt={(bill, isDraft, onSaved) =>
                    handleOpenReceipt(bill, isDraft, onSaved)
                  }
                  onNavigateToDailyPrice={() => setCurrentPage('daily-price')}
                  onNavigateToHotel={() => setCurrentPage('hotel')}
                  onAddHotel={handleAddHotelFromBilling}
                  onAddProduct={handleAddProductFromBilling}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}

              {currentPage === 'register' && (
                <RegisterPage
                  bills={bills}
                  settings={settings}
                  language={language}
                  onDeleteBill={handleDeleteBill}
                  onReprintBill={(bill) => handleOpenReceipt(bill, false)}
                />
              )}

              {currentPage === 'total' && (
                <TotalPage
                  bills={bills}
                  products={products}
                  language={language}
                  onNavigateToHotel={() => setCurrentPage('hotel')}
                />
              )}

              {currentPage === 'hotel' && (
                <HotelPage
                  hotels={hotels}
                  bills={bills}
                  payments={payments}
                  settings={settings}
                  language={language}
                  onAddPayment={handleAddPayment}
                  onDeletePayment={handleDeletePayment}
                  onReprintBill={(bill) => handleOpenReceipt(bill, false)}
                />
              )}
            </main>

            {/* Fixed Bottom Navigation Bar - Pinned at Bottom */}
            <div className="flex-shrink-0 z-40">
              <BottomNav
                currentPage={currentPage}
                activePage={currentPage}
                language={language}
                onPageChange={(page) => setCurrentPage(page)}
                onSelectPage={(page) => setCurrentPage(page)}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: Retail Billing & POS System */}
        {activeScreen === 'retail' && (
          <div id="retail-billing-app" className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
            <RetailApp onBackToPortal={() => setActiveScreen('main')} />
          </div>
        )}

        {/* VIEW 5: Investment & Stock Module */}
        {activeScreen === 'investment' && (
          <div id="investment-billing-app" className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
            <InvestmentApp onBackToPortal={() => setActiveScreen('main')} />
          </div>
        )}

        {/* Global Bill Receipt & Bluetooth / WhatsApp Share Modal */}
        <ReceiptModal
          isOpen={receiptState.isOpen}
          bill={receiptState.bill}
          isDraft={receiptState.isDraft}
          settings={settings}
          language={language}
          hotels={hotels}
          products={products}
          payments={payments}
          bills={bills}
          autoPrintBluetooth={receiptState.autoPrintBluetooth}
          onConfirmSave={handleConfirmSaveDraft}
          onClose={handleCloseReceipt}
          onUpdateHotels={(newHotels) => {
            setHotels(newHotels);
            setBills(loadBills());
          }}
        />

        {/* Data Retention & Archival Backup Prompt Modal */}
        <BackupCleanupModal
          isOpen={cleanupModalState.isOpen}
          billsToArchiveCount={cleanupModalState.billsToArchive}
          paymentsToArchiveCount={cleanupModalState.paymentsToArchive}
          retentionDays={settings.retentionDays ?? 31}
          language={language}
          onDownloadAndCleanup={handleDownloadBackupAndCleanup}
          onCleanupNow={handleCleanupNow}
          onClose={() => setCleanupModalState({ isOpen: false, billsToArchive: 0, paymentsToArchive: 0 })}
        />

        {/* PWA Offline Banner */}
        <OfflineIndicator />
      </div>
    </div>
  );
}
