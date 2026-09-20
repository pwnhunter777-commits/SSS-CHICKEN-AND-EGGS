import React, { useState } from 'react';
import { PackageOpen, Calendar, ArrowRight, CheckCircle2, X, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';
import { PreviousDayStock } from '../utils/storage';
import { InvestmentDayData } from '../types';
import { LanguageCode } from '../../types';

interface OpeningStockBannerProps {
  previousStock: PreviousDayStock | null;
  currentData: InvestmentDayData;
  onChangeData: (updated: InvestmentDayData) => void;
  language?: LanguageCode;
  variant?: 'banner' | 'card' | 'compact';
  onDismiss?: () => void;
}

export const OpeningStockBanner: React.FC<OpeningStockBannerProps> = ({
  previousStock,
  currentData,
  onChangeData,
  language = 'en',
  variant = 'card',
  onDismiss,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!previousStock) return null;

  const isApplied = Boolean(currentData.openingStock?.appliedToLoad);
  const chickenRem = Math.max(0, previousStock.chickenRemainingKg);
  const eggNosRem = Math.max(0, previousStock.eggRemainingNos);
  const eggTaresRem = Math.floor(eggNosRem / 30);
  const eggUnitRem = eggNosRem % 30;

  // Format date display
  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
          day: 'numeric',
          month: 'short',
        });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const handleToggleApply = () => {
    if (isApplied) {
      // Remove opening stock from load
      onChangeData({
        ...currentData,
        openingStock: {
          fromPreviousDate: previousStock.date,
          chickenKg: chickenRem,
          eggNos: eggNosRem,
          eggTares: eggTaresRem,
          eggRem: eggUnitRem,
          appliedToLoad: false,
        },
      });
    } else {
      // Apply opening stock to load
      onChangeData({
        ...currentData,
        openingStock: {
          fromPreviousDate: previousStock.date,
          chickenKg: chickenRem,
          eggNos: eggNosRem,
          eggTares: eggTaresRem,
          eggRem: eggUnitRem,
          appliedToLoad: true,
        },
      });
    }
  };

  // Compact Variant (Pill in Top Bar)
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-400/40 px-2.5 py-1 rounded-xl text-[11px] font-bold text-white shadow-xs">
        <PackageOpen className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <span className="text-emerald-200">
          {language === 'ta' ? 'தொடக்க இருப்பு:' : 'Opening Stock:'}
        </span>
        <span className="font-black text-amber-300">
          {chickenRem} kg
        </span>
        <span className="text-emerald-400">|</span>
        <span className="font-black text-orange-300">
          {eggTaresRem} {language === 'ta' ? 'தட்டு' : 'Tares'}{eggUnitRem > 0 ? ` +${eggUnitRem}` : ''}
        </span>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-300/80 rounded-xl p-2 px-2.5 mb-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PackageOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="text-[11px] font-black text-emerald-950">
            {language === 'ta' ? 'நேற்றைய மீதி:' : 'Prev Day Stock:'}
          </span>
          <span className="text-[10px] font-black text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded-md border border-amber-300/60">
            {chickenRem} kg
          </span>
          <span className="text-[10px] font-black text-orange-800 bg-orange-100/90 px-1.5 py-0.5 rounded-md border border-orange-300/60">
            {eggTaresRem} {language === 'ta' ? 'தட்டு' : 'Tares'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-white/90 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
        >
          {language === 'ta' ? 'காட்டு' : 'View'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50/90 via-emerald-50/80 to-amber-50/90 rounded-2xl p-2.5 sm:p-3 border border-amber-300/80 shadow-2xs mb-2.5 relative overflow-hidden animate-in fade-in slide-in-from-top-1">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-amber-200/70">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <PackageOpen className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs font-black text-emerald-950 truncate">
              {language === 'ta' ? 'அடுத்த நாள் தொடக்க இருப்பு' : 'Opening Stock'}
            </h3>
            <span className="text-[9px] font-extrabold bg-amber-200/90 text-amber-950 px-1.5 py-0.2 rounded-md border border-amber-300/60">
              {language === 'ta' ? 'நேற்றைய இருப்பு' : 'Previous Day'} ({formatDateLabel(previousStock.date)})
            </span>
          </div>
        </div>

        {/* Minimize / Dismiss actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white px-1.5 py-0.5 rounded-md border border-slate-200/80 transition-all cursor-pointer"
            title="Minimize"
          >
            {language === 'ta' ? 'சுருக்கு' : 'Minimize'}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-0.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-black/5 cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2 Highlight Cards: Remaining Chicken & Egg */}
      <div className="grid grid-cols-2 gap-1.5 my-1.5">
        {/* Left Card: Remaining Chicken Stock */}
        <div className="bg-white/95 rounded-xl p-2 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-0.5">
              🐔 {language === 'ta' ? 'நேற்றைய மீதி கோழி' : 'Previous Day Chicken'}
            </span>
            <span className="text-[8px] font-bold text-slate-400">
              {formatDateLabel(previousStock.date)}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-amber-950 tracking-tight">
              {chickenRem}
            </span>
            <span className="text-[10px] font-bold text-amber-700 uppercase">kg</span>
          </div>
          <p className="text-[8px] text-slate-400 font-medium truncate mt-0.5">
            {language === 'ta'
              ? `வரவு: ${previousStock.chickenIncomingKg} | விற்றது: ${previousStock.chickenSoldKg}`
              : `In: ${previousStock.chickenIncomingKg} | Sold: ${previousStock.chickenSoldKg} kg`}
          </p>
        </div>

        {/* Right Card: Remaining Egg Stock */}
        <div className="bg-white/95 rounded-xl p-2 border border-orange-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-orange-900 flex items-center gap-0.5">
              🥚 {language === 'ta' ? 'நேற்றைய மீதி முட்டை' : 'Previous Day Eggs'}
            </span>
            <span className="text-[8px] font-bold text-slate-400">
              {formatDateLabel(previousStock.date)}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-orange-950 tracking-tight">
              {eggTaresRem}
            </span>
            <span className="text-[10px] font-bold text-orange-700 uppercase">
              {language === 'ta' ? 'தட்டு' : 'Tares'}
            </span>
            {eggUnitRem > 0 && (
              <span className="text-[9px] font-extrabold text-orange-800 bg-orange-100 px-1 py-0.2 rounded-sm">
                +{eggUnitRem}
              </span>
            )}
          </div>
          <p className="text-[8px] text-slate-400 font-medium truncate mt-0.5">
            {language === 'ta'
              ? `வரவு: ${Math.round(previousStock.eggInwardNos / 30)} தட்டு | விற்றது: ${previousStock.eggSoldNos}`
              : `In: ${Math.round(previousStock.eggInwardNos / 30)}T | Sold: ${previousStock.eggSoldNos}`}
          </p>
        </div>
      </div>

      {/* Action Footer: Add to Today's Stock or Exclude */}
      <div className="mt-1.5 pt-1.5 border-t border-amber-200/70 flex items-center justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          {isApplied ? (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-lg w-fit">
              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
              <span className="truncate">
                {language === 'ta' ? 'இருப்பில் சேர்க்கப்பட்டது' : 'Added to Stock'}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-600 font-medium truncate block">
              {language === 'ta' ? 'இன்றைய லோடுடன் சேர்க்கவா?' : 'Include in today’s stock?'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleApply}
          className={`py-1 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
            isApplied
              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs shadow-emerald-700/20'
          }`}
        >
          {isApplied ? (
            <>
              <MinusCircle className="w-3 h-3 text-slate-600" />
              <span>{language === 'ta' ? 'நீக்கு' : 'Exclude'}</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-3 h-3 text-white" />
              <span>{language === 'ta' ? 'சேர் (+)' : 'Add (+)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
