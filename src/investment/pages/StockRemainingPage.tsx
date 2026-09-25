import React, { useState, useEffect } from 'react';
import { InvestmentDayData, SummarySubTab } from '../types';
import { TotalPage as WholesaleTotalView } from '../../components/TotalPage';
import { TotalPage as RetailTotalView } from '../../retail/pages/TotalPage';
import { HotelGiveDuesView } from '../components/HotelGiveDuesView';
import { loadBills as loadWholesaleBills, loadProducts as loadWholesaleProducts } from '../../utils/storage';
import { fetchDailyBillsSummary, PreviousDayStock } from '../utils/storage';
import { Bill, ProductItem, LanguageCode } from '../../types';
import { PackageOpen, ArrowRight } from 'lucide-react';

interface StockRemainingPageProps {
  data: InvestmentDayData;
  onChangeData?: (updated: InvestmentDayData) => void;
  language?: LanguageCode;
  previousStock?: PreviousDayStock | null;
  onNavigateToLoadInward?: () => void;
  onSelectDate?: (date: string) => void;
}

export const StockRemainingPage: React.FC<StockRemainingPageProps> = ({
  data,
  onChangeData,
  language = 'en',
  previousStock,
  onNavigateToLoadInward,
  onSelectDate,
}) => {
  const [subTab, setSubTab] = useState<SummarySubTab>('summary');
  const [wBills, setWBills] = useState<Bill[]>([]);
  const [wProducts, setWProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    setWBills(loadWholesaleBills());
    setWProducts(loadWholesaleProducts());
  }, []);

  const isChicken = data.itemType === 'chicken';
  const unitLabel = isChicken ? 'kg' : 'nos';

  const chickenOldStock = Number(data.chickenLoad?.oldStockKg || 0);
  const firstPageGross = isChicken ? Math.round((Number(data.chickenLoad.totalIncomeKg || 0) + chickenOldStock) * 100) / 100 : Number(data.eggLoad.totalTareIncome || 0);
  const firstPageWastage = isChicken ? Number(data.chickenLoad.wastagePercent || 0) : 0;
  const firstPageNet = isChicken
    ? (firstPageWastage > 0 ? Math.max(0, Math.round((firstPageGross * (1 - firstPageWastage / 100)) * 100) / 100) : firstPageGross)
    : (data.eggLoad.totalTareIncome ? Number(data.eggLoad.totalTareIncome) * 30 : 0);
  const chickenCost = Number(data.chickenLoad.totalAmount || 0) > 0
    ? Number(data.chickenLoad.totalAmount)
    : Math.round(firstPageGross * Number(data.chickenLoad.ratePerKg || 0) * 100) / 100;
  const eggOldStockTares = Number(data.eggLoad?.oldStockTares || 0);
  const eggTodayTares = Number(data.eggLoad?.totalTareIncome || 0);
  const eggCombinedTares = eggOldStockTares + eggTodayTares;
  const eggCost = Math.round(eggCombinedTares * (Number(data.eggLoad.pricePerTare) || 0) * 100) / 100;
  const combinedLoadCost = Math.round((chickenCost + eggCost) * 100) / 100;

  // Chicken Load Inward calculations
  const chickenGross = Number(data.chickenLoad?.totalIncomeKg || 0);
  const chickenWastage = Number(data.chickenLoad?.wastagePercent || 0);
  const chickenNet = chickenWastage > 0
    ? Math.max(0, Math.round((chickenGross * (1 - chickenWastage / 100)) * 100) / 100)
    : chickenGross;
  const incomingKg = chickenNet > 0 ? chickenNet : Number(data.sales?.totalIncomeKg || 0);

  // Opening stock from previous day (if applied)
  const isOpeningApplied = Boolean(data.openingStock?.appliedToLoad) || chickenOldStock > 0 || eggOldStockTares > 0;
  const openingChickenKg = chickenOldStock > 0 ? chickenOldStock : (isOpeningApplied ? Number(data.openingStock?.chickenKg || 0) : 0);
  const totalAvailableChickenKg = Math.round((incomingKg + openingChickenKg) * 1000) / 1000;

  // Egg Load Inward calculations
  const eggInwardTares = Number(data.eggLoad?.totalTareIncome || 0);
  const eggInwardNos = eggInwardTares * 30;
  const openingEggNos = eggOldStockTares > 0
    ? (eggOldStockTares * 30)
    : (isOpeningApplied ? Number(data.openingStock?.eggNos || 0) : 0);
  const totalAvailableEggNos = eggInwardNos + openingEggNos;

  const loadCostSpend = combinedLoadCost > 0 ? combinedLoadCost : Number(data.sales?.loadPriceSpend || 0);

  const billSummary = fetchDailyBillsSummary(data.date);
  const wholesaleKg = billSummary.wholesaleKg > 0 ? billSummary.wholesaleKg : Number(data.sales?.wholesaleKg || 0);
  const wholesaleAmount = billSummary.wholesaleAmount > 0 ? billSummary.wholesaleAmount : Number(data.sales?.wholesaleAmount || 0);
  const retailKg = billSummary.retailKg > 0 ? billSummary.retailKg : Number(data.sales?.retailKg || 0);
  const retailAmount = billSummary.retailAmount > 0 ? billSummary.retailAmount : Number(data.sales?.retailAmount || 0);
  const eggAmount = billSummary.eggAmount > 0 ? billSummary.eggAmount : Number(data.sales?.eggAmount || 0);

  // Egg Sold calculations
  const eggSoldNos = billSummary.eggQty > 0 ? billSummary.eggQty : Number(data.sales?.eggQty || 0);
  const eggSoldTares = Math.floor(eggSoldNos / 30);
  const eggSoldRem = eggSoldNos % 30;

  // Total shop sale kg (wholesale kg + retail kg)
  const totalShopSaleKg = Math.round((wholesaleKg + retailKg) * 1000) / 1000;

  // Total shop profit: ((wholesale amount + retail amount + egg amount) - load spend)
  const totalCollectedAmount = wholesaleAmount + retailAmount + eggAmount;
  const totalShopProfit = Math.round((totalCollectedAmount - loadCostSpend) * 100) / 100;

  // Chicken Stock remaining (Total Available KG minus Sold KG)
  const chickenStockRemaining = Math.round((totalAvailableChickenKg - totalShopSaleKg) * 1000) / 1000;

  // Egg Stock remaining (Total Available eggs minus Sold eggs)
  const eggStockRemainingNos = totalAvailableEggNos - eggSoldNos;
  const eggStockRemainingTares = Math.floor(eggStockRemainingNos / 30);
  const eggStockRemainingRem = Math.abs(eggStockRemainingNos) % 30;

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto px-4 py-3 select-none">
      {/* Top 4 Sub-Tabs */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-emerald-100/70 p-1 mb-5 border border-emerald-200/80 shadow-xs">
        {/* Main Stock remaining / Summary */}
        <button
          type="button"
          id="btn-subtab-summary"
          onClick={() => setSubTab('summary')}
          className={`py-2 px-0.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center cursor-pointer ${
            subTab === 'summary'
              ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30 ring-2 ring-emerald-500/20'
              : 'text-emerald-950 hover:bg-emerald-200/60'
          }`}
        >
          <span className="truncate">{language === 'ta' ? 'இருப்பு' : 'Stock'}</span>
        </button>

        {/* Wholesale Total Page */}
        <button
          type="button"
          id="btn-subtab-wholesale"
          onClick={() => setSubTab('wholesale-total')}
          className={`py-2 px-0.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center cursor-pointer ${
            subTab === 'wholesale-total'
              ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30 ring-2 ring-emerald-500/20'
              : 'text-emerald-950 hover:bg-emerald-200/60'
          }`}
        >
          <span className="truncate">{language === 'ta' ? 'ஹோல்சேல்' : 'Wholesale'}</span>
        </button>

        {/* Retail Total Page */}
        <button
          type="button"
          id="btn-subtab-retail"
          onClick={() => setSubTab('retail-total')}
          className={`py-2 px-0.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center cursor-pointer ${
            subTab === 'retail-total'
              ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30 ring-2 ring-emerald-500/20'
              : 'text-emerald-950 hover:bg-emerald-200/60'
          }`}
        >
          <span className="truncate">{language === 'ta' ? 'ரீடெய்ல்' : 'Retail'}</span>
        </button>

        {/* Hotel Balance Give */}
        <button
          type="button"
          id="btn-subtab-hotel-dues"
          onClick={() => setSubTab('hotel-dues')}
          className={`py-2 px-0.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center cursor-pointer ${
            subTab === 'hotel-dues'
              ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30 ring-2 ring-emerald-500/20'
              : 'text-emerald-950 hover:bg-emerald-200/60'
          }`}
        >
          <span className="truncate">{language === 'ta' ? 'Give' : 'Give'}</span>
        </button>
      </div>

      {/* VIEW A: Main Cards */}
      {subTab === 'summary' && (
        <div className="space-y-4">
          {/* Row 1 (STOCK BEFORE SUMMARY): Remaining Chicken Stock BIG (Left) & Remaining Egg Stock BIG (Right) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left: Remaining Chicken Stock BIG */}
            <div className="bg-white rounded-3xl p-4 border-2 border-emerald-400 shadow-xs flex flex-col justify-between min-h-[130px] relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{language === 'ta' ? 'கோழி மீதி இருப்பு' : 'Chicken Stock'}</span>
                </span>
              </div>

              <div className="my-auto text-center py-1.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className={`text-2xl sm:text-3xl font-black tracking-tight ${chickenStockRemaining >= 0 ? 'text-neutral-900' : 'text-rose-600'}`}>
                  {chickenStockRemaining} <span className="text-xs font-bold uppercase text-neutral-400">kg</span>
                </div>
              </div>

              {/* Inward & Sold Breakdown */}
              <div className="mt-1 pt-1 border-t border-emerald-100 text-[10px] text-slate-500 font-medium flex flex-col gap-0.5">
                {openingChickenKg > 0 && (
                  <div className="text-amber-800 font-bold flex justify-between">
                    <span>{language === 'ta' ? 'தொடக்க இருப்பு:' : 'Opening:'}</span>
                    <span>+{openingChickenKg} kg</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{language === 'ta' ? 'இன்றைய லோடு:' : 'Inward:'}</span>
                  <span>+{incomingKg} kg</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>{language === 'ta' ? 'விற்பனை:' : 'Sold:'}</span>
                  <span>-{totalShopSaleKg} kg</span>
                </div>
              </div>
            </div>

            {/* Right: Remaining Egg Stock BIG */}
            <div className="bg-white rounded-3xl p-4 border-2 border-orange-300 shadow-xs flex flex-col justify-between min-h-[130px] relative overflow-hidden bg-orange-50/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-orange-950 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span>{language === 'ta' ? 'முட்டை மீதி இருப்பு' : 'Egg Stock'}</span>
                </span>
              </div>

              <div className="my-auto text-center py-1.5 bg-orange-50/70 rounded-2xl border border-orange-200">
                <div className={`text-2xl sm:text-3xl font-black tracking-tight ${eggStockRemainingNos >= 0 ? 'text-orange-950' : 'text-rose-600'}`}>
                  {eggStockRemainingTares} <span className="text-xs sm:text-sm font-bold text-orange-700 uppercase">{language === 'ta' ? 'தட்டு' : 'Tares'}</span>
                  {eggStockRemainingRem > 0 && (
                    <span className="text-sm font-bold text-neutral-700 ml-1">
                      + {eggStockRemainingRem}
                    </span>
                  )}
                </div>
              </div>

              {/* Egg Breakdown */}
              <div className="mt-1 pt-1 border-t border-orange-200/80 text-[10px] text-slate-500 font-medium flex flex-col gap-0.5">
                {openingEggNos > 0 && (
                  <div className="text-orange-900 font-bold flex justify-between">
                    <span>{language === 'ta' ? 'தொடக்க இருப்பு:' : 'Opening:'}</span>
                    <span>+{Math.floor(openingEggNos / 30)} {language === 'ta' ? 'தட்டு' : 'T'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{language === 'ta' ? 'இன்றைய லோடு:' : 'Inward:'}</span>
                  <span>+{eggInwardTares} {language === 'ta' ? 'தட்டு' : 'T'}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>{language === 'ta' ? 'விற்றது:' : 'Sold:'}</span>
                  <span>-{eggSoldNos} {language === 'ta' ? 'முட்டை' : 'nos'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Total Chicken Sales (Left) & Total Egg Sales (Right) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left: Total Chicken Sales */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-200 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div className="mb-1">
                <span className="text-xs font-black text-neutral-700 uppercase tracking-wide">
                  {language === 'ta' ? 'மொத்த கோழி விற்பனை' : 'Total Chicken Sales'}
                </span>
              </div>

              <div className="my-auto py-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                  ₹{(wholesaleAmount + retailAmount).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Right: Total Egg Sales */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-orange-200 shadow-xs flex flex-col justify-between min-h-[110px] bg-orange-50/20">
              <div className="mb-1">
                <span className="text-xs font-black text-orange-950 uppercase tracking-wide">
                  {language === 'ta' ? 'மொத்த முட்டை விற்பனை' : 'Total Egg Sales'}
                </span>
              </div>

              <div className="my-auto py-1">
                <div className="text-2xl sm:text-3xl font-black text-orange-900 tracking-tight">
                  ₹{eggAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Total Profit BIG */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-600 shadow-sm bg-emerald-50/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                {language === 'ta' ? 'நிகர லாபம் (மொத்த லாபம்)' : 'Net Profit (Total Profit)'}
              </span>
            </div>

            <div className="my-2">
              <div className={`text-4xl sm:text-5xl font-black tracking-tight ${totalShopProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                ₹{totalShopProfit.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Formula calculation breakdown */}
            <div className="mt-2 pt-2 border-t border-emerald-200/80 text-[11px] text-neutral-600 font-semibold flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-emerald-900 font-bold">
                {language === 'ta' ? 'விற்பனை:' : 'Sales:'} ₹{totalCollectedAmount.toLocaleString('en-IN')}
              </span>
              <span>-</span>
              <span className="text-neutral-700 font-bold">
                {language === 'ta' ? 'லோடு:' : 'Load:'} ₹{loadCostSpend.toLocaleString('en-IN')}
              </span>
              <span>=</span>
              <span className={`font-black ${totalShopProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                ₹{totalShopProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Wholesale Total Page */}
      {subTab === 'wholesale-total' && (
        <div className="bg-white rounded-3xl p-3 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100 px-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              {language === 'ta' ? 'ஹோல்சேல் மொத்த பக்கம்' : 'Wholesale Total Page'}
            </span>
          </div>
          <WholesaleTotalView
            bills={wBills}
            products={wProducts}
            language={language}
          />
        </div>
      )}

      {/* VIEW C: Retail Total Page */}
      {subTab === 'retail-total' && (
        <div className="bg-white rounded-3xl p-3 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100 px-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              {language === 'ta' ? 'ரீடெய்ல் மொத்த பக்கம்' : 'Retail Total Page'}
            </span>
          </div>
          <RetailTotalView
            language={language}
          />
        </div>
      )}

      {/* VIEW D: Hotel Balance / Give (Wholesale Dues) */}
      {subTab === 'hotel-dues' && (
        <HotelGiveDuesView
          language={language}
        />
      )}
    </div>
  );
};
