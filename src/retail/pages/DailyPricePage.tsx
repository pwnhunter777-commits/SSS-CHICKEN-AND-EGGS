import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { Product, Language, getProductName } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import {
  getTodayKey,
  loadDailyPrices,
  saveDailyPrices,
  saveProducts,
  formatDisplayDate,
} from '../utils/storage';

interface DailyPricePageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  language: Language;
  onPricesSaved?: () => void;
}

export const DailyPricePage: React.FC<DailyPricePageProps> = ({
  products,
  setProducts,
  language,
  onPricesSaved,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const todayKey = getTodayKey();
  const [priceMap, setPriceMap] = useState<{ [productId: string]: number | string }>({});
  const [isSavedToday, setIsSavedToday] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductNameEn, setNewProductNameEn] = useState('');
  const [newProductNameTa, setNewProductNameTa] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize prices on mount or when products change
  useEffect(() => {
    const allPrices = loadDailyPrices();
    const todaySaved = allPrices[todayKey];
    const initialPrices: { [productId: string]: number | string } = {};

    if (todaySaved && Object.keys(todaySaved).length > 0) {
      setIsSavedToday(true);
      products.forEach((p) => {
        initialPrices[p.id] = todaySaved[p.id] !== undefined ? todaySaved[p.id] : p.defaultPrice || 200;
      });
    } else {
      setIsSavedToday(false);
      const dates = Object.keys(allPrices).sort().reverse();
      const latestPrices = dates.length > 0 ? allPrices[dates[0]] : null;
      products.forEach((p) => {
        if (latestPrices && latestPrices[p.id] !== undefined) {
          initialPrices[p.id] = latestPrices[p.id];
        } else {
          initialPrices[p.id] = p.defaultPrice || 200;
        }
      });
    }
    setPriceMap(initialPrices);
  }, [products, todayKey]);

  const handlePriceChange = (productId: string, value: string) => {
    setPriceMap((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleSavePrices = () => {
    const numericPrices: { [productId: string]: number } = {};
    products.forEach((p) => {
      const val = priceMap[p.id];
      const num = typeof val === 'number' ? val : parseFloat(val as string);
      numericPrices[p.id] = isNaN(num) || num < 0 ? (p.defaultPrice || 200) : num;
    });

    const allPrices = loadDailyPrices();
    allPrices[todayKey] = numericPrices;
    saveDailyPrices(allPrices);
    setIsSavedToday(true);
    setToastMessage(t.savedSuccessfully);
    setTimeout(() => setToastMessage(null), 3000);

    if (onPricesSaved) {
      onPricesSaved();
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const nameEn = newProductNameEn.trim();
    const nameTa = newProductNameTa.trim();
    if (!nameEn && !nameTa) return;

    const primaryName = nameEn || nameTa;
    const priceNum = parseFloat(newProductPrice) || 200;

    const newProd: Product = {
      id: 'prod_' + Date.now(),
      name: primaryName,
      nameEn: nameEn || nameTa,
      nameTa: nameTa || nameEn,
      defaultPrice: priceNum,
    };

    const updated = [...products, newProd];
    setProducts(updated);
    saveProducts(updated);

    // Add to current price map
    setPriceMap((prev) => ({
      ...prev,
      [newProd.id]: priceNum,
    }));

    setNewProductNameEn('');
    setNewProductNameTa('');
    setNewProductPrice('');
    setShowAddModal(false);

    const displayName = getProductName(newProd, language);
    setToastMessage(language === 'ta' ? `"${displayName}" சேர்க்கப்பட்டது` : `Product "${displayName}" added`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDeleteProduct = (productId: string) => {
    const prodToDelete = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);

    setPriceMap((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });

    setDeleteConfirmId(null);
    const displayName = prodToDelete ? getProductName(prodToDelete, language) : '';
    setToastMessage(language === 'ta' ? `"${displayName}" நீக்கப்பட்டது` : `Product deleted`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto min-h-screen">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-800 text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Date & Status Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-200 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            {formatDisplayDate(undefined, language)}
          </div>
          <h2 className="text-lg font-black text-emerald-950 mt-0.5">
            {t.dailyPrice}
          </h2>
        </div>
        {isSavedToday ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t.todayPriceSaved}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{t.setTodayRates}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Top: Add Product & Save Price */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-white hover:bg-emerald-50 text-emerald-900 border-2 border-emerald-600 font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-700" />
          <span>{t.addProduct}</span>
        </button>
        <button
          type="button"
          onClick={handleSavePrices}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{t.savePrice}</span>
        </button>
      </div>

      {/* Products List */}
      <div className="space-y-2.5">
        {products.map((product, idx) => {
          const currentPrice = priceMap[product.id] ?? '';
          const isChicken = idx === 0 || product.id === 'p0' || (product.nameEn || product.name || '').trim().toLowerCase() === 'chicken';
          const isEgg = product.id === 'p_egg' || (product.nameEn || product.name || '').trim().toLowerCase() === 'egg';
          const primaryDisplay = getProductName(product, language);
          const secondaryDisplay = language === 'ta' ? (product.nameEn || product.name) : product.nameTa;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl p-3.5 shadow-xs border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-h-[4rem] ${
                isChicken
                  ? 'border-emerald-500 ring-2 ring-emerald-600/10 shadow-xs'
                  : isEgg
                  ? 'border-amber-400 ring-2 ring-amber-500/10 shadow-xs'
                  : 'border-emerald-100 hover:border-emerald-300'
              }`}
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-gray-900 text-sm truncate">
                    {primaryDisplay}
                  </span>
                  {secondaryDisplay && secondaryDisplay !== primaryDisplay && (
                    <span className="text-xs text-gray-400 font-medium truncate">
                      ({secondaryDisplay})
                    </span>
                  )}
                  {isChicken && (
                    <span className="text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                      {t.mainCut}
                    </span>
                  )}
                  {isEgg && (
                    <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shrink-0">
                      {language === 'ta' ? 'முட்டை' : 'EGG'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-emerald-800 font-semibold mt-0.5">
                  {isEgg
                    ? (language === 'ta' ? '1 முட்டை விலை (₹ / முட்டை)' : 'Price of 1 Egg (₹ / Egg)')
                    : isChicken
                    ? `${t.rateWithSkin} (₹ / ${language === 'ta' ? 'கிலோ' : 'Kg'})`
                    : `₹ / ${language === 'ta' ? 'கிலோ' : 'Kg'}`}
                </div>
              </div>

              {/* Price Input & Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <div className="relative flex items-center flex-1 sm:flex-initial">
                  <span className="absolute left-3 text-gray-500 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={currentPrice}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                    placeholder={isEgg ? '6' : '220'}
                    className={`w-full sm:w-28 border-2 text-right font-black text-emerald-950 text-base py-1.5 pl-7 pr-3 rounded-xl outline-none transition-all min-h-[2.5rem] ${
                      isEgg
                        ? 'bg-amber-50/50 border-amber-300 focus:border-amber-600 focus:bg-white'
                        : 'bg-emerald-50/50 border-emerald-300 focus:border-emerald-600 focus:bg-white'
                    }`}
                  />
                </div>
                {/* Delete Product Button (Hidden for standard Chicken and Egg) */}
                {!isChicken && !isEgg ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(product.id)}
                    title={t.deleteProduct}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-9 h-9" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prominent Save Price Button at Bottom */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleSavePrices}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>{t.savePrice}</span>
        </button>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-emerald-100 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-emerald-950 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>{t.addProduct}</span>
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t.productNameEn} <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProductNameEn}
                  onChange={(e) => setNewProductNameEn(e.target.value)}
                  placeholder="e.g. Lollipop piece / Curry Cut"
                  className="w-full bg-white border-2 border-emerald-200 focus:border-emerald-600 text-gray-900 text-sm py-2 px-3 rounded-xl outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t.productNameTa} <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProductNameTa}
                  onChange={(e) => setNewProductNameTa(e.target.value)}
                  placeholder="எ.கா. லாலிபாப்"
                  className="w-full bg-white border-2 border-emerald-200 focus:border-emerald-600 text-gray-900 text-sm py-2 px-3 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t.pricePerKg} <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="240"
                    className="w-full bg-white border-2 border-emerald-200 focus:border-emerald-600 text-gray-900 text-sm py-2 pl-7 pr-3 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {t.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-emerald-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              {t.deleteProduct}?
            </h4>
            <p className="text-xs text-gray-600 mb-4 font-semibold">
              {(() => {
                const prod = products.find((p) => p.id === deleteConfirmId);
                return prod ? getProductName(prod, language) : '';
              })()}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
