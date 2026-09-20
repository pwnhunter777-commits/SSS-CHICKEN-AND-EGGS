import React, { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  ShoppingBag,
  Egg,
  RotateCcw,
} from 'lucide-react';
import { InvestmentDayData, DailyHistoryRecord } from '../types';
import { getDailyHistoryRecords, PreviousDayStock } from '../utils/storage';
import { LanguageCode } from '../../types';

interface DailyHistoryLedgerViewProps {
  currentData: InvestmentDayData;
  onChangeData?: (updated: InvestmentDayData) => void;
  language?: LanguageCode;
  previousStock?: PreviousDayStock | null;
  onNavigateToLoadInward?: () => void;
}

export const DailyHistoryLedgerView: React.FC<DailyHistoryLedgerViewProps> = ({
  currentData,
  onChangeData,
  language = 'en',
  previousStock,
  onNavigateToLoadInward,
}) => {
  const [records, setRecords] = useState<DailyHistoryRecord[]>(() =>
    getDailyHistoryRecords(currentData.date)
  );

  const refreshRecords = () => {
    setRecords(getDailyHistoryRecords(currentData.date));
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {
      // ignore
    }
    return dateStr;
  };

  // Use a past day's remaining stock as today's opening stock
  const handleApplyCustomRecordToLoad = (rec: DailyHistoryRecord) => {
    if (!onChangeData) return;
    onChangeData({
      ...currentData,
      openingStock: {
        fromPreviousDate: rec.date,
        chickenKg: Math.max(0, rec.chickenRemainingKg),
        eggNos: Math.max(0, rec.eggRemainingNos),
        eggTares: Math.max(0, rec.eggRemainingTares),
        eggRem: Math.max(0, rec.eggRemainingRem),
        appliedToLoad: true,
      },
    });
    refreshRecords();
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-10">
      {/* ============================================================ */}
      {/* SECTION TITLE: DAY BY DAY RECORDS                            */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-800" />
          <h2 className="text-sm font-black text-neutral-900">
            {language === 'ta' ? 'நாள்வாரி லாபம் & விற்பனை' : 'Day-by-Day Profit & Sales'}
          </h2>
        </div>
        <button
          type="button"
          onClick={refreshRecords}
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{language === 'ta' ? 'புதுப்பி' : 'Refresh'}</span>
        </button>
      </div>

      {/* List of Day Records */}
      {records.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 text-center border border-neutral-200 shadow-2xs space-y-2">
          <p className="text-sm font-bold text-neutral-600">
            {language === 'ta' ? 'விற்பனை பதிவுகள் எதுவும் இல்லை' : 'No daily sales records found'}
          </p>
          <p className="text-xs text-neutral-400">
            {language === 'ta'
              ? 'விற்பனை அல்லது லோடு பதிவு செய்தவுடன் நாள்வாரி விவரங்கள் இங்கே தோன்றும்.'
              : 'Add bills or inward load to view everyday profit and stock records here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.date}
              id={`daily-record-card-${rec.date}`}
              className={`bg-white rounded-3xl p-4 sm:p-5 border-2 shadow-xs space-y-3.5 transition-all ${
                rec.isToday
                  ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {/* Card Header: Date & Today Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-neutral-900">
                    {formatDateLabel(rec.date)}
                  </span>
                  {rec.isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                      {language === 'ta' ? 'இன்று' : 'Today'}
                    </span>
                  )}
                </div>

                {!rec.isToday && onChangeData && (
                  <button
                    type="button"
                    onClick={() => handleApplyCustomRecordToLoad(rec)}
                    className="text-[10px] font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 transition-all cursor-pointer"
                  >
                    {language === 'ta' ? 'லோடுக்கு அனுப்பு' : 'Set as Opening'}
                  </button>
                )}
              </div>

              {/* 1. Everyday Profit Card */}
              <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200/90 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === 'ta' ? 'தினசரி லாபம்' : 'Everyday Profit'}</span>
                  </span>
                  <div className="text-[10px] text-neutral-600 font-semibold mt-0.5">
                    {language === 'ta'
                      ? `விற்பனை: ₹${rec.totalCollected.toLocaleString('en-IN')} | லோடு: ₹${rec.loadCostSpend.toLocaleString('en-IN')}`
                      : `Sales: ₹${rec.totalCollected.toLocaleString('en-IN')} | Load: ₹${rec.loadCostSpend.toLocaleString('en-IN')}`}
                    {rec.expenses > 0 && ` | ${language === 'ta' ? 'செலவு' : 'Exp'}: ₹${rec.expenses.toLocaleString('en-IN')}`}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      rec.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    ₹{rec.profit.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* 2. Total Chicken Sale */}
              <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === 'ta' ? 'மொத்த கோழி விற்பனை' : 'Total Chicken Sale'}</span>
                  </span>
                  <span className="text-sm font-black text-emerald-800">
                    ₹{rec.chickenSaleAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 font-bold pt-0.5 border-t border-neutral-200/60">
                  <span>
                    {language === 'ta' ? 'மொத்த எடை:' : 'Total Weight:'}{' '}
                    <strong className="text-neutral-900">{rec.chickenSaleKg} kg</strong>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    (ஹோல்சேல்: {rec.wholesaleKg} kg | ரீடெய்ல்: {rec.retailKg} kg)
                  </span>
                </div>
              </div>

              {/* 3. Under: Total Egg Sales */}
              <div className="bg-orange-50/40 rounded-2xl p-3 border border-orange-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                    <Egg className="w-3.5 h-3.5 text-orange-600" />
                    <span>{language === 'ta' ? 'மொத்த முட்டை விற்பனை' : 'Total Egg Sales'}</span>
                  </span>
                  <span className="text-sm font-black text-orange-900">
                    ₹{rec.eggSaleAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 font-bold pt-0.5 border-t border-orange-200/60">
                  <span>
                    {language === 'ta' ? 'முட்டை அளவு:' : 'Total Eggs:'}{' '}
                    <strong className="text-orange-950">
                      {rec.eggSaleTares} {language === 'ta' ? 'தட்டு' : 'Tares'}
                      {rec.eggSaleRem > 0 ? ` +${rec.eggSaleRem}` : ''}
                    </strong>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    ({rec.eggSaleQty} {language === 'ta' ? 'முட்டைகள்' : 'eggs'})
                  </span>
                </div>
              </div>

              {/* 4. Everyday Remind Me Chicken and Egg (Closing/Remaining Stock) */}
              <div className="bg-gradient-to-r from-emerald-50/50 to-orange-50/50 rounded-2xl p-3 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wide">
                    {language === 'ta'
                      ? 'தினசரி மீதி இருப்பு (Remind Me Stock)'
                      : 'Everyday Remind Me Chicken & Egg'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Chicken Remaining */}
                  <div className="bg-white rounded-xl p-2 border border-emerald-200">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase block">
                      🐔 {language === 'ta' ? 'மீதி கோழி' : 'Chicken Left'}
                    </span>
                    <div className="text-base font-black text-emerald-900">
                      {rec.chickenRemainingKg} <span className="text-[10px] text-neutral-500">kg</span>
                    </div>
                  </div>

                  {/* Egg Remaining */}
                  <div className="bg-white rounded-xl p-2 border border-orange-200">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase block">
                      🥚 {language === 'ta' ? 'மீதி முட்டை' : 'Eggs Left'}
                    </span>
                    <div className="text-base font-black text-orange-950">
                      {rec.eggRemainingTares} <span className="text-[10px] text-neutral-500">{language === 'ta' ? 'தட்டு' : 'T'}</span>
                      {rec.eggRemainingRem > 0 && ` +${rec.eggRemainingRem}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
