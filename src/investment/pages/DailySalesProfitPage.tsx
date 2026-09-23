import React from 'react';
import { InvestmentDayData } from '../types';
import { fetchDailyBillsSummary } from '../utils/storage';
import { RefreshCw } from 'lucide-react';

interface DailySalesProfitPageProps {
  data: InvestmentDayData;
  onChangeData: (updated: InvestmentDayData) => void;
  language?: 'en' | 'ta';
}

export const DailySalesProfitPage: React.FC<DailySalesProfitPageProps> = ({
  data,
  onChangeData,
  language = 'en',
}) => {
  const isChicken = data.itemType === 'chicken';
  const unitLabel = isChicken ? 'kg' : 'nos';

  // 1st Page values (Load Entry) - Chicken Load
  const chickenGrossKg = Number(data.chickenLoad.totalIncomeKg || 0);
  const chickenWastage = Number(data.chickenLoad.wastagePercent || 0);
  const chickenRate = Number(data.chickenLoad.ratePerKg || 0);
  const chickenNetKg = chickenWastage > 0
    ? Math.max(0, Math.round((chickenGrossKg * (1 - chickenWastage / 100)) * 100) / 100)
    : chickenGrossKg;
  const chickenLoadCost = Number(data.chickenLoad.totalAmount || 0) > 0
    ? Number(data.chickenLoad.totalAmount)
    : Math.round(chickenNetKg * chickenRate * 100) / 100;

  // 1st Page values (Load Entry) - Egg Load
  const eggTareIncome = Number(data.eggLoad.totalTareIncome || 0);
  const eggPricePerTare = Number(data.eggLoad.pricePerTare || 0);
  const eggLoadCount = Math.round(eggTareIncome * 30);
  const eggLoadCost = Math.round(eggTareIncome * eggPricePerTare * 100) / 100;

  // Combined Load Total Amount: Chicken Load Price + Egg Load Price
  const totalCombinedLoadCost = Math.round((chickenLoadCost + eggLoadCost) * 100) / 100;

  // Active load cost and incoming chicken weight: Prioritize 1st page calculation
  const currentLoadSpend = totalCombinedLoadCost > 0 ? totalCombinedLoadCost : (Number(data.sales.loadPriceSpend) || 0);
  const currentIncomingKg = chickenNetKg > 0 ? chickenNetKg : (Number(data.sales.totalIncomeKg) || 0);

  // Wholesale values (from today's wholesale bills summary or saved state)
  const billSummary = fetchDailyBillsSummary(data.date);
  const wholesaleKg = billSummary.wholesaleKg > 0 ? billSummary.wholesaleKg : (Number(data.sales.wholesaleKg) || 0);
  const wholesaleAmount = billSummary.wholesaleAmount > 0 ? billSummary.wholesaleAmount : (Number(data.sales.wholesaleAmount) || 0);

  // Retail chicken values (from today's retail bills summary or saved state)
  const retailKg = billSummary.retailKg > 0 ? billSummary.retailKg : (Number(data.sales.retailKg) || 0);
  const retailAmount = billSummary.retailAmount > 0 ? billSummary.retailAmount : (Number(data.sales.retailAmount) || 0);

  // Egg sales values: strictly from retail app egg sold data (sold price, sold count, sold total amount)
  const eggAmount = billSummary.eggAmount > 0
    ? billSummary.eggAmount
    : (data.sales.eggAmount !== undefined && Number(data.sales.eggAmount) > 0 ? Number(data.sales.eggAmount) : 0);

  const eggQty = billSummary.eggQty > 0
    ? billSummary.eggQty
    : (data.sales.eggQty !== undefined && Number(data.sales.eggQty) > 0 ? Number(data.sales.eggQty) : 0);

  const eggPrice = billSummary.eggPrice > 0
    ? billSummary.eggPrice
    : (eggQty > 0 ? Math.round((eggAmount / eggQty) * 100) / 100 : (Number(data.sales.eggPrice) || 6));

  // Total shop sale kg (wholesale kg + retail kg)
  const totalShopSaleKg = Math.round((wholesaleKg + retailKg) * 1000) / 1000;

  // Total collected revenue: Wholesale Amount + Retail Amount + Egg Price / Amount
  const totalCollectedAmount = Math.round((wholesaleAmount + retailAmount + eggAmount) * 100) / 100;
  // Net shop profit: (Sales - Load Spend)
  const totalShopProfit = Math.round((totalCollectedAmount - currentLoadSpend) * 100) / 100;

  // Sync Load directly from First Page
  const handleSyncFirstPage = () => {
    onChangeData({
      ...data,
      sales: {
        ...data.sales,
        loadPriceSpend: totalCombinedLoadCost,
        totalIncomeKg: chickenNetKg,
        wholesaleAmount,
        wholesaleKg,
        retailAmount,
        retailKg,
        eggAmount,
        eggQty,
      },
    });
  };

  // Sync today's bills from Wholesale and Retail sections
  const handleSyncBills = () => {
    const summary = fetchDailyBillsSummary(data.date);
    onChangeData({
      ...data,
      sales: {
        ...data.sales,
        loadPriceSpend: totalCombinedLoadCost > 0 ? totalCombinedLoadCost : currentLoadSpend,
        totalIncomeKg: chickenNetKg > 0 ? chickenNetKg : currentIncomingKg,
        wholesaleAmount: summary.wholesaleAmount,
        wholesaleKg: summary.wholesaleKg,
        retailAmount: summary.retailAmount,
        retailKg: summary.retailKg,
        eggAmount: summary.eggAmount,
        eggQty: summary.eggQty,
        eggPrice: summary.eggPrice,
      },
    });
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto px-4 py-3 select-none">
      {/* Top Header info & Sync Button */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div>
          <h2 className="text-lg font-black text-neutral-900 tracking-tight">
            {language === 'ta' ? 'விற்பனை & லாபம்' : 'Sales & Profit'}
          </h2>
        </div>

        <button
          type="button"
          onClick={handleSyncBills}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
          title={language === 'ta' ? 'இன்றைய பில்களை இணை' : "Sync today's bills"}
        >
          <RefreshCw size={13} className="text-emerald-700" />
          <span>{language === 'ta' ? 'பில்கள் இணைப்பு' : 'Sync Bills'}</span>
        </button>
      </div>

      {/* Main Informational Cards */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-xs space-y-4 mb-4">
        {/* Row 1: Load Inward from 1st Page */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-neutral-50/90 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-neutral-800">
              {language === 'ta' ? '1. லோடு வரவு (1-ஆம் பக்கம்)' : '1. Load Inward (1st Page)'}
            </span>
            <button
              type="button"
              onClick={handleSyncFirstPage}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/70 px-2 py-0.5 rounded-lg transition-all cursor-pointer active:scale-95"
              title={language === 'ta' ? '1-ஆம் பக்க லோடு விவரத்தை பொருத்து' : 'Sync 1st page load'}
            >
              <RefreshCw size={11} />
              <span>{language === 'ta' ? 'லோடு பொருத்து' : 'Sync 1st Page'}</span>
            </button>
          </div>

          {/* Chicken Load Inward & Egg Load Inward Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Chicken Load Inward */}
            <div className="bg-white rounded-2xl p-2.5 border border-emerald-200 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-emerald-900 mb-0.5">
                {language === 'ta' ? 'கோழி லோடு வரவு' : 'Chicken Load Inward'}
              </span>
              <span className="text-lg font-black text-neutral-900 tracking-tight">
                {chickenNetKg} <span className="text-xs font-bold text-neutral-400 uppercase">kg</span>
              </span>
            </div>

            {/* Egg Load Inward */}
            <div className="bg-white rounded-2xl p-2.5 border border-orange-200 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-orange-950 mb-0.5">
                {language === 'ta' ? 'முட்டை லோடு வரவு' : 'Egg Load Inward'}
              </span>
              <span className="text-lg font-black text-neutral-900 tracking-tight">
                {eggTareIncome} <span className="text-xs font-bold text-neutral-400 uppercase">{language === 'ta' ? 'தட்டு' : 'tares'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Wholesale Sales */}
        <div className="space-y-2 p-3 rounded-2xl bg-emerald-50/40 border border-emerald-200/80">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-emerald-950">
              {language === 'ta' ? '2. ஹோல்சேல் விற்பனை' : '2. Wholesale Sales'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Wholesale Amount (Display only) */}
            <div className="bg-white rounded-2xl py-3 px-3 border-2 border-emerald-300 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-neutral-500 mb-1">
                {language === 'ta' ? 'ஹோல்சேல் மொத்த தொகை' : 'Wholesale Amount'}
              </span>
              <span className="text-xl font-black text-emerald-900 tracking-tight">
                ₹{wholesaleAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Wholesale Sale Qty (Display only) */}
            <div className="bg-white rounded-2xl py-3 px-3 border-2 border-emerald-200 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-neutral-500 mb-1">
                {language === 'ta' ? 'விற்பனை அளவு' : 'Sale Qty'}
              </span>
              <span className="text-xl font-black text-neutral-900 tracking-tight">
                {wholesaleKg} <span className="text-xs font-bold text-neutral-400 uppercase">{unitLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Retail Sales */}
        <div className="space-y-2 p-3 rounded-2xl bg-amber-50/40 border border-amber-200/80">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-amber-950">
              {language === 'ta' ? '3. ரீடெய்ல் விற்பனை' : '3. Retail Sales'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Retail Amount (Display only) */}
            <div className="bg-white rounded-2xl py-3 px-3 border-2 border-amber-300 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-neutral-500 mb-1">
                {language === 'ta' ? 'ரீடெய்ல் மொத்த தொகை' : 'Retail Amount'}
              </span>
              <span className="text-xl font-black text-amber-900 tracking-tight">
                ₹{retailAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Retail Sale Qty (Display only) */}
            <div className="bg-white rounded-2xl py-3 px-3 border-2 border-amber-200 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-neutral-500 mb-1">
                {language === 'ta' ? 'விற்பனை அளவு' : 'Sale Qty'}
              </span>
              <span className="text-xl font-black text-neutral-900 tracking-tight">
                {retailKg} <span className="text-xs font-bold text-neutral-400 uppercase">{unitLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Row 4: Egg Sales (Retail egg sold data) */}
        <div className="space-y-2 p-3 rounded-2xl bg-orange-50/40 border border-orange-200/80">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-orange-950">
                {language === 'ta' ? '4. முட்டை விற்பனை (ரீடெய்ல்)' : '4. Egg Sales (Retail)'}
              </span>
              {eggPrice > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100/90 text-orange-800 border border-orange-200">
                  @ ₹{Math.round(eggPrice)}/{language === 'ta' ? 'முட்டை' : 'egg'}
                </span>
              )}
            </div>
            {eggQty > 0 && (
              <span className="text-[11px] font-bold text-orange-800">
                {Math.floor(eggQty / 30)} {language === 'ta' ? 'தட்டு' : 'tares'} {eggQty % 30 > 0 ? `+ ${Math.round(eggQty % 30)} ${language === 'ta' ? 'முட்டை' : 'nos'}` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Egg Total Amount (from retail app egg sales) */}
            <div className="bg-white rounded-2xl py-3 px-3 border-2 border-orange-300 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-neutral-500 mb-1">
                {language === 'ta' ? 'முட்டை மொத்த தொகை' : 'Egg Total Amount'}
              </span>
              <span className="text-xl font-black text-orange-900 tracking-tight">
                ₹{eggAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Egg Sale Qty (from retail app sold count) */}
            <div className="bg-white rounded-2xl py-3 px-3 border-2 border-orange-200 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-neutral-500 mb-1">
                {language === 'ta' ? 'முட்டை விற்பனை அளவு' : 'Egg Sale Qty'}
              </span>
              <div className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                {Math.floor(eggQty / 30)} <span className="text-xs font-bold text-orange-700 uppercase">{language === 'ta' ? 'தட்டு' : 'tares'}</span>
                {eggQty % 30 > 0 ? ` + ${Math.round(eggQty % 30)}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Section */}
      <div className="space-y-3.5 mb-4">
        {/* Row 1: Total Chicken Sales (Left) & Total Egg Sales (Right) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left: Total Chicken Sales */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-200 shadow-xs flex flex-col justify-between min-h-[120px]">
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
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-orange-200 shadow-xs flex flex-col justify-between min-h-[120px] bg-orange-50/20">
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

        {/* Row 2: Total Shop Profit Card BIG */}
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
              {language === 'ta' ? 'லோடு:' : 'Load:'} ₹{currentLoadSpend.toLocaleString('en-IN')}
            </span>
            <span>=</span>
            <span className={`font-black ${totalShopProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
              ₹{totalShopProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
