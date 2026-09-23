import React, { useMemo, useState } from 'react';
import { Scale, IndianRupee, Layers } from 'lucide-react';
import { Bill, getProductName, LanguageCode, ProductItem, resolveItemDisplayName } from '../types';
import { getTodayDateString } from '../utils/storage';
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
        fallbackName: p.nameTa || getProductName(p, 'ta'),
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
    <div id="page-total" className="pb-8 pt-2 px-2.5 sm:px-3.5 max-w-md mx-auto animate-in fade-in">
      {/* Page Title & Filter Toggle */}
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">{t.total}</h2>
        </div>

        {/* Filter Toggle: All Time vs Today */}
        <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-1 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilterMode('today')}
            className={`min-h-[2.2rem] px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer touch-manipulation flex items-center justify-center ${
              filterMode === 'today'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <span className="leading-normal">{t.today}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`min-h-[2.2rem] px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer touch-manipulation flex items-center justify-center ${
              filterMode === 'all'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <span className="leading-normal">{t.allTime}</span>
          </button>
        </div>
      </div>

      {/* Grand Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Total KG Sold */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1 text-slate-600">
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Scale className="w-3.5 h-3.5 text-slate-700" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
              {t.totalKgSold}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            {overallTotalKg.toFixed(2)}
            <span className="text-[11px] font-bold text-slate-500 ml-1">{t.kgUnit}</span>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-emerald-800 text-white rounded-xl p-2.5 sm:p-3 shadow-2xs border-b border-emerald-700/60">
          <div className="flex items-center gap-1.5 mb-1 text-emerald-100">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs flex-shrink-0">
              <IndianRupee className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider leading-none">
              {t.totalAmount}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-white leading-tight">
            ₹{Math.round(overallTotalAmount).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Product Totals Section */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide leading-none">
              {t.productSummary}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 leading-none">
            {productTotals.length} {t.chickenProducts}
          </span>
        </div>

        {/* Product Breakdown List */}
        <div className="divide-y divide-slate-100">
          {productTotals.map((item, idx) => {
            const displayName = item.product
              ? (item.product.nameTa || getProductName(item.product, 'ta'))
              : resolveItemDisplayName({ productId: item.id, productName: item.fallbackName }, products, 'ta');
            return (
              <div
                key={item.id}
                id={`total-product-row-${item.id}`}
                className="py-1.5 flex items-center justify-between gap-2 hover:bg-slate-50 rounded-lg px-1.5 transition-colors min-h-[2.2rem]"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight break-words leading-tight">
                      {displayName}
                    </h4>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-black text-slate-900 leading-tight">
                    {item.totalKg.toFixed(2)} <span className="text-[10px] font-bold text-slate-500">{t.kgUnit}</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 leading-tight">
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
