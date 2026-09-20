import React from 'react';
import { PackageOpen, X, CheckCircle2, PlusCircle, ArrowRight, Sun, Calendar, Sparkles } from 'lucide-react';
import { PreviousDayStock } from '../utils/storage';
import { InvestmentDayData } from '../types';
import { LanguageCode } from '../../types';

interface OpeningStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousStock: PreviousDayStock | null;
  currentData: InvestmentDayData;
  onChangeData: (updated: InvestmentDayData) => void;
  language?: LanguageCode;
}

export const OpeningStockModal: React.FC<OpeningStockModalProps> = ({
  isOpen,
  onClose,
  previousStock,
  currentData,
  onChangeData,
  language = 'en',
}) => {
  if (!isOpen || !previousStock) return null;

  const isApplied = Boolean(currentData.openingStock?.appliedToLoad);
  const chickenRem = Math.max(0, previousStock.chickenRemainingKg);
  const eggNosRem = Math.max(0, previousStock.eggRemainingNos);
  const eggTaresRem = Math.floor(eggNosRem / 30);
  const eggUnitRem = eggNosRem % 30;

  const handleApply = () => {
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
    onClose();
  };

  const handleKeepAsReference = () => {
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border-2 border-emerald-500/40 relative overflow-hidden animate-in zoom-in-95">
        {/* Top Header Background Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title & Icon */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/20">
            <Sun className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                {language === 'ta' ? 'அடுத்த நாள் திறப்பு' : 'Next Day Opening'}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <h2 className="text-base font-black text-emerald-950 mt-0.5">
              {language === 'ta' ? 'மீதமுள்ள தொடக்க இருப்பு' : 'Remaining Opening Stock'}
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-medium mb-4 leading-relaxed">
          {language === 'ta'
            ? 'நேற்றைய நாளின் விற்பனைக்குப் பிறகு கடையில் மீதமுள்ள கோழி மற்றும் முட்டையின் இருப்பு விவரம்:'
            : 'Here is the remaining chicken and egg stock carried over from yesterday’s closing balance:'}
        </p>

        {/* 2 Big Stock Badges */}
        <div className="space-y-2.5 mb-5">
          {/* Chicken Box */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl p-3 border border-amber-200 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-amber-900 flex items-center gap-1">
                🐔 {language === 'ta' ? 'நேற்றைய மீதி கோழி' : 'Chicken Remaining'}
              </div>
              <div className="text-2xl font-black text-amber-950 mt-0.5">
                {chickenRem} <span className="text-xs font-bold text-amber-800 uppercase">kg</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 block">
                {language === 'ta' ? 'நேற்று வரவு' : 'Inward'}: {previousStock.chickenIncomingKg} kg
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">
                {language === 'ta' ? 'நேற்று விற்றது' : 'Sold'}: {previousStock.chickenSoldKg} kg
              </span>
            </div>
          </div>

          {/* Egg Box */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-2xl p-3 border border-orange-200 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-orange-900 flex items-center gap-1">
                🥚 {language === 'ta' ? 'நேற்றைய மீதி முட்டை' : 'Egg Remaining'}
              </div>
              <div className="text-2xl font-black text-orange-950 mt-0.5 flex items-baseline gap-1">
                {eggTaresRem}{' '}
                <span className="text-xs font-bold text-orange-800 uppercase">
                  {language === 'ta' ? 'தட்டு' : 'Tares'}
                </span>
                {eggUnitRem > 0 && (
                  <span className="text-xs font-black text-orange-900 bg-orange-200 px-1.5 py-0.5 rounded-md">
                    +{eggUnitRem}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 block">
                {language === 'ta' ? 'மொத்தம்' : 'Total'}: {eggNosRem} {language === 'ta' ? 'முட்டை' : 'Eggs'}
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">
                {language === 'ta' ? 'நேற்று விற்றது' : 'Sold'}: {previousStock.eggSoldNos} {language === 'ta' ? 'முட்டை' : 'Eggs'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/25 active:scale-98 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {language === 'ta'
                ? 'இன்றைய லோடுடன் சேர்த்துக்கொள் (+)'
                : 'Add to Today’s Available Stock (+)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleKeepAsReference}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {language === 'ta'
                ? 'குறிப்பாக மட்டும் வைக்க (Keep as Reference)'
                : 'Keep as Reference Only'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
