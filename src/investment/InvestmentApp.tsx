import React, { useState, useEffect } from 'react';
import { InvestmentBottomTab, InvestmentDayData } from './types';
import {
  getTodayDateKey,
  loadInvestmentData,
  saveInvestmentData,
  fetchDailyBillsSummary,
  getPreviousDayStock,
  PreviousDayStock,
} from './utils/storage';
import { LoadEntryPage } from './pages/LoadEntryPage';
import { DailySalesProfitPage } from './pages/DailySalesProfitPage';
import { StockRemainingPage } from './pages/StockRemainingPage';
import { InvestmentSettingsPage } from './pages/InvestmentSettingsPage';
import { InvestmentBottomNav } from './components/InvestmentBottomNav';
import { OpeningStockModal } from './components/OpeningStockModal';
import { ArrowLeft, Globe, Calendar, PackageOpen } from 'lucide-react';
import { LanguageCode } from '../types';

interface InvestmentAppProps {
  onBackToPortal: () => void;
}

export const InvestmentApp: React.FC<InvestmentAppProps> = ({ onBackToPortal }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateKey());
  const [activeTab, setActiveTab] = useState<InvestmentBottomTab>('load');
  const [previousStock, setPreviousStock] = useState<PreviousDayStock | null>(() => getPreviousDayStock(selectedDate));
  const [isOpeningStockModalOpen, setIsOpeningStockModalOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('chicken_app_language');
      return (saved === 'ta' ? 'ta' : 'en') as LanguageCode;
    } catch {
      return 'en';
    }
  });

  const [data, setData] = useState<InvestmentDayData>(() => loadInvestmentData(selectedDate));

  // Auto-sync today's wholesale & retail bills when first loading
  useEffect(() => {
    const loaded = loadInvestmentData(selectedDate);
    const summary = fetchDailyBillsSummary(selectedDate);

    // Compute previous day's closing stock
    const prev = getPreviousDayStock(selectedDate);
    setPreviousStock(prev);

    // Auto-prompt on app open next day if there is stock remaining from previous day
    // and user hasn't seen the popup for this date in the current browser session
    if (prev && (prev.chickenRemainingKg > 0 || prev.eggRemainingNos > 0)) {
      try {
        const seenKey = `apex_opening_stock_seen_${selectedDate}`;
        const hasSeen = sessionStorage.getItem(seenKey);
        if (!hasSeen) {
          setIsOpeningStockModalOpen(true);
          sessionStorage.setItem(seenKey, '1');
        }
      } catch {
        // ignore
      }
    }

    // If sales figures are unedited or zero, populate with today's live bills
    const updatedSales = {
      ...loaded.sales,
      wholesaleAmount: loaded.isCustomOverridden ? loaded.sales.wholesaleAmount : summary.wholesaleAmount,
      wholesaleKg: loaded.isCustomOverridden ? loaded.sales.wholesaleKg : summary.wholesaleKg,
      retailAmount: loaded.isCustomOverridden ? loaded.sales.retailAmount : summary.retailAmount,
      retailKg: loaded.isCustomOverridden ? loaded.sales.retailKg : summary.retailKg,
      eggAmount: loaded.isCustomOverridden ? (loaded.sales.eggAmount ?? summary.eggAmount) : summary.eggAmount,
      eggQty: loaded.isCustomOverridden ? (loaded.sales.eggQty ?? summary.eggQty) : summary.eggQty,
      eggPrice: loaded.isCustomOverridden ? (loaded.sales.eggPrice ?? summary.eggPrice) : summary.eggPrice,
    };

    // Always calculate load cost directly from chickenLoad + eggLoad so it stays in sync with 1st page
    const chickenQty = Number(loaded.chickenLoad.totalIncomeKg || 0);
    const chickenRate = Number(loaded.chickenLoad.ratePerKg || 0);
    const chickenWastage = Number(loaded.chickenLoad.wastagePercent || 0);
    const chickenNetKg = chickenWastage > 0 ? Math.round((chickenQty * (1 - chickenWastage / 100)) * 100) / 100 : chickenQty;
    const calcChickenCost = Number(loaded.chickenLoad.totalAmount || 0) > 0
      ? Number(loaded.chickenLoad.totalAmount)
      : Math.round(chickenNetKg * chickenRate * 100) / 100;

    const tares = Number(loaded.eggLoad.totalTareIncome || (loaded.eggLoad.totalIncomeCount ? loaded.eggLoad.totalIncomeCount / 30 : 0));
    const price = Number(loaded.eggLoad.pricePerTare || (loaded.eggLoad.ratePerUnit ? loaded.eggLoad.ratePerUnit * 30 : 0));
    const calcEggCost = Math.round(tares * price * 100) / 100;

    const calculatedLoadCost = Math.round((calcChickenCost + calcEggCost) * 100) / 100;
    const calculatedIncomingKg = chickenNetKg;

    if (calculatedLoadCost > 0) {
      updatedSales.loadPriceSpend = calculatedLoadCost;
      updatedSales.totalIncomeKg = calculatedIncomingKg;
    }

    const mergedData: InvestmentDayData = {
      ...loaded,
      sales: updatedSales,
    };

    setData(mergedData);
    saveInvestmentData(mergedData);
  }, [selectedDate]);

  const handleChangeData = (updated: InvestmentDayData) => {
    setData(updated);
    saveInvestmentData(updated);
  };

  const handleToggleLanguage = () => {
    const next = language === 'en' ? 'ta' : 'en';
    setLanguage(next);
    try {
      localStorage.setItem('chicken_app_language', next);
    } catch {
      // ignore
    }
  };

  return (
    <div id="investment-app-root" className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden bg-[#F8F9FA]">
      {/* Top Header - Fixed at Top */}
      <header id="investment-header" className="relative flex-shrink-0 bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 text-white shadow-lg shadow-emerald-950/15 rounded-b-3xl px-4 pt-3.5 pb-4 z-30 border-b-2 border-emerald-600/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToPortal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-950 active:bg-black text-emerald-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-600/60 active:scale-95 shadow-xs shrink-0 cursor-pointer"
              title="Return to Main Portal"
            >
              <ArrowLeft size={16} />
              <span>{language === 'ta' ? 'முகப்பு' : 'Portal'}</span>
            </button>
            <div>
              <h1 className="text-base font-black text-white tracking-tight leading-none">
                {language === 'ta' ? 'முதலீடு & லோடு' : 'Investment & Load'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Opening Stock Quick Trigger Button */}
            {previousStock && (previousStock.chickenRemainingKg > 0 || previousStock.eggRemainingNos > 0) && (
              <button
                type="button"
                id="btn-header-opening-stock"
                onClick={() => setIsOpeningStockModalOpen(true)}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-200 border border-amber-400/40 px-2 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                title={language === 'ta' ? 'தொடக்க இருப்பு விவரம்' : 'View Opening Stock'}
              >
                <PackageOpen size={13} className="text-amber-300 shrink-0" />
                <span className="hidden sm:inline font-bold text-amber-100">
                  {language === 'ta' ? 'தொடக்க இருப்பு:' : 'Opening:'}
                </span>
                <span className="text-amber-300 font-black">
                  {Math.max(0, previousStock.chickenRemainingKg)} kg
                </span>
                <span className="text-amber-400/80">|</span>
                <span className="text-orange-300 font-black">
                  {Math.floor(Math.max(0, previousStock.eggRemainingNos) / 30)} {language === 'ta' ? 'தட்டு' : 'T'}
                </span>
              </button>
            )}

            {/* Language Toggle */}
            <button
              type="button"
              onClick={handleToggleLanguage}
              className="flex items-center gap-1 bg-emerald-950/80 hover:bg-emerald-950 active:scale-95 text-white px-2.5 py-1.5 rounded-xl text-xs font-black backdrop-blur-xs transition-all border border-emerald-600/60 shadow-xs cursor-pointer"
              title="Toggle Language"
            >
              <Globe size={13} className="text-emerald-300" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-4 pt-2">
        {activeTab === 'load' && (
          <LoadEntryPage
            data={data}
            onChangeData={handleChangeData}
            language={language}
            previousStock={previousStock}
          />
        )}

        {activeTab === 'sales' && (
          <DailySalesProfitPage
            data={data}
            onChangeData={handleChangeData}
            language={language}
          />
        )}

        {activeTab === 'summary' && (
          <StockRemainingPage
            data={data}
            language={language}
            previousStock={previousStock}
          />
        )}

        {activeTab === 'settings' && (
          <InvestmentSettingsPage
            language={language}
          />
        )}
      </main>

      {/* Opening Stock Modal on Next Day Open */}
      <OpeningStockModal
        isOpen={isOpeningStockModalOpen}
        onClose={() => setIsOpeningStockModalOpen(false)}
        previousStock={previousStock}
        currentData={data}
        onChangeData={handleChangeData}
        language={language}
      />

      {/* 23 | 24 | 25 Bottom Navigation - Pinned at Bottom */}
      <div className="flex-shrink-0 z-40">
        <InvestmentBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          language={language}
        />
      </div>
    </div>
  );
};
