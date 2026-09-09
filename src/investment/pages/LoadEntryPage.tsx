import React from 'react';
import { InvestmentItemType, InvestmentDayData } from '../types';

interface LoadEntryPageProps {
  data: InvestmentDayData;
  onChangeData: (updated: InvestmentDayData) => void;
  language?: 'en' | 'ta';
}

export const LoadEntryPage: React.FC<LoadEntryPageProps> = ({
  data,
  onChangeData,
  language = 'en',
}) => {
  const isChicken = data.itemType === 'chicken';

  // 1 & 2: Toggle Chicken / Egg
  const handleSelectType = (type: InvestmentItemType) => {
    const isNextChicken = type === 'chicken';
    const nextSales = { ...data.sales };
    if (!data.isCustomOverridden) {
      if (isNextChicken) {
        const qty = data.chickenLoad.totalIncomeKg;
        const rate = data.chickenLoad.ratePerKg;
        const wastage = data.chickenLoad.wastagePercent;
        const totalAmt = data.chickenLoad.totalAmount || (qty * rate);
        nextSales.loadPriceSpend = totalAmt;
        nextSales.totalIncomeKg = wastage > 0 ? qty * (1 - wastage / 100) : qty;
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

  // Calculation of KG after reducing wastage (Net stock)
  const wastageKg = Math.round((chickenQuantity * (chickenWastage / 100)) * 100) / 100;
  const chickenNetKg = chickenWastage > 0
    ? Math.max(0, Math.round((chickenQuantity - wastageKg) * 100) / 100)
    : chickenQuantity;
  const chickenNetCost = Math.round(chickenNetKg * chickenRate * 100) / 100;

  // Egg Values (Tare based: 1 Tare = 30 Eggs)
  const eggTareIncome = data.eggLoad.totalTareIncome ?? (data.eggLoad.totalIncomeCount ? Math.round(data.eggLoad.totalIncomeCount / 30) : 0);
  const eggPricePerTare = data.eggLoad.pricePerTare ?? (data.eggLoad.ratePerUnit ? Math.round(data.eggLoad.ratePerUnit * 30) : 0);
  const eggTotalCount = Math.round(eggTareIncome * 30);
  const eggTotalPrice = Math.round(eggTareIncome * eggPricePerTare * 100) / 100;

  // Handlers for Chicken updates
  const handleUpdateChicken = (field: 'wastage' | 'quantity' | 'rate', value: number) => {
    const nextChicken = { ...data.chickenLoad };
    let newQty = chickenQuantity;
    let newRate = chickenRate;

    if (field === 'quantity') {
      newQty = typeof value === 'number' && !isNaN(value) ? Math.max(0, value) : 0;
      nextChicken.totalIncomeKg = newQty;
    } else if (field === 'rate') {
      newRate = typeof value === 'number' && !isNaN(value) ? Math.max(0, value) : 0;
      nextChicken.ratePerKg = newRate;
    } else if (field === 'wastage') {
      nextChicken.wastagePercent = typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(100, value)) : 0;
    }

    const netKg = nextChicken.wastagePercent > 0
      ? Math.max(0, Math.round((nextChicken.totalIncomeKg * (1 - nextChicken.wastagePercent / 100)) * 100) / 100)
      : nextChicken.totalIncomeKg;
    const netCost = Math.round(netKg * nextChicken.ratePerKg * 100) / 100;

    nextChicken.totalAmount = netCost;

    const nextSales = { ...data.sales };
    nextSales.loadPriceSpend = netCost;
    nextSales.totalIncomeKg = netKg;

    onChangeData({
      ...data,
      chickenLoad: nextChicken,
      sales: nextSales,
    });
  };

  // Handlers for Egg updates (Only ask total tare income & price of a tare)
  const handleUpdateEgg = (field: 'tareIncome' | 'pricePerTare', value: number) => {
    const validVal = isNaN(value) ? 0 : Math.max(0, value);
    const currentTares = field === 'tareIncome' ? validVal : eggTareIncome;
    const currentPrice = field === 'pricePerTare' ? validVal : eggPricePerTare;

    const nextEgg = {
      ...data.eggLoad,
      totalTareIncome: currentTares,
      pricePerTare: currentPrice,
      totalIncomeCount: currentTares * 30,
      ratePerUnit: currentTares > 0 ? (currentTares * currentPrice) / (currentTares * 30) : 0,
      wastagePercent: 0,
    };

    const nextMultiplied = currentTares * currentPrice;
    const nextSales = { ...data.sales };
    nextSales.loadPriceSpend = nextMultiplied;
    nextSales.totalIncomeKg = currentTares * 30; // total egg units

    onChangeData({
      ...data,
      eggLoad: nextEgg,
      sales: nextSales,
    });
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto px-4 py-3 select-none">
      {/* Top Switcher - Chicken / Egg */}
      <div className="grid grid-cols-2 rounded-2xl bg-emerald-100/70 p-1 mb-4 border border-emerald-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => handleSelectType('chicken')}
          className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center cursor-pointer ${
            isChicken
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-500/20'
              : 'text-emerald-950 hover:bg-emerald-200/60 font-bold'
          }`}
        >
          <span>{language === 'ta' ? 'சிக்கன் (கிலோ)' : 'Chicken (KG)'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectType('egg')}
          className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center cursor-pointer ${
            !isChicken
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-500/20'
              : 'text-emerald-950 hover:bg-emerald-200/60 font-bold'
          }`}
        >
          <span>{language === 'ta' ? 'முட்டை (தட்டு)' : 'Egg (Tare)'}</span>
        </button>
      </div>

      {/* ======================= EGG TARE FORM ======================= */}
      {!isChicken ? (
        <div id="egg-tare-load-form" className="space-y-4 animate-in fade-in">
          {/* Main Card: Only ask Total Tare Income & Price of a Tare */}
          <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-xs space-y-4">
            {/* Header: Title and Tare Info */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-100">
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
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
                <label className="text-xs font-black text-emerald-950 block">
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
                    className="w-full font-black text-2xl bg-amber-50/40 hover:bg-amber-50/70 focus:bg-white text-neutral-900 border-2 border-emerald-300 focus:border-emerald-700 rounded-2xl py-3 px-4 outline-hidden transition-all shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1 pointer-events-none">
                    <span className="text-xs font-black text-amber-800 uppercase">
                      {language === 'ta' ? 'தட்டு' : 'Tares'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price of a Tare */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-emerald-950 block">
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
                <div className="text-xs font-bold text-neutral-600 mt-1">
                  <span>{eggTotalCount.toLocaleString()} {language === 'ta' ? 'முட்டை' : 'Eggs'}</span>
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
          {/* Main Form Area for Chicken */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs space-y-4">
            {/* Title and Wastage */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                  {language === 'ta' ? 'சிக்கன் லோடு வரவு' : 'Chicken Load'}
                </h2>
              </div>

              {/* Percentage of wastage */}
              <div className="flex flex-col items-end">
                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={chickenWastage === 0 ? '' : chickenWastage}
                    onChange={(e) => handleUpdateChicken('wastage', parseFloat(e.target.value))}
                    placeholder="0"
                    aria-label={language === 'ta' ? 'வேஸ்டேஜ் %' : 'Wastage %'}
                    className="w-full text-center font-bold text-base bg-neutral-50 hover:bg-neutral-100 focus:bg-white text-neutral-900 border-2 border-neutral-300 focus:border-emerald-700 rounded-xl py-1.5 px-2 outline-hidden transition-all"
                  />
                  <span className="absolute right-2.5 top-2 text-xs font-bold text-neutral-400 pointer-events-none">%</span>
                </div>
              </div>
            </div>

            {/* Inputs: 1. Total Weight (KG) & 2. KG Price (₹/kg) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Total KG Income */}
              <div className="space-y-1.5">
                <label htmlFor="input-chicken-kg" className="text-xs font-black text-emerald-950 block">
                  {language === 'ta' ? 'மொத்த எடை (கிலோ)' : 'Total Weight (KG)'}
                </label>
                <div className="relative">
                  <input
                    id="input-chicken-kg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={chickenQuantity === 0 ? '' : chickenQuantity}
                    onChange={(e) => handleUpdateChicken('quantity', parseFloat(e.target.value))}
                    placeholder="800.00"
                    className="w-full font-black text-2xl bg-amber-50/40 hover:bg-amber-50/70 focus:bg-white text-neutral-900 border-2 border-emerald-300 focus:border-emerald-700 rounded-2xl py-3 pl-4 pr-12 outline-hidden transition-all shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center pointer-events-none">
                    <span className="text-xs font-black text-amber-800 uppercase">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              {/* KG Price in ₹/kg (Target Element) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-chicken-total-amount" className="text-xs font-black text-emerald-950 block">
                    {language === 'ta' ? 'கிலோ விலை (ரூபாய்)' : 'KG Price (₹ / kg)'}
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-base font-black text-neutral-500 pointer-events-none">
                    ₹
                  </div>
                  <input
                    id="input-chicken-total-amount"
                    type="number"
                    step="0.5"
                    min="0"
                    value={chickenRate === 0 ? '' : chickenRate}
                    onChange={(e) => handleUpdateChicken('rate', parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full font-black text-2xl bg-neutral-50 hover:bg-neutral-100 focus:bg-white text-neutral-900 border-2 border-emerald-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl py-3 pl-8 pr-16 outline-hidden transition-all shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg uppercase">
                      / kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Large Summary Cards at Bottom */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Total KG after reducing wastage */}
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-xs flex flex-col justify-between min-h-[140px]">
              <div className="mb-2">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
                  {language === 'ta' ? 'நிகர எடை' : 'Net Weight'}
                </span>
              </div>

              <div className="my-auto">
                <div className="text-3xl font-black text-neutral-900 tracking-tight">
                  {chickenNetKg}
                  <span className="text-xs font-bold text-amber-700 ml-1">kg</span>
                </div>
              </div>
            </div>

            {/* Total Price Spend based on net kg after reducing wastage */}
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-600 shadow-xs bg-emerald-50/20 flex flex-col justify-between min-h-[140px]">
              <div className="mb-2">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  {language === 'ta' ? 'மொத்த தொகை' : 'Total Amount'}
                </span>
              </div>

              <div className="my-auto">
                <div className="text-3xl font-black text-emerald-700 tracking-tight">
                  ₹{chickenNetCost.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

