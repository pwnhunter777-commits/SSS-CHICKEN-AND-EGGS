import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Scale,
  Plus,
  Minus,
  Trash2,
  Egg,
} from 'lucide-react';
import { Product, ChickenVariant, Language, getProductName } from '../types';
import { TRANSLATIONS } from '../utils/translations';

export interface ChickenCutItemData {
  productId: string;
  variant: ChickenVariant;
  baseRate: number;
  adjustedRate: number;
  kg: string; // Used for Kg when chicken, or Quantity when egg
  price: string;
  numericKg: number; // Used for numeric Kg when chicken, or numeric Quantity when egg
  numericAmount: number;
  isExpanded: boolean;
}

interface ChickenCutCardProps {
  product: Product;
  baseRate: number;
  eggRate?: number;
  withoutSkinOffset?: number;
  data: ChickenCutItemData;
  language?: Language;
  onUpdate: (data: Partial<ChickenCutItemData>) => void;
  onRemove: () => void;
  onSaveWithoutSkinOffset?: (newOffset: number) => void;
}

export const ChickenCutCard: React.FC<ChickenCutCardProps> = ({
  product,
  baseRate,
  eggRate = 6,
  data,
  language = 'en',
  onUpdate,
  onRemove,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Rate With Skin (e.g. ₹220/Kg)
  const rateWithSkin = baseRate > 0 ? baseRate : 220;
  // Actual Egg Rate (e.g. ₹6/Egg)
  const actualEggRate = eggRate > 0 ? eggRate : 6;

  // Variant is either 'with_skin' or 'egg'
  // If variant was legacy 'without_skin', treat as 'egg'
  const isEgg =
    data.variant === 'egg' ||
    data.variant === 'without_skin' ||
    product.id === 'p_egg' ||
    (product.nameEn || product.name || '').trim().toLowerCase() === 'egg';

  const activeVariant: 'with_skin' | 'egg' = isEgg ? 'egg' : 'with_skin';
  const currentAdjustedRate = isEgg ? actualEggRate : rateWithSkin;

  // Handle Variant Selection
  const handleSelectVariant = (variant: 'with_skin' | 'egg') => {
    const nextRate = variant === 'egg' ? actualEggRate : rateWithSkin;
    let newPrice = data.price;
    let newKg = data.kg;
    let numericAmt = data.numericAmount;
    let numericKg = data.numericKg;

    if (variant === 'egg') {
      // If switching to egg, calculate egg quantity from price or current kg (without decimal points)
      if (numericAmt > 0 && nextRate > 0) {
        const calculatedQty = Math.round(numericAmt / nextRate);
        numericKg = calculatedQty;
        newKg = String(calculatedQty);
      } else if (numericKg > 0) {
        const qty = Math.round(numericKg);
        numericKg = qty;
        newKg = String(qty);
        numericAmt = Math.round(qty * nextRate);
        newPrice = String(numericAmt);
      }
    } else {
      // If switching to chicken with skin
      if (numericKg > 0) {
        numericAmt = Math.round(numericKg * nextRate);
        newPrice = String(numericAmt);
      }
    }

    onUpdate({
      variant,
      adjustedRate: nextRate,
      price: newPrice,
      kg: newKg,
      numericAmount: numericAmt,
      numericKg: numericKg,
    });
  };

  // Handle Egg Quantity or Chicken KG Input Change
  const handleKgOrQtyChange = (rawVal: string) => {
    const parsed = parseFloat(rawVal);
    const num = isEgg ? (isNaN(parsed) ? 0 : Math.round(parsed)) : parsed;
    if (!isNaN(num) && num > 0) {
      const amt = Math.round(num * currentAdjustedRate);
      onUpdate({
        kg: isEgg ? String(num) : rawVal,
        price: String(amt),
        numericKg: num,
        numericAmount: amt,
      });
    } else {
      onUpdate({
        kg: rawVal,
        price: '',
        numericKg: 0,
        numericAmount: 0,
      });
    }
  };

  // Handle Price Input Change
  // If price entered on egg side: calculates whole egg quantity without decimal points
  const handlePriceChange = (rawPrice: string) => {
    const priceNum = parseFloat(rawPrice);
    if (!isNaN(priceNum) && priceNum > 0 && currentAdjustedRate > 0) {
      if (isEgg) {
        const qty = Math.round(priceNum / currentAdjustedRate);
        onUpdate({
          price: rawPrice,
          kg: String(qty),
          numericKg: qty,
          numericAmount: priceNum,
        });
      } else {
        const kgCalculated = Number((priceNum / currentAdjustedRate).toFixed(3));
        onUpdate({
          price: rawPrice,
          kg: String(kgCalculated),
          numericKg: kgCalculated,
          numericAmount: priceNum,
        });
      }
    } else {
      onUpdate({
        price: rawPrice,
        kg: '',
        numericKg: 0,
        numericAmount: 0,
      });
    }
  };

  // Quick Quantity Presets for Egg
  const handleQuickEggQty = (qty: number) => {
    const amt = Math.round(qty * actualEggRate);
    onUpdate({
      kg: String(qty),
      price: String(amt),
      numericKg: qty,
      numericAmount: amt,
    });
  };

  // Quick KG Presets for Chicken
  const handleQuickKg = (kgVal: number) => {
    const amt = Math.round(kgVal * currentAdjustedRate);
    onUpdate({
      kg: String(kgVal),
      price: String(amt),
      numericKg: kgVal,
      numericAmount: amt,
    });
  };

  // Quick Amount Presets
  const handleQuickAmount = (amount: number) => {
    if (isEgg) {
      const qty = Math.round(amount / actualEggRate);
      onUpdate({
        price: String(amount),
        kg: String(qty),
        numericKg: qty,
        numericAmount: amount,
      });
    } else {
      const kgCalculated = Number((amount / currentAdjustedRate).toFixed(3));
      onUpdate({
        price: String(amount),
        kg: String(kgCalculated),
        numericKg: kgCalculated,
        numericAmount: amount,
      });
    }
  };

  // Stepper for Egg Quantity (+1 / -1) or Chicken KG (+0.25 / -0.25)
  const handleStepQtyOrKg = (delta: number) => {
    const current = data.numericKg || 0;
    const next = Math.max(0, isEgg ? Math.round(current + delta) : Number((current + delta).toFixed(3)));
    if (next === 0) {
      handleKgOrQtyChange('');
    } else {
      handleKgOrQtyChange(String(next));
    }
  };

  // Stepper for Price (for Egg: + / - actualEggRate, for Chicken: + / - ₹10)
  const handleStepPrice = (delta: number) => {
    const current = data.numericAmount || 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
      handlePriceChange('');
    } else {
      handlePriceChange(String(next));
    }
  };

  const isExpanded = data.isExpanded ?? true;
  const displayName = isEgg
    ? language === 'ta'
      ? 'முட்டை'
      : 'Egg'
    : getProductName(product, language);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden mb-2.5 transition-all">
      {/* Top Header Row */}
      <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm sm:text-base font-black text-gray-900 leading-snug truncate">
            {displayName}
          </h3>
        </div>

        {/* Right Header: Item Total & Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
            ₹{data.numericAmount > 0 ? data.numericAmount.toFixed(2) : '0.00'}
          </span>
          <button
            type="button"
            onClick={() => onUpdate({ isExpanded: !isExpanded })}
            className="p-1 bg-slate-100 hover:bg-slate-200 text-gray-600 rounded-md transition-colors active:scale-95 cursor-pointer"
            aria-label="Toggle details"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-0.5 border-t border-slate-100">
          {/* Variant Selector: With Skin vs Egg */}
          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10.5px] font-bold text-gray-700">
                {language === 'ta' ? 'வகை' : 'Item Type'}
              </label>
            </div>

            {/* 2-Column Variant Selector: With Skin vs Egg */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* 1. With Skin */}
              <button
                type="button"
                onClick={() => handleSelectVariant('with_skin')}
                className={`py-1.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeVariant === 'with_skin'
                    ? 'border-2 border-emerald-700 bg-emerald-50/30 ring-1 ring-emerald-600/15 shadow-2xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span
                  className={`text-[11px] font-bold ${
                    activeVariant === 'with_skin'
                      ? 'text-emerald-950 font-extrabold'
                      : 'text-slate-700'
                  }`}
                >
                  {t.withSkin}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded mt-0.5 max-w-full truncate text-center leading-tight">
                  ₹{rateWithSkin.toFixed(2)} / {language === 'ta' ? 'கிலோ' : 'Kg'}
                </span>
              </button>

              {/* 2. Egg (Replaced Without Skin) */}
              <button
                type="button"
                onClick={() => handleSelectVariant('egg')}
                className={`py-1.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeVariant === 'egg'
                    ? 'border-2 border-amber-600 bg-amber-50/40 ring-1 ring-amber-500/20 shadow-2xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <Egg className="w-3 h-3 text-amber-700" />
                  <span
                    className={`text-[11px] font-bold ${
                      activeVariant === 'egg'
                        ? 'text-amber-950 font-extrabold'
                        : 'text-slate-700'
                    }`}
                  >
                    {language === 'ta' ? 'முட்டை' : 'Egg'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5 max-w-full truncate text-center leading-tight">
                  ₹{actualEggRate.toFixed(2)} / {language === 'ta' ? 'முட்டை' : 'Egg'}
                </span>
              </button>
            </div>
          </div>

          {/* Input Cards: Small & Compact */}
          <div className="mt-2">
            <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
              {isEgg
                ? (language === 'ta' ? 'தொகை (₹) அல்லது முட்டை எண்ணிக்கை' : 'Enter Price (₹) OR Egg Quantity')
                : t.enterWeightOrPrice}
            </label>

            {/* Layout:
                If Egg: Price in LEFT, Egg Quantity in RIGHT.
                If Chicken: Weight (Kg) in LEFT, Price in RIGHT.
            */}
            {isEgg ? (
              /* EGG LAYOUT: LEFT = PRICE (₹), RIGHT = QUANTITY */
              <div className="grid grid-cols-2 gap-1.5">
                {/* 1. LEFT: Price (₹) */}
                <div className="bg-white border-2 border-slate-200 focus-within:border-amber-600 rounded-lg p-1.5 px-2 min-h-[3.25rem] flex items-center justify-between transition-colors shadow-2xs">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="text-amber-700 font-extrabold text-sm shrink-0">
                      ₹
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">
                        {t.priceRs}
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={data.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        placeholder="0"
                        className="w-full text-sm sm:text-base font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-300 leading-tight py-0"
                      />
                    </div>
                  </div>
                  {/* Price Steppers (+ / - actualEggRate) */}
                  <div className="flex flex-col gap-0.5 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={() => handleStepPrice(actualEggRate)}
                      className="p-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 rounded transition-colors active:scale-90 cursor-pointer"
                      title={`+₹${actualEggRate}`}
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepPrice(-actualEggRate)}
                      className="p-1 bg-slate-100 hover:bg-red-100 hover:text-red-900 text-slate-600 rounded transition-colors active:scale-90 cursor-pointer"
                      title={`-₹${actualEggRate}`}
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* 2. RIGHT: Egg Quantity */}
                <div className="bg-white border-2 border-slate-200 focus-within:border-amber-600 rounded-lg p-1.5 px-2 min-h-[3.25rem] flex items-center justify-between transition-colors shadow-2xs">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="text-amber-600 shrink-0">
                      <Egg className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5 truncate">
                        {language === 'ta' ? 'முட்டை எண்ணிக்கை' : 'Quantity'}
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={data.kg}
                        onChange={(e) => handleKgOrQtyChange(e.target.value)}
                        placeholder="0"
                        className="w-full text-sm sm:text-base font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-300 leading-tight py-0"
                      />
                    </div>
                  </div>
                  {/* Quantity Steppers (+1 / -1) */}
                  <div className="flex flex-col gap-0.5 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={() => handleStepQtyOrKg(1)}
                      className="p-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 rounded transition-colors active:scale-90 cursor-pointer"
                      title="+1 Egg"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepQtyOrKg(-1)}
                      className="p-1 bg-slate-100 hover:bg-red-100 hover:text-red-900 text-slate-600 rounded transition-colors active:scale-90 cursor-pointer"
                      title="-1 Egg"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* CHICKEN LAYOUT: LEFT = WEIGHT (KG), RIGHT = PRICE */
              <div className="grid grid-cols-2 gap-1.5">
                {/* Weight Card */}
                <div className="bg-white border-2 border-slate-200 focus-within:border-emerald-600 rounded-lg p-1.5 px-2 min-h-[3.25rem] flex items-center justify-between transition-colors shadow-2xs">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="text-emerald-700 shrink-0">
                      <Scale className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">
                        {t.weightKg}
                      </span>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={data.kg}
                        onChange={(e) => handleKgOrQtyChange(e.target.value)}
                        placeholder="0.000"
                        className="w-full text-sm sm:text-base font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-300 leading-tight py-0"
                      />
                    </div>
                  </div>
                  {/* Weight Steppers */}
                  <div className="flex flex-col gap-0.5 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={() => handleStepQtyOrKg(0.25)}
                      className="p-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-600 rounded transition-colors active:scale-90 cursor-pointer"
                      title="+0.25 Kg"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepQtyOrKg(-0.25)}
                      className="p-1 bg-slate-100 hover:bg-red-100 hover:text-red-900 text-slate-600 rounded transition-colors active:scale-90 cursor-pointer"
                      title="-0.25 Kg"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Amount Card */}
                <div className="bg-white border-2 border-slate-200 focus-within:border-emerald-600 rounded-lg p-1.5 px-2 min-h-[3.25rem] flex items-center justify-between transition-colors shadow-2xs">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="text-emerald-700 font-extrabold text-sm shrink-0">
                      ₹
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">
                        {t.priceRs}
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={data.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        placeholder="0"
                        className="w-full text-sm sm:text-base font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-300 leading-tight py-0"
                      />
                    </div>
                  </div>
                  {/* Price Steppers */}
                  <div className="flex flex-col gap-0.5 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={() => handleStepPrice(10)}
                      className="p-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-600 rounded transition-colors active:scale-90 cursor-pointer"
                      title="+₹10"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepPrice(-10)}
                      className="p-1 bg-slate-100 hover:bg-red-100 hover:text-red-900 text-slate-600 rounded transition-colors active:scale-90 cursor-pointer"
                      title="-₹10"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Chips */}
          {isEgg ? (
            /* EGG PRESETS: Quantity chips & Price chips */
            <>
              {/* Quick Egg Quantity Chips */}
              <div className="mt-1.5 pt-1 border-t border-slate-100/80">
                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 block mb-1">
                  {language === 'ta' ? 'விரைவு முட்டை எண்ணிக்கை' : 'Quick Egg Quantity'}
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                  {[1, 2, 5, 10, 15, 20, 30, 60].map((val) => {
                    let label = `${val} ${language === 'ta' ? (val === 1 ? 'முட்டை' : 'முட்டைகள்') : (val === 1 ? 'Egg' : 'Eggs')}`;
                    if (val === 30) {
                      label = language === 'ta' ? '1 தட்டு (30)' : '1 Tare (30)';
                    } else if (val === 60) {
                      label = language === 'ta' ? '2 தட்டு (60)' : '2 Tare (60)';
                    }
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickEggQty(val)}
                        className={`py-1 px-0.5 rounded-lg text-[10.5px] sm:text-[11px] font-bold transition-all border text-center whitespace-nowrap cursor-pointer ${
                          parseFloat(data.kg) === val
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-amber-50/60 hover:bg-amber-100 text-amber-950 border-amber-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Price Chips for Egg */}
              <div className="mt-1.5">
                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 block mb-1">
                  {language === 'ta' ? 'விரைவு தொகை தேர்வுகள்' : 'Quick Price Presets'}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {[
                    actualEggRate * 1,
                    actualEggRate * 2,
                    actualEggRate * 5,
                    actualEggRate * 10,
                    actualEggRate * 20,
                    actualEggRate * 30,
                  ].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className={`py-1 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold transition-all border text-center whitespace-nowrap cursor-pointer ${
                        parseFloat(data.price) === val
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* CHICKEN PRESETS: KG chips & Amount chips */
            <>
              {/* Quick KG Selector Chips */}
              <div className="mt-1.5 pt-1 border-t border-slate-100/80">
                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 block mb-1">
                  {t.quickWeightPresets}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {[0.25, 0.5, 1, 1.5, 2, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickKg(val)}
                      className={`py-1 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold transition-all border text-center whitespace-nowrap cursor-pointer ${
                        parseFloat(data.kg) === val
                          ? 'bg-[#0f3d2e] text-white border-[#0f3d2e] shadow-2xs'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {val >= 1
                        ? `${val} ${language === 'ta' ? 'கிலோ' : 'Kg'}`
                        : `${val * 1000}${language === 'ta' ? 'கி' : 'g'}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Amount Selector Chips */}
              <div className="mt-1.5">
                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 block mb-1">
                  {t.quickPricePresets}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {[50, 100, 150, 200, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className={`py-1 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold transition-all border text-center whitespace-nowrap cursor-pointer ${
                        parseFloat(data.price) === val
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Card Footer: Remove Cut & Item Total */}
          <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{t.clearRemove}</span>
            </button>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">
                {t.itemTotal}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">
                ₹{data.numericAmount > 0 ? data.numericAmount.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
