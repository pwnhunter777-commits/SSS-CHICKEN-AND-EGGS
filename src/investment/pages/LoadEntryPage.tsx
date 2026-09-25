import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { InvestmentItemType, InvestmentDayData } from '../types';
import { saveInvestmentData, PreviousDayStock } from '../utils/storage';

interface LoadEntryPageProps {
  data: InvestmentDayData;
  onChangeData: (updated: InvestmentDayData) => void;
  language?: 'en' | 'ta';
  previousStock?: PreviousDayStock | null;
}

export const LoadEntryPage: React.FC<LoadEntryPageProps> = ({
  data,
  onChangeData,
  language = 'en',
  previousStock,
}) => {
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [saveToastMsg, setSaveToastMsg] = useState<string | null>(null);

  const isChicken = data.itemType === 'chicken';

  // 1 & 2: Toggle Chicken / Egg
  const handleSelectType = (type: InvestmentItemType) => {
    const isNextChicken = type === 'chicken';
    const nextSales = { ...data.sales };
    if (!data.isCustomOverridden) {
      if (isNextChicken) {
        const oldStock = data.chickenLoad.oldStockKg !== undefined
          ? Number(data.chickenLoad.oldStockKg)
          : (Number(data.openingStock?.chickenKg) || 0);
        const qty = data.chickenLoad.totalIncomeKg;
        const rate = data.chickenLoad.ratePerKg;
        const wastage = data.chickenLoad.wastagePercent;
        const totalGross = Math.round((oldStock + qty) * 100) / 100;
        const wKg = wastage > 0 ? Math.round((totalGross * (wastage / 100)) * 100) / 100 : 0;
        const totalNet = Math.max(0, Math.round((totalGross - wKg) * 100) / 100);
        const totalAmt = data.chickenLoad.totalAmount || Math.round(totalNet * rate * 100) / 100;
        nextSales.loadPriceSpend = totalAmt;
        nextSales.totalIncomeKg = totalNet;
      } else {
        const tares = data.eggLoad.totalTareIncome ?? (data.eggLoad.totalIncomeCount ? data.eggLoad.totalIncomeCount / 30 : 0);
        const price = data.eggLoad.pricePerTare ?? (data.eggLoad.ratePerUnit ? data.eggLoad.ratePerUnit * 30 : 0);
        nextSales.loadPriceSpend = tares * price;
        nextSales.totalIncomeKg = tares * 30;
      }
    }

    onChangeData({
      ...data,
      itemType: type,
      sales: nextSales,
    });
  };

  // Chicken Values
  const chickenWastage = data.chickenLoad.wastagePercent;
  const chickenQuantity = data.chickenLoad.totalIncomeKg;
  const chickenRate = data.chickenLoad.ratePerKg;
  const chickenOldStock = data.chickenLoad.oldStockKg !== undefined
    ? Number(data.chickenLoad.oldStockKg)
    : (data.openingStock?.chickenKg !== undefined ? Number(data.openingStock.chickenKg) : 0);

  // Total gross weight: Old stock + Today total weight (e.g. 100 + 200 = 300 kg)
  const chickenTotalGrossKg = Math.round((chickenOldStock + chickenQuantity) * 100) / 100;

  // Calculation of KG after reducing wastage from combined gross weight (e.g. 300 with 20% wastage = 60 kg -> 240 kg)
  const wastageKg = Math.round((chickenTotalGrossKg * (chickenWastage / 100)) * 100) / 100;
  const chickenNetTotalKg = chickenWastage > 0
    ? Math.max(0, Math.round((chickenTotalGrossKg - wastageKg) * 100) / 100)
    : chickenTotalGrossKg;

  // Total cost: (Old stock + Today weight - Wastage) × Price per KG
  const chickenTotalCost = Math.round(chickenNetTotalKg * chickenRate * 100) / 100;
  const chickenNetCost = chickenTotalCost;

  // Egg Values (Tare based: 1 Tare = 30 Eggs)
  const eggTareIncome = Math.round(data.eggLoad.totalTareIncome ?? (data.eggLoad.totalIncomeCount ? data.eggLoad.totalIncomeCount / 30 : 0));
  const eggPricePerTare = Math.round(data.eggLoad.pricePerTare ?? (data.eggLoad.ratePerUnit ? data.eggLoad.ratePerUnit * 30 : 0));
  const eggTotalCount = Math.round(eggTareIncome * 30);
  const eggTotalPrice = Math.round(eggTareIncome * eggPricePerTare);

  // Handlers for Chicken updates
  const handleUpdateChicken = (field: 'wastage' | 'quantity' | 'rate' | 'oldStock', value: number) => {
    const nextChicken = { ...data.chickenLoad };
    let newQty = chickenQuantity;
    let newRate = chickenRate;
    let newOldStock = chickenOldStock;

    if (field === 'oldStock') {
      newOldStock = typeof value === 'number' && !isNaN(value) ? Math.max(0, value) : 0;
      nextChicken.oldStockKg = newOldStock;
    } else if (field === 'quantity') {
      newQty = typeof value === 'number' && !isNaN(value) ? Math.max(0, value) : 0;
      nextChicken.totalIncomeKg = newQty;
    } else if (field === 'rate') {
      newRate = typeof value === 'number' && !isNaN(value) ? Math.max(0, value) : 0;
      nextChicken.ratePerKg = newRate;
    } else if (field === 'wastage') {
      nextChicken.wastagePercent = typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(100, value)) : 0;
    }

    const totalCombinedGross = Math.round((newQty + newOldStock) * 100) / 100;
    const calcWastageKg = nextChicken.wastagePercent > 0
      ? Math.round((totalCombinedGross * (nextChicken.wastagePercent / 100)) * 100) / 100
      : 0;
    const totalCombinedNet = Math.max(0, Math.round((totalCombinedGross - calcWastageKg) * 100) / 100);
    const totalCost = Math.round(totalCombinedNet * nextChicken.ratePerKg * 100) / 100;

    nextChicken.totalAmount = totalCost;

    const nextSales = { ...data.sales };
    nextSales.loadPriceSpend = totalCost;
    nextSales.totalIncomeKg = totalCombinedNet;

    const nextOpening = {
      ...(data.openingStock || { eggNos: 0 }),
      chickenKg: newOldStock,
      appliedToLoad: true,
    };

    onChangeData({
      ...data,
      chickenLoad: nextChicken,
      sales: nextSales,
      openingStock: nextOpening,
    });
  };

  // Handlers for Egg updates (Only ask total tare income & price of a tare)
  const handleUpdateEgg = (field: 'tareIncome' | 'pricePerTare', value: number) => {
    const validVal = isNaN(value) ? 0 : Math.max(0, Math.round(value));
    const currentTares = field === 'tareIncome' ? validVal : eggTareIncome;
    const currentPrice = field === 'pricePerTare' ? validVal : eggPricePerTare;

    const nextEgg = {
      ...data.eggLoad,
      totalTareIncome: currentTares,
      pricePerTare: currentPrice,
      totalIncomeCount: currentTares * 30,
      ratePerUnit: currentTares > 0 ? Math.round(currentPrice / 30) : 0,
      wastagePercent: 0,
    };

    const nextMultiplied = Math.round(currentTares * currentPrice);
    const nextSales = { ...data.sales };
    nextSales.loadPriceSpend = nextMultiplied;
    nextSales.totalIncomeKg = currentTares * 30; // total egg units

    onChangeData({
      ...data,
      eggLoad: nextEgg,
      sales: nextSales,
    });
  };

  // Explicit Save Everything handler for Investment Load Inward
  const handleSaveEverything = () => {
    const cTotalGross = Math.round((chickenOldStock + chickenQuantity) * 100) / 100;
    const cWastageKg = chickenWastage > 0
      ? Math.round((cTotalGross * (chickenWastage / 100)) * 100) / 100
      : 0;
    const cTotalNet = Math.max(0, Math.round((cTotalGross - cWastageKg) * 100) / 100);
    const cTotalCost = Math.round(cTotalNet * chickenRate * 100) / 100;
    const nextChicken = {
      ...data.chickenLoad,
      oldStockKg: chickenOldStock,
      totalIncomeKg: chickenQuantity,
      ratePerKg: chickenRate,
      wastagePercent: chickenWastage,
      totalAmount: cTotalCost,
    };

    const nextEgg = {
      ...data.eggLoad,
      totalTareIncome: eggTareIncome,
      pricePerTare: eggPricePerTare,
      totalIncomeCount: eggTotalCount,
      ratePerUnit: eggTareIncome > 0 ? Math.round(eggPricePerTare / 30) : 0,
      wastagePercent: 0,
    };

    // Calculate spend across chicken + egg loads
    const calcCost = Math.round((cTotalCost + eggTotalPrice) * 100) / 100;
    const nextSales = {
      ...data.sales,
      loadPriceSpend: calcCost > 0 ? calcCost : data.sales.loadPriceSpend,
      totalIncomeKg: cTotalNet > 0 ? cTotalNet : data.sales.totalIncomeKg,
    };

    const nextOpening = {
      ...(data.openingStock || { eggNos: 0 }),
      chickenKg: chickenOldStock,
      appliedToLoad: true,
    };

    const updatedData: InvestmentDayData = {
      ...data,
      chickenLoad: nextChicken,
      eggLoad: nextEgg,
      sales: nextSales,
      openingStock: nextOpening,
    };

    onChangeData(updatedData);
    saveInvestmentData(updatedData);

    setIsSavedRecently(true);
    const msg = language === 'ta'
      ? 'லோடு விவரங்கள் அனைத்தும் போனில் சேமிக்கப்பட்டது!'
      : 'All Load Inward data saved successfully to phone!';
    setSaveToastMsg(msg);

    setTimeout(() => {
      setIsSavedRecently(false);
    }, 2500);
    setTimeout(() => {
      setSaveToastMsg(null);
    }, 3500);
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto px-3 sm:px-4 py-2 select-none">
      {/* Toast Notification */}
      {saveToastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white text-xs sm:text-sm font-black px-4 py-2 rounded-full shadow-xl border-2 border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToastMsg}</span>
        </div>
      )}

      {/* Top Switcher - Chicken / Egg */}
      <div className="grid grid-cols-2 rounded-xl bg-slate-200/80 p-0.5 mb-3 border border-slate-300 shadow-2xs">
        <button
          type="button"
          onClick={() => handleSelectType('chicken')}
          className={`py-1.5 px-3 rounded-lg font-black text-xs sm:text-[13px] transition-all flex items-center justify-center cursor-pointer ${
            isChicken
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          <span>{language === 'ta' ? 'சிக்கன் (கிலோ)' : 'Chicken (KG)'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectType('egg')}
          className={`py-1.5 px-3 rounded-lg font-black text-xs sm:text-[13px] transition-all flex items-center justify-center cursor-pointer ${
            !isChicken
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          <span>{language === 'ta' ? 'முட்டை (தட்டு)' : 'Egg (Tare)'}</span>
        </button>
      </div>

      {/* ======================= EGG TARE FORM ======================= */}
      {!isChicken ? (
        <div id="egg-tare-load-form" className="space-y-4 animate-in fade-in">
          {/* Main Card: Only ask Total Tare Income & Price of a Tare */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            {/* Header: Title and Tare Info */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {language === 'ta' ? 'முட்டை லோடு (தட்டு)' : 'Egg Inward (Tare)'}
              </h2>

              {/* 30 eggs in 1 tare rule pill */}
              <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center shadow-2xs">
                <span className="text-xs font-bold">1 {language === 'ta' ? 'தட்டு' : 'Tare'} = 30 {language === 'ta' ? 'முட்டை' : 'Eggs'}</span>
              </div>
            </div>

            {/* Inputs: 1. Total Tare Income & 2. Price of a Tare */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Total Tare Income */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  {language === 'ta' ? 'மொத்த தட்டு' : 'Total Tares'}
                </label>
                <div className="relative">
                  <input
                    id="input-egg-tare-income"
                    type="number"
                    step="1"
                    min="0"
                    value={eggTareIncome === 0 ? '' : eggTareIncome}
                    onChange={(e) => handleUpdateEgg('tareIncome', parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-full font-black text-2xl bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border-2 border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl py-3 px-4 outline-hidden transition-all shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1 pointer-events-none">
                    <span className="text-xs font-black text-slate-500 uppercase">
                      {language === 'ta' ? 'தட்டு' : 'Tares'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price of a Tare */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  {language === 'ta' ? 'ஒரு தட்டு விலை' : 'Price per Tare'}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-base font-black text-neutral-400 pointer-events-none">
                    ₹
                  </div>
                  <input
                    id="input-egg-price-per-tare"
                    type="number"
                    step="1"
                    min="0"
                    value={eggPricePerTare === 0 ? '' : eggPricePerTare}
                    onChange={(e) => handleUpdateEgg('pricePerTare', parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-full font-black text-2xl bg-neutral-50 hover:bg-neutral-100 focus:bg-white text-neutral-900 border-2 border-emerald-300 focus:border-emerald-700 rounded-2xl py-3 pl-8 pr-16 outline-hidden transition-all shadow-2xs"
                  />
                  <span className="absolute right-3 top-3.5 text-xs font-black text-emerald-800 pointer-events-none">
                    {language === 'ta' ? '/ தட்டு' : '/ tare'}
                  </span>
                </div>
              </div>
            </div>

            {/* Multiplied Calculation Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-emerald-950">
                  {language === 'ta' ? 'லோடு தொகை' : 'Load Cost'}
                </span>
              </div>
              <div className="w-full rounded-2xl border-2 border-emerald-700 bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white p-4 shadow-md shadow-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-emerald-200 font-mono">
                      {eggTareIncome || 0} {language === 'ta' ? 'தட்டு' : 'Tares'} × ₹{eggPricePerTare || 0}
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    ₹{eggTotalPrice.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Prominent Summary Cards for Egg Tare and Total Price */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Total Tare & Egg Count */}
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-xs flex flex-col justify-between min-h-[145px]">
              <div className="mb-2">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
                  {language === 'ta' ? 'மொத்த தட்டு' : 'Total Tares'}
                </span>
              </div>

              <div className="my-auto">
                <div className="text-3xl font-black text-emerald-950 tracking-tight">
                  {eggTareIncome}
                  <span className="text-xs font-bold text-amber-700 ml-1">
                    {language === 'ta' ? 'தட்டு' : 'Tares'}
                  </span>
                </div>
                <div className="text-xs font-bold text-neutral-600 mt-1 space-y-0.5">
                  <div>{eggTotalCount.toLocaleString()} {language === 'ta' ? 'முட்டை' : 'Eggs'}</div>
                  {data.openingStock?.appliedToLoad && Number(data.openingStock.eggNos || 0) > 0 && (
                    <div className="text-[11px] font-black text-orange-800 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 inline-block">
                      + {Math.floor((data.openingStock.eggNos || 0) / 30)} {language === 'ta' ? 'தட்டு தொடக்க இருப்பு' : 'Opening Tares'} ({data.openingStock.eggNos} {language === 'ta' ? 'முட்டை' : 'Eggs'})
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Total Egg Load Price */}
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-600 shadow-xs bg-emerald-50/25 flex flex-col justify-between min-h-[145px]">
              <div className="mb-2">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  {language === 'ta' ? 'மொத்த தொகை' : 'Total Amount'}
                </span>
              </div>

              <div className="my-auto">
                <div className="text-3xl font-black text-emerald-700 tracking-tight">
                  ₹{eggTotalPrice.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================= CHICKEN FORM ======================= */
        <div id="chicken-load-form" className="space-y-4 animate-in fade-in">
          {/* Main Card: Ask Total Weight & Price per KG (Identical structure to Egg form) */}
          <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-xs space-y-4">
            {/* Header: Title and Wastage pill */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-100">
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                {language === 'ta' ? 'சிக்கன் லோடு (கிலோ)' : 'Chicken Inward (KG)'}
              </h2>

              {/* Wastage input pill styled like Tare pill */}
              <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1.5 shadow-2xs">
                <span className="text-xs font-bold">{language === 'ta' ? 'வேஸ்டேஜ்' : 'Wastage'}:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={chickenWastage === 0 ? '' : chickenWastage}
                  onChange={(e) => handleUpdateChicken('wastage', parseFloat(e.target.value))}
                  placeholder="0"
                  aria-label={language === 'ta' ? 'வேஸ்டேஜ் %' : 'Wastage %'}
                  className="w-10 text-center font-black text-xs bg-white text-neutral-900 border border-amber-300 rounded-lg py-0.5 outline-hidden"
                />
                <span className="text-xs font-bold text-amber-800">%</span>
              </div>
            </div>

            {/* Inputs: 1. Old Stock (KG), 2. Today Total Weight (KG) & 3. KG Price (₹/kg) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* 1. Old Stock (KG) */}
              <div className="space-y-1.5">
                <label htmlFor="input-chicken-old-stock" className="text-xs font-black text-slate-800 block">
                  {language === 'ta' ? 'பழைய இருப்பு (கிலோ)' : 'Old Stock (KG)'}
                </label>
                <div className="relative">
                  <input
                    id="input-chicken-old-stock"
                    type="number"
                    step="0.01"
                    min="0"
                    value={chickenOldStock === 0 ? '' : chickenOldStock}
                    onChange={(e) => handleUpdateChicken('oldStock', parseFloat(e.target.value))}
                    placeholder="00.00"
                    className="w-full font-black text-2xl bg-amber-50/40 hover:bg-white focus:bg-white text-slate-900 border-2 border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 rounded-2xl py-3 px-4 outline-hidden transition-all shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1 pointer-events-none">
                    <span className="text-xs font-black text-amber-700 uppercase">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Today Total Weight (KG) */}
              <div className="space-y-1.5">
                <label htmlFor="input-chicken-kg" className="text-xs font-black text-slate-800 block">
                  {language === 'ta' ? 'இன்றைய லோடு (கிலோ)' : 'Today Weight (KG)'}
                </label>
                <div className="relative">
                  <input
                    id="input-chicken-kg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={chickenQuantity === 0 ? '' : chickenQuantity}
                    onChange={(e) => handleUpdateChicken('quantity', parseFloat(e.target.value))}
                    placeholder="000.00"
                    className="w-full font-black text-2xl bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border-2 border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl py-3 px-4 outline-hidden transition-all shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1 pointer-events-none">
                    <span className="text-xs font-black text-slate-500 uppercase">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. KG Price in ₹/kg */}
              <div className="space-y-1.5">
                <label htmlFor="input-chicken-total-amount" className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>{language === 'ta' ? 'கிலோ விலை (ரூபாய்)' : 'Price per KG'}</span>
                  <span className="text-[10px] text-slate-500 font-bold">₹/kg</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-base font-black text-slate-400 pointer-events-none">
                    ₹
                  </div>
                  <input
                    id="input-chicken-total-amount"
                    type="number"
                    step="0.5"
                    min="0"
                    value={chickenRate === 0 ? '' : chickenRate}
                    onChange={(e) => handleUpdateChicken('rate', parseFloat(e.target.value))}
                    placeholder="000.00"
                    className="w-full font-black text-2xl bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border-2 border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl py-3 pl-8 pr-16 outline-hidden transition-all shadow-2xs"
                  />
                  <span className="absolute right-3 top-3.5 text-xs font-black text-slate-500 pointer-events-none">
                    {language === 'ta' ? '/ கிலோ' : '/ kg'}
                  </span>
                </div>
              </div>
            </div>

            {/* Multiplied Calculation Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-slate-800">
                  {language === 'ta' ? 'மொத்த தொகை' : 'Total Amount'}
                </span>
              </div>
              <div className="w-full rounded-2xl border border-emerald-700 bg-emerald-800 text-white p-4 shadow-md shadow-emerald-950/20">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="text-xs font-semibold text-emerald-200 font-mono">
                      {chickenOldStock > 0 && chickenWastage > 0 ? (
                        <span>
                          ({chickenOldStock} kg + {chickenQuantity || 0} kg = {chickenTotalGrossKg} kg - {wastageKg} kg = {chickenNetTotalKg} kg) × ₹{chickenRate || 0}
                        </span>
                      ) : chickenOldStock > 0 ? (
                        <span>
                          ({chickenOldStock} kg + {chickenQuantity || 0} kg = {chickenNetTotalKg} kg) × ₹{chickenRate || 0}
                        </span>
                      ) : chickenWastage > 0 ? (
                        <span>
                          ({chickenQuantity || 0} kg - {wastageKg} kg = {chickenNetTotalKg} kg) × ₹{chickenRate || 0}
                        </span>
                      ) : (
                        <span>
                          {chickenQuantity || 0} kg × ₹{chickenRate || 0}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    ₹{chickenTotalCost.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Large Summary Cards at Bottom (identical to Egg form) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total KG */}
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-xs flex flex-col justify-between min-h-[145px]">
              <div className="mb-2">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
                  {chickenOldStock > 0
                    ? (language === 'ta' ? 'மொத்த எடை (இருப்புடன்)' : 'Total Weight (with Stock)')
                    : (language === 'ta' ? 'நிகர எடை' : 'Net Weight')}
                </span>
              </div>

              <div className="my-auto">
                <div className="text-3xl font-black text-emerald-950 tracking-tight">
                  {chickenNetTotalKg}
                  <span className="text-xs font-bold text-amber-700 ml-1">kg</span>
                </div>
              </div>
            </div>

            {/* Total Price Spend based on net kg after reducing wastage */}
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-600 shadow-xs bg-emerald-50/25 flex flex-col justify-between min-h-[145px]">
              <div className="mb-2">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  {language === 'ta' ? 'மொத்த தொகை' : 'Total Amount'}
                </span>
              </div>

              <div className="my-auto">
                <div className="text-3xl font-black text-emerald-700 tracking-tight">
                  ₹{chickenTotalCost.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Save Everything Button */}
      <div className="pt-4 pb-3">
        <button
          type="button"
          id="btn-save-load-inward"
          onClick={handleSaveEverything}
          className={`w-full min-h-[3rem] px-4 py-2.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer touch-manipulation ${
            isSavedRecently
              ? 'bg-emerald-800 text-white ring-2 ring-emerald-400 shadow-emerald-900/30'
              : 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 active:bg-emerald-950 text-white shadow-emerald-900/20'
          }`}
          title={language === 'ta' ? 'அனைத்து லோடு விவரங்களையும் போனில் சேமிக்க' : 'Save all load inward data to phone'}
        >
          {isSavedRecently ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>{language === 'ta' ? 'வெற்றிகரமாக சேமிக்கப்பட்டது!' : 'Saved Successfully!'}</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5 text-emerald-200" />
              <span>{language === 'ta' ? 'அனைத்தையும் சேமிக்க (Save Everything)' : 'Save Everything'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

