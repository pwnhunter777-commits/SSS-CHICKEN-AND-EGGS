import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  IndianRupee,
  Layers,
  Download,
  Calendar,
  Egg,
} from 'lucide-react';
import { Bill, BillItem, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import {
  loadBills,
  getTodayKey,
  loadShopSettings,
} from '../utils/storage';

interface TotalPageProps {
  language: Language;
}

export const TotalPage: React.FC<TotalPageProps> = ({ language }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const todayKey = getTodayKey();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filterMode, setFilterMode] = useState<'today' | 'custom' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [customDateInput, setCustomDateInput] = useState<string>('');

  useEffect(() => {
    setBills(loadBills());
  }, []);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    bills.forEach((b) => {
      if (b.date) dates.add(b.date);
    });
    return Array.from(dates).sort().reverse();
  }, [bills]);

  // Target bills based on selected filter
  const targetBills = useMemo(() => {
    if (filterMode === 'today') {
      return bills.filter((b) => b.date === todayKey);
    }
    if (filterMode === 'custom') {
      const target = customDateInput || selectedDate;
      return bills.filter((b) => b.date === target);
    }
    return bills;
  }, [bills, filterMode, todayKey, customDateInput, selectedDate]);

  // Helper to detect egg items
  const isEggItem = (item: BillItem): boolean => {
    return (
      item.variant === 'egg' ||
      item.productId === 'p_egg' ||
      (item.productName || '').toLowerCase().includes('egg') ||
      (item.productName || '').includes('முட்டை') ||
      (item.productNameEn || '').toLowerCase().includes('egg') ||
      (item.productNameTa || '').includes('முட்டை')
    );
  };

  // Calculate totals for Chicken and Egg separately
  const {
    totalChickenKg,
    totalChickenAmount,
    chickenItemsCount,
    totalEggQty,
    totalEggAmount,
    eggItemsCount,
    overallTotalAmount,
  } = useMemo(() => {
    let chickenKg = 0;
    let chickenAmount = 0;
    let chickenCount = 0;

    let eggQty = 0;
    let eggAmount = 0;
    let eggCount = 0;

    targetBills.forEach((bill) => {
      bill.items?.forEach((item) => {
        if (isEggItem(item)) {
          eggQty += item.kg; // kg holds piece count for eggs
          eggAmount += item.amount;
          eggCount += 1;
        } else {
          chickenKg += item.kg;
          chickenAmount += item.amount;
          chickenCount += 1;
        }
      });
    });

    return {
      totalChickenKg: chickenKg,
      totalChickenAmount: chickenAmount,
      chickenItemsCount: chickenCount,
      totalEggQty: eggQty,
      totalEggAmount: eggAmount,
      eggItemsCount: eggCount,
      overallTotalAmount: chickenAmount + eggAmount,
    };
  }, [targetBills]);

  // Egg tare calculation: 1 Tare = 30 Eggs
  const EGGS_PER_TARE = 30;
  const fullTares = Math.floor(totalEggQty / EGGS_PER_TARE);
  const remainingEggs = Math.round(totalEggQty % EGGS_PER_TARE);
  const tareDecimal = totalEggQty > 0 ? (totalEggQty / EGGS_PER_TARE).toFixed(1) : '0';

  const tareFormattedText = useMemo(() => {
    if (totalEggQty === 0) {
      return language === 'ta' ? '0 தட்டு' : '0 Tares';
    }
    if (language === 'ta') {
      if (remainingEggs === 0) {
        return `${fullTares} தட்டு (${totalEggQty} முட்டை)`;
      }
      return `${fullTares} தட்டு + ${remainingEggs} முட்டை (${tareDecimal} தட்டு)`;
    }
    if (remainingEggs === 0) {
      return `${fullTares} Tares (${totalEggQty} pcs)`;
    }
    return `${fullTares} Tares + ${remainingEggs} pcs (${tareDecimal} Tares)`;
  }, [totalEggQty, fullTares, remainingEggs, tareDecimal, language]);

  // Product breakdown calculation
  interface AggregatedProduct {
    id: string;
    isEgg: boolean;
    name: string;
    totalKgOrQty: number;
    totalAmount: number;
    count: number;
    variants: Record<string, { kg: number; amount: number }>;
  }

  const productTotals = useMemo(() => {
    const map: Record<string, AggregatedProduct> = {};

    targetBills.forEach((bill) => {
      bill.items?.forEach((item) => {
        const isEgg = isEggItem(item);
        const groupKey = isEgg ? 'p_egg' : item.productId || item.productName;

        if (!map[groupKey]) {
          const fallbackName = isEgg
            ? (language === 'ta' ? 'முட்டை' : 'Egg')
            : (language === 'ta' ? item.productNameTa || item.productName : item.productNameEn || item.productName);

          map[groupKey] = {
            id: groupKey,
            isEgg,
            name: fallbackName,
            totalKgOrQty: 0,
            totalAmount: 0,
            count: 0,
            variants: {},
          };
        }

        map[groupKey].totalKgOrQty += item.kg;
        map[groupKey].totalAmount += item.amount;
        map[groupKey].count += 1;

        if (!isEgg && item.variant) {
          if (!map[groupKey].variants[item.variant]) {
            map[groupKey].variants[item.variant] = { kg: 0, amount: 0 };
          }
          map[groupKey].variants[item.variant].kg += item.kg;
          map[groupKey].variants[item.variant].amount += item.amount;
        }
      });
    });

    return Object.values(map);
  }, [targetBills, language]);

  // Export report to CSV function
  const handleExportCSV = () => {
    try {
      const settings = loadShopSettings();
      const reportDate =
        filterMode === 'today'
          ? todayKey
          : filterMode === 'custom'
            ? customDateInput || selectedDate
            : 'All-Time';

      const rows: string[][] = [
        [settings.shopName || 'SSS CHICKEN AND EGG AGENCY', 'Retail Sales Report'],
        ['Report Period', reportDate],
        ['Total Bills', String(targetBills.length)],
        ['Grand Total Revenue (Rs)', overallTotalAmount.toFixed(2)],
        [],
        ['--- CATEGORY SUMMARY ---'],
        ['Chicken Sold (Kg)', totalChickenKg.toFixed(2)],
        ['Chicken Revenue (Rs)', totalChickenAmount.toFixed(2)],
        ['Total Eggs Sold (Nos)', String(totalEggQty)],
        ['Egg Tares Sold (30/tare)', `${fullTares} Tares + ${remainingEggs} eggs (${tareDecimal} tares)`],
        ['Egg Revenue (Rs)', totalEggAmount.toFixed(2)],
        [],
        ['--- ITEMIZED SALES BREAKDOWN ---'],
        ['Item Name', 'Type', 'Quantity / Weight', 'Unit', 'Amount (Rs)', 'Orders Count'],
      ];

      productTotals.forEach((p) => {
        if (p.isEgg) {
          rows.push([
            p.name,
            'Egg (முட்டை)',
            String(p.totalKgOrQty),
            `Nos (${(p.totalKgOrQty / 30).toFixed(1)} Tares)`,
            p.totalAmount.toFixed(2),
            String(p.count),
          ]);
        } else {
          rows.push([
            p.name,
            'Chicken Cut',
            p.totalKgOrQty.toFixed(2),
            'KG',
            p.totalAmount.toFixed(2),
            String(p.count),
          ]);
          (Object.entries(p.variants) as [string, { kg: number; amount: number }][]).forEach(([v, val]) => {
            if (val.kg > 0) {
              rows.push([`  ↳ Variant: ${v}`, '', val.kg.toFixed(2), 'KG', val.amount.toFixed(2), '']);
            }
          });
        }
      });

      const csvContent = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retail_sales_report_${reportDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export retail CSV', e);
    }
  };

  return (
    <div id="retail-page-total" className="pb-28 pt-3 px-4 max-w-md mx-auto animate-in fade-in">
      {/* Page Title & Filter Toggle (Same layout as Wholesale Total Page) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-emerald-950">
            {language === 'ta' ? 'ரீடெய்ல் விற்பனை மொத்தம்' : 'Retail Total'}
          </h2>
        </div>

        {/* Filter Toggle: Today vs All Time vs Custom Date */}
        <div className="bg-white p-1 rounded-2xl flex items-center gap-1 border-2 border-emerald-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilterMode('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterMode === 'today'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/25'
                : 'text-emerald-950 hover:bg-emerald-700 hover:text-white font-bold'
            }`}
          >
            {t.today}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/25'
                : 'text-emerald-950 hover:bg-emerald-700 hover:text-white font-bold'
            }`}
          >
            {t.allTime}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('custom')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'custom'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/25'
                : 'text-emerald-950 hover:bg-emerald-700 hover:text-white font-bold'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'தேதி' : 'Date'}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Selector Drawer */}
      {filterMode === 'custom' && (
        <div className="bg-white rounded-2xl p-3 shadow-xs border-2 border-emerald-200 mb-3 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-950">
              {t.selectDate}:
            </span>
            <input
              type="date"
              value={customDateInput || selectedDate}
              onChange={(e) => setCustomDateInput(e.target.value)}
              className="bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 text-xs font-bold text-emerald-900 outline-none ml-auto"
            />
          </div>
          {availableDates.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {availableDates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    setCustomDateInput(d);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                    (customDateInput || selectedDate) === d
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grand Summary Cards: Chicken & Egg side-by-side (Matching Wholesale layout) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* 1. Total Chicken KG Sold & Price */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-3.5 h-3.5 text-emerald-800" />
                </div>
                <span className="text-[11px] font-black text-emerald-900 uppercase tracking-tight">
                  {language === 'ta' ? 'கோழி விற்பனை' : 'Chicken Total'}
                </span>
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                KG
              </span>
            </div>

            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-black text-emerald-950">
                {totalChickenKg.toFixed(2)}
                <span className="text-xs font-bold text-emerald-700 ml-1">{t.kgUnit || 'kg'}</span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500">
              {language === 'ta' ? 'தொகை:' : 'Revenue:'}
            </span>
            <span className="text-sm font-black text-emerald-700">
              ₹{Math.round(totalChickenAmount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* 2. Total Egg Sold, Tare Count & Price */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 text-amber-700">
                <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Egg className="w-3.5 h-3.5 text-amber-800" />
                </div>
                <span className="text-[11px] font-black text-emerald-900 uppercase tracking-tight">
                  {language === 'ta' ? 'முட்டை விற்பனை' : 'Egg Total'}
                </span>
              </div>
              <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                30/TARE
              </span>
            </div>

            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-black text-emerald-950">
                {totalEggQty}
                <span className="text-xs font-bold text-amber-700 ml-1">
                  {language === 'ta' ? 'முட்டை' : 'Nos'}
                </span>
              </div>

              {/* Tare count highlight pill */}
              <div className="mt-1.5 px-2 py-1 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-amber-900 shrink-0">
                  {language === 'ta' ? 'தட்டு:' : 'Tare:'}
                </span>
                <span className="text-[11px] font-black text-amber-950 text-right leading-tight" title={tareFormattedText}>
                  {remainingEggs === 0 ? (
                    language === 'ta' ? `${fullTares} தட்டு` : `${fullTares} Tares`
                  ) : (
                    language === 'ta' ? `${fullTares} தட்டு + ${remainingEggs} மு` : `${fullTares} T + ${remainingEggs} pcs`
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500">
              {language === 'ta' ? 'தொகை:' : 'Revenue:'}
            </span>
            <span className="text-sm font-black text-amber-800">
              ₹{Math.round(totalEggAmount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Combined Total Sales Revenue Banner (Same styling as Wholesale Total Page) */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white rounded-3xl p-4 shadow-md shadow-emerald-950/15 border-b-2 border-emerald-600/30 mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-emerald-100">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <IndianRupee className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
              {language === 'ta' ? 'மொத்த ரீடெய்ல் வருமானம்' : 'Total Sales Revenue'}
            </span>
          </div>
          <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-lg text-emerald-100">
            {targetBills.length} {language === 'ta' ? 'பில்கள்' : 'Bills'}
          </span>
        </div>

        <div className="text-2xl sm:text-3xl font-black text-white mt-1">
          ₹{Math.round(overallTotalAmount).toLocaleString('en-IN')}
        </div>
      </div>

      {/* 4. Save Sales Report File to Phone Button (CSV Export) */}
      {targetBills.length > 0 && (
        <div className="mb-3">
          <button
            id="btn-export-retail-totals-file"
            type="button"
            onClick={handleExportCSV}
            className="w-full py-3 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-emerald-700/20 cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>
              {language === 'ta'
                ? `${filterMode === 'today' ? 'இன்றைய' : 'அனைத்து'} ரீடெய்ல் அறிக்கை (CSV) சேமிக்க`
                : `Save ${filterMode === 'today' ? "Today's" : 'All-Time'} Retail Report File (.CSV)`}
            </span>
          </button>
        </div>
      )}

      {/* 5. Product Totals Section (Matching Wholesale Total Page Card) */}
      <div className="bg-white border-2 border-emerald-200 rounded-3xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
              {language === 'ta' ? 'பொருட்கள் சுருக்கம்' : 'Product Summary'}
            </h3>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
            {productTotals.length} {language === 'ta' ? 'பொருட்கள்' : 'Products'}
          </span>
        </div>

        {productTotals.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs font-bold">
            {language === 'ta' ? 'விற்பனை பதிவுகள் இல்லை' : 'No sales recorded for this period'}
          </div>
        ) : (
          <div className="divide-y divide-emerald-50">
            {productTotals.map((item, idx) => {
              const isEgg = item.isEgg;
              const tareCountForProduct = isEgg ? Math.floor(item.totalKgOrQty / 30) : 0;
              const remEggForProduct = isEgg ? Math.round(item.totalKgOrQty % 30) : 0;

              return (
                <div
                  key={item.id}
                  id={`retail-total-product-row-${item.id}`}
                  className="py-2.5 flex flex-col gap-1.5 hover:bg-emerald-50/40 rounded-xl px-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${
                        isEgg ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-black text-emerald-950 truncate uppercase tracking-tight">
                            {item.name}
                          </h4>
                          {isEgg && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                              30/Tare
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs sm:text-sm font-black text-emerald-950">
                        {isEgg ? (
                          <>
                            {item.totalKgOrQty}{' '}
                            <span className="text-[10px] font-bold text-amber-700">
                              {language === 'ta' ? 'முட்டை' : 'Nos'}
                            </span>
                          </>
                        ) : (
                          <>
                            {item.totalKgOrQty.toFixed(2)}{' '}
                            <span className="text-[10px] font-bold text-emerald-700">
                              {t.kgUnit || 'kg'}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-xs font-black text-emerald-600">
                        ₹{Math.round(item.totalAmount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* If product has variants breakdown (e.g. with skin / without skin / boneless) */}
                  {!isEgg && Object.keys(item.variants).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-8 pt-0.5">
                      {(Object.entries(item.variants) as [string, { kg: number; amount: number }][]).map(([vKey, vVal]) => {
                        const vLabel =
                          vKey === 'with_skin'
                            ? (language === 'ta' ? 'தோலுடன்' : 'With Skin')
                            : vKey === 'without_skin'
                              ? (language === 'ta' ? 'தோல் இல்லா' : 'Without Skin')
                              : vKey === 'boneless'
                                ? (language === 'ta' ? 'போன்லெஸ்' : 'Boneless')
                                : vKey;
                        return (
                          <span
                            key={vKey}
                            className="inline-flex items-center gap-1 text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md border border-neutral-200"
                          >
                            <span>{vLabel}:</span>
                            <strong className="text-emerald-900">{vVal.kg.toFixed(2)} kg</strong>
                            <span className="text-neutral-400">|</span>
                            <span className="text-emerald-700">₹{Math.round(vVal.amount)}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

