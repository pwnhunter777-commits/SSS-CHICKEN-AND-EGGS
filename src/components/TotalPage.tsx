import React, { useMemo, useState } from 'react';
import { Scale, IndianRupee, Layers, Download, Building2, ArrowRight } from 'lucide-react';
import { Bill, getProductName, LanguageCode, ProductItem } from '../types';
import { exportBillsToCSV, getTodayDateString } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';

interface TotalPageProps {
  bills: Bill[];
  products: ProductItem[];
  language: LanguageCode;
  onNavigateToHotel?: () => void;
}

export const TotalPage: React.FC<TotalPageProps> = ({
  bills,
  products,
  language,
  onNavigateToHotel,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const todayStr = getTodayDateString();
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('all');

  // Filter bills based on selected filter
  const targetBills = useMemo(() => {
    if (filterMode === 'today') {
      return bills.filter((b) => b.date === todayStr);
    }
    return bills;
  }, [bills, filterMode, todayStr]);

  // Overall totals
  const overallTotalKg = useMemo(() => {
    return targetBills.reduce((acc, bill) => acc + bill.totalKg, 0);
  }, [targetBills]);

  const overallTotalAmount = useMemo(() => {
    return targetBills.reduce((acc, bill) => acc + bill.totalAmount, 0);
  }, [targetBills]);

  // Product-wise calculation for ALL products
  const productTotals = useMemo(() => {
    const map: Record<
      string,
      { id: string; product: ProductItem | null; fallbackName: string; totalKg: number; totalAmount: number; count: number }
    > = {};

    products.forEach((p) => {
      map[p.id] = {
        id: p.id,
        product: p,
        fallbackName: getProductName(p, language),
        totalKg: 0,
        totalAmount: 0,
        count: 0,
      };
    });

    targetBills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!map[item.productId]) {
          const matchedProd = products.find((p) => p.id === item.productId) || null;
          map[item.productId] = {
            id: item.productId,
            product: matchedProd,
            fallbackName: item.productName,
            totalKg: 0,
            totalAmount: 0,
            count: 0,
          };
        }
        map[item.productId].totalKg += item.kg;
        map[item.productId].totalAmount += item.amount;
        map[item.productId].count += 1;
      });
    });

    return Object.values(map);
  }, [products, targetBills, language]);

  return (
    <div id="page-total" className="pb-8 pt-3 px-4 max-w-md mx-auto animate-in fade-in">
      {/* Page Title & Filter Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">{t.total}</h2>
        </div>

        {/* Filter Toggle: All Time vs Today */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilterMode('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterMode === 'today'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            {t.today}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            {t.allTime}
          </button>
        </div>
      </div>

      {/* Grand Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Total KG Sold */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1 text-slate-600">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <Scale className="w-4 h-4 text-slate-700" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.totalKgSold}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {overallTotalKg.toFixed(2)}
            <span className="text-xs font-bold text-slate-500 ml-1">{t.kgUnit}</span>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-emerald-800 text-white rounded-3xl p-4 shadow-md shadow-emerald-950/20 border-b border-emerald-700/60">
          <div className="flex items-center gap-2 mb-1 text-emerald-100">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <IndianRupee className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
              {t.totalAmount}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            ₹{Math.round(overallTotalAmount).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Hotel Balance & Payment Quick Link Banner */}
      {onNavigateToHotel && (
        <div className="mb-3">
          <button
            id="btn-goto-hotel-balance"
            type="button"
            onClick={onNavigateToHotel}
            className="w-full p-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-sm flex items-center justify-between transition-all active:scale-98 cursor-pointer border border-slate-800"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
                <Building2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-white">
                  {t.hotelAccounts}
                </div>
                <div className="text-[10px] text-slate-300">
                  {language === 'ta' ? 'ஹோட்டல் பாக்கி சரிபார்க்க மற்றும் வரவு வைக்க' : 'Check hotel pending balances & record payments'}
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      )}

      {/* Save Sales Report File to Phone Button */}
      {targetBills.length > 0 && (
        <div className="mb-3">
          <button
            id="btn-export-totals-file"
            type="button"
            onClick={() => exportBillsToCSV(targetBills)}
            className="w-full py-3 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-emerald-700/20 cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>
              {language === 'ta'
                ? `${filterMode === 'today' ? 'இன்றைய' : 'அனைத்து'} விற்பனை அறிக்கை (CSV) சேமிக்க`
                : `Save ${filterMode === 'today' ? "Today's" : 'All-Time'} Report File to Phone (.CSV)`}
            </span>
          </button>
        </div>
      )}

      {/* Product Totals Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
              {t.productSummary}
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
            {productTotals.length} {t.chickenProducts}
          </span>
        </div>

        {/* Product Breakdown List */}
        <div className="divide-y divide-slate-100">
          {productTotals.map((item, idx) => {
            const displayName = item.product ? getProductName(item.product, language) : item.fallbackName;
            return (
              <div
                key={item.id}
                id={`total-product-row-${item.id}`}
                className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 rounded-xl px-1.5 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate uppercase tracking-tight">
                      {displayName}
                    </h4>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    {item.totalKg.toFixed(2)} <span className="text-[10px] font-bold text-slate-500">{t.kgUnit}</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    ₹{Math.round(item.totalAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
