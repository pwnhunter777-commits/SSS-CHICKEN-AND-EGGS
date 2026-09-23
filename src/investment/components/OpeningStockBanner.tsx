import React, { useState } from 'react';
import {
  PackageOpen,
  Calendar,
  ArrowRight,
  CheckCircle2,
  X,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Edit3,
  Check,
} from 'lucide-react';
import { PreviousDayStock, getPreviousDateKey } from '../utils/storage';
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
  const [isEditing, setIsEditing] = useState(false);

  const effectiveStock: PreviousDayStock = previousStock || {
    date: currentData.openingStock?.fromPreviousDate || getPreviousDateKey(currentData.date, 1),
    daysAgo: 1,
    chickenRemainingKg: Number(currentData.openingStock?.chickenKg || 0),
    chickenIncomingKg: 0,
    chickenSoldKg: 0,
    eggRemainingNos: Number(currentData.openingStock?.eggNos || 0),
    eggRemainingTares: Math.floor(Number(currentData.openingStock?.eggNos || 0) / 30),
    eggRemainingRem: Number(currentData.openingStock?.eggNos || 0) % 30,
    eggInwardNos: 0,
    eggSoldNos: 0,
    hasActivity: Boolean(currentData.openingStock?.appliedToLoad),
  };

  const isApplied = Boolean(currentData.openingStock?.appliedToLoad);
  const chickenRem = currentData.openingStock?.chickenKg !== undefined && isApplied
    ? Number(currentData.openingStock.chickenKg)
    : Math.max(0, effectiveStock.chickenRemainingKg);

  const eggNosRem = currentData.openingStock?.eggNos !== undefined && isApplied
    ? Number(currentData.openingStock.eggNos)
    : Math.max(0, effectiveStock.eggRemainingNos);

  const eggTaresRem = Math.floor(eggNosRem / 30);
  const eggUnitRem = eggNosRem % 30;

  const [editChickenKg, setEditChickenKg] = useState<string>(String(chickenRem));
  const [editEggTares, setEditEggTares] = useState<string>(String(eggTaresRem));
  const [editEggUnits, setEditEggUnits] = useState<string>(String(eggUnitRem));

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
          fromPreviousDate: effectiveStock.date,
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
          fromPreviousDate: effectiveStock.date,
          chickenKg: chickenRem,
          eggNos: eggNosRem,
          eggTares: eggTaresRem,
          eggRem: eggUnitRem,
          appliedToLoad: true,
        },
      });
    }
  };

  const handleSaveCustomEdit = () => {
    const parsedKg = Math.max(0, parseFloat(editChickenKg) || 0);
    const parsedTares = Math.max(0, parseInt(editEggTares, 10) || 0);
    const parsedUnits = Math.max(0, parseInt(editEggUnits, 10) || 0);
    const totalEggs = parsedTares * 30 + parsedUnits;

    onChangeData({
      ...currentData,
      openingStock: {
        fromPreviousDate: effectiveStock.date,
        chickenKg: parsedKg,
        eggNos: totalEggs,
        eggTares: parsedTares,
        eggRem: parsedUnits,
        appliedToLoad: true,
      },
    });
    setIsEditing(false);
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
    <div className="bg-gradient-to-r from-amber-50/90 via-emerald-50/80 to-amber-50/90 rounded-xl p-2 sm:p-2.5 border border-amber-300/80 shadow-2xs mb-2 relative overflow-hidden animate-in fade-in slide-in-from-top-1 text-xs">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-amber-200/70">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 rounded-md bg-amber-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <PackageOpen className="w-2.5 h-2.5" />
          </div>
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            <h3 className="text-[11px] font-black text-emerald-950 truncate">
              {language === 'ta' ? 'அடுத்த நாள் தொடக்க இருப்பு' : 'Opening Stock'}
            </h3>
            <span className="text-[8.5px] font-extrabold bg-amber-200/90 text-amber-950 px-1 py-0.2 rounded border border-amber-300/60">
              {language === 'ta' ? 'நேற்று' : 'Yesterday'} ({formatDateLabel(effectiveStock.date)})
            </span>
          </div>
        </div>

        {/* Header Actions: Edit, Minimize, Dismiss */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditChickenKg(String(chickenRem));
              setEditEggTares(String(eggTaresRem));
              setEditEggUnits(String(eggUnitRem));
              setIsEditing(!isEditing);
            }}
            className="text-[9.5px] font-bold text-amber-900 hover:text-amber-950 bg-amber-200/80 hover:bg-amber-200 px-1.5 py-0.5 rounded-md border border-amber-300 transition-all flex items-center gap-0.5 cursor-pointer"
            title="Edit Opening Stock"
          >
            <Edit3 className="w-2.5 h-2.5" />
            <span>{language === 'ta' ? 'திருத்து' : 'Edit'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="text-[9.5px] font-bold text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white px-1.5 py-0.5 rounded-md border border-slate-200/80 transition-all cursor-pointer"
            title="Minimize"
          >
            {language === 'ta' ? 'சுருக்கு' : 'Min'}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-0.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-black/5 cursor-pointer"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditing ? (
        <div className="bg-white/95 rounded-xl p-2.5 border-2 border-amber-400/80 my-1.5 shadow-sm space-y-2">
          <div className="text-[11px] font-black text-amber-950 flex items-center justify-between">
            <span>{language === 'ta' ? 'தொடக்க இருப்பு மாற்று / Custom Opening Stock' : 'Custom Opening Stock'}</span>
            <span className="text-[9px] text-slate-500 font-normal">({effectiveStock.date})</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-700 block mb-0.5">
                🐔 {language === 'ta' ? 'கோழி (கிலோ)' : 'Chicken (kg)'}
              </label>
              <input
                type="number"
                step="any"
                value={editChickenKg}
                onChange={(e) => setEditChickenKg(e.target.value)}
                placeholder="0"
                className="w-full text-xs font-black p-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-700 block mb-0.5">
                🥚 {language === 'ta' ? 'முட்டை (தட்டு + சில்லறை)' : 'Egg (Tares + Nos)'}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="1"
                  value={editEggTares}
                  onChange={(e) => setEditEggTares(e.target.value)}
                  placeholder="Tares"
                  title="Tares"
                  className="w-1/2 text-xs font-black p-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none"
                />
                <input
                  type="number"
                  step="1"
                  value={editEggUnits}
                  onChange={(e) => setEditEggUnits(e.target.value)}
                  placeholder="Nos"
                  title="Remaining Single Eggs"
                  className="w-1/2 text-xs font-black p-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              {language === 'ta' ? 'ரத்து' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveCustomEdit}
              className="px-3 py-1 text-[10px] font-black text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{language === 'ta' ? 'சேமி & சேர்' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2 Highlight Cards: Remaining Chicken & Egg */
        <div className="grid grid-cols-2 gap-1.5 my-1">
          {/* Left Card: Remaining Chicken Stock */}
          <div className="bg-white/95 rounded-lg p-1.5 border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-black uppercase tracking-wide text-amber-900 flex items-center gap-0.5 truncate">
                🐔 {language === 'ta' ? 'மீதி கோழி' : 'Chicken Rem'}
              </span>
              <span className="text-[7.5px] font-semibold text-slate-400">
                {formatDateLabel(effectiveStock.date)}
              </span>
            </div>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-sm sm:text-base font-black text-amber-950 tracking-tight">
                {chickenRem}
              </span>
              <span className="text-[9px] font-bold text-amber-700 uppercase">kg</span>
            </div>
            <p className="text-[7.5px] text-slate-400 font-medium truncate mt-0.5">
              {language === 'ta'
                ? `வரவு: ${effectiveStock.chickenIncomingKg} | விற்றது: ${effectiveStock.chickenSoldKg}`
                : `In: ${effectiveStock.chickenIncomingKg} | Sold: ${effectiveStock.chickenSoldKg} kg`}
            </p>
          </div>

          {/* Right Card: Remaining Egg Stock */}
          <div className="bg-white/95 rounded-lg p-1.5 border border-orange-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-black uppercase tracking-wide text-orange-900 flex items-center gap-0.5 truncate">
                🥚 {language === 'ta' ? 'மீதி முட்டை' : 'Egg Rem'}
              </span>
              <span className="text-[7.5px] font-semibold text-slate-400">
                {formatDateLabel(effectiveStock.date)}
              </span>
            </div>
            <div className="flex items-baseline gap-0.5 mt-0.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-orange-950 tracking-tight">
                {eggTaresRem}
              </span>
              <span className="text-[9px] font-bold text-orange-700 uppercase">
                {language === 'ta' ? 'தட்டு' : 'T'}
              </span>
              {eggUnitRem > 0 && (
                <span className="text-[8px] font-extrabold text-orange-800 bg-orange-100 px-1 py-0.2 rounded-xs">
                  +{eggUnitRem}
                </span>
              )}
            </div>
            <p className="text-[7.5px] text-slate-400 font-medium truncate mt-0.5">
              {language === 'ta'
                ? `வரவு: ${Math.round(effectiveStock.eggInwardNos / 30)} தட்டு | விற்றது: ${effectiveStock.eggSoldNos}`
                : `In: ${Math.round(effectiveStock.eggInwardNos / 30)}T | Sold: ${effectiveStock.eggSoldNos}`}
            </p>
          </div>
        </div>
      )}

      {/* Action Footer: Add to Today's Stock or Exclude */}
      <div className="mt-1 pt-1 border-t border-amber-200/70 flex items-center justify-between gap-1">
        <div className="min-w-0 flex-1">
          {isApplied ? (
            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.5 rounded-md w-fit">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
              <span className="truncate">
                {language === 'ta' ? 'சேர்க்கப்பட்டது' : 'Added to Stock'}
              </span>
            </div>
          ) : (
            <span className="text-[9px] text-slate-600 font-medium truncate block">
              {language === 'ta' ? 'இன்றைய லோடுடன் சேர்க்கவா?' : 'Include in today’s stock?'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleApply}
          className={`py-0.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
            isApplied
              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs shadow-emerald-700/20'
          }`}
        >
          {isApplied ? (
            <>
              <MinusCircle className="w-2.5 h-2.5 text-slate-600" />
              <span>{language === 'ta' ? 'நீக்கு' : 'Exclude'}</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-2.5 h-2.5 text-white" />
              <span>{language === 'ta' ? 'சேர் (+)' : 'Add (+)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
