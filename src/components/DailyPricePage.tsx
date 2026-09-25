import React, { useState } from 'react';
import { Check, Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import { DailyPriceRecord, getProductName, LanguageCode, ProductItem } from '../types';
import { getTodayDateString } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface DailyPricePageProps {
  products: ProductItem[];
  dailyPrices: DailyPriceRecord | null;
  language: LanguageCode;
  onSavePrices: (prices: Record<string, number>) => void;
  onAddProduct: (nameEn: string, nameTa: string, price: number) => void;
  onDeleteProduct: (productId: string) => void;
  onNavigateToBilling: () => void;
}

export const DailyPricePage: React.FC<DailyPricePageProps> = ({
  products,
  dailyPrices,
  language,
  onSavePrices,
  onAddProduct,
  onDeleteProduct,
  onNavigateToBilling,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const todayStr = getTodayDateString();
  const isSavedForToday = dailyPrices && dailyPrices.date === todayStr;

  // Local state for editing prices
  const [priceMap, setPriceMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    products.forEach((p) => {
      const saved = dailyPrices?.prices[p.id];
      initial[p.id] = saved !== undefined ? String(saved) : String(p.pricePerKg || '');
    });
    return initial;
  });

  // State for delete product confirmation
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  // Modal state for Add Product (asking both English and Tamil names)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductNameEn, setNewProductNameEn] = useState('');
  const [newProductNameTa, setNewProductNameTa] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [addError, setAddError] = useState('');

  // Status feedback toast
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePriceChange = (productId: string, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPriceMap((prev) => ({
        ...prev,
        [productId]: value,
      }));
    }
  };

  const handleSavePrices = () => {
    const numericPrices: Record<string, number> = {};
    products.forEach((p) => {
      const val = parseFloat(priceMap[p.id] || '0');
      numericPrices[p.id] = isNaN(val) ? 0 : val;
    });
    onSavePrices(numericPrices);
    setFeedback(t.pricesSavedSuccess);
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
    if (onNavigateToBilling) {
      onNavigateToBilling();
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enTrimmed = newProductNameEn.trim();
    const taTrimmed = newProductNameTa.trim();
    if (!enTrimmed && !taTrimmed) {
      setAddError(t.addErrorName);
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setAddError(t.addErrorPrice);
      return;
    }
    onAddProduct(enTrimmed, taTrimmed, priceNum);
    setNewProductNameEn('');
    setNewProductNameTa('');
    setNewProductPrice('');
    setAddError('');
    setShowAddModal(false);
  };

  return (
    <div id="page-daily-price" className="pb-6 pt-2 px-2.5 max-w-md mx-auto animate-in fade-in space-y-2">
      {/* Top Banner / Today Status Indicator */}
      <div>
        {isSavedForToday ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-start gap-2 shadow-2xs">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wide leading-tight">
                {t.pricesReadyNotice}
              </h3>
              <p className="text-[10px] text-emerald-700 mt-0.5 leading-tight font-bold">
                {language === 'ta'
                  ? `இன்றைய விலைகள் சேமிக்கப்பட்டுள்ளன (${dailyPrices?.date}). நீங்கள் எப்போது வேண்டுமானாலும் மாற்றலாம்.`
                  : `Prices saved for today (${dailyPrices?.date}). You can edit and save anytime or proceed to billing.`}
              </p>
              <button
                type="button"
                onClick={onNavigateToBilling}
                className="mt-1.5 min-h-[2.2rem] text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 px-3 py-1 rounded-lg shadow-2xs inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer touch-manipulation"
              >
                <span className="leading-normal">{t.goToBilling}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 shadow-2xs">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-wide leading-tight">
                {t.pricesRequiredNotice}
              </h3>
              <p className="text-[10px] text-amber-700 mt-0.5 leading-tight font-bold">
                {language === 'ta'
                  ? 'கீழே இன்றைய விலைகளை உள்ளிட்டு சேமிக்கவும். அவை பில்லிங் பக்கத்தில் தானாகப் பயன்படுத்தப்படும்.'
                  : "Set and save today's rates below. They will be used automatically on the Billing page."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification Feedback */}
      {feedback && (
        <div className="bg-emerald-600 text-white p-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs animate-in fade-in slide-from-top-2">
          <Check className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Page Title & Add Product Top Button */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <h2 className="text-xs sm:text-sm font-black text-emerald-950 leading-tight">{t.dailyPrice}</h2>
        </div>
        <button
          id="btn-open-add-product"
          type="button"
          onClick={() => setShowAddModal(true)}
          className="min-h-[2.4rem] bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 active:scale-95 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs shadow-emerald-700/20 transition-all cursor-pointer touch-manipulation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="leading-normal">{t.addProduct}</span>
        </button>
      </div>

      {/* Products List */}
      <div className="space-y-1.5">
        {products.map((product, index) => {
          const currentPrice = priceMap[product.id] ?? '';
          const displayName = product.nameTa || getProductName(product, 'ta');
          return (
            <div
              key={product.id}
              id={`product-card-${product.id}`}
              className="bg-white border border-slate-200/90 hover:border-emerald-400 rounded-xl px-2.5 py-1.5 shadow-2xs transition-all flex items-center justify-between gap-2 min-h-[3rem]"
            >
              {/* Product Info */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight leading-tight break-words">
                    {displayName}
                  </h4>
                </div>
              </div>

              {/* Price Input & Delete Button */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-xs sm:text-sm font-black text-emerald-700 pointer-events-none">₹</span>
                  <input
                    id={`price-input-${product.id}`}
                    type="text"
                    inputMode="decimal"
                    value={currentPrice}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                    placeholder="0"
                    className="w-20 sm:w-24 min-h-[2.4rem] pl-6 pr-2 py-1 bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-right text-xs sm:text-sm font-black text-slate-900 outline-none transition-all shadow-2xs placeholder:text-slate-300 leading-normal"
                  />
                </div>
                <button
                  id={`delete-product-${product.id}`}
                  type="button"
                  onClick={() => setProductToDelete(product)}
                  title={t.deleteProduct}
                  className="w-8 h-8 min-h-[2rem] min-w-[2rem] rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white active:bg-rose-700 text-rose-700 border border-rose-200/90 shadow-2xs flex items-center justify-center transition-all active:scale-95 cursor-pointer touch-manipulation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Price Bottom Action Bar - Appears at the end of the page */}
      <div className="pt-1">
        <button
          id="btn-save-daily-prices"
          type="button"
          onClick={handleSavePrices}
          className="w-full min-h-[2.6rem] py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl shadow-2xs shadow-emerald-700/25 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer touch-manipulation"
        >
          <Check className="w-4 h-4" />
          <span className="leading-normal">{t.savePrice}</span>
        </button>
      </div>

      {/* Add Product Modal (Asks English & Tamil names) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-emerald-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-3.5 w-full max-w-sm max-h-[92dvh] overflow-y-auto shadow-2xl border border-emerald-100">
            <h3 className="text-xs sm:text-sm font-black text-emerald-900 mb-1 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span className="leading-tight">{t.addProduct}</span>
            </h3>
            <p className="text-[10px] text-gray-500 mb-2 leading-tight break-words font-bold">
              {t.enterCustomProduct}
            </p>
            {addError && (
              <div className="mb-2 p-2 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] rounded-lg leading-tight break-words font-bold">
                {addError}
              </div>
            )}
            <form onSubmit={handleAddProductSubmit} className="space-y-2">
              {/* English Name Input */}
              <div>
                <label className="block text-[10px] font-black text-gray-700 mb-0.5 leading-tight">
                  {t.productNameEn} <span className="text-emerald-700">*</span>
                </label>
                <input
                  id="new-product-name-en-input"
                  type="text"
                  value={newProductNameEn}
                  onChange={(e) => setNewProductNameEn(e.target.value)}
                  placeholder="e.g. Lollipop Chicken, Gizzard"
                  className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-white border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none leading-normal"
                  autoFocus
                />
              </div>

              {/* Tamil Name Input */}
              <div>
                <label className="block text-[10px] font-black text-gray-700 mb-0.5 leading-tight">
                  {t.productNameTa} <span className="text-emerald-700">*</span>
                </label>
                <input
                  id="new-product-name-ta-input"
                  type="text"
                  value={newProductNameTa}
                  onChange={(e) => setNewProductNameTa(e.target.value)}
                  placeholder="உ.ம். லாலிபாப் சிக்கன்"
                  className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-white border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none leading-normal"
                />
              </div>

              {/* Price / KG */}
              <div>
                <label className="block text-[10px] font-black text-gray-700 mb-0.5 leading-tight">
                  {t.pricePerKg} (₹) <span className="text-emerald-700">*</span>
                </label>
                <input
                  id="new-product-price-input"
                  type="text"
                  inputMode="decimal"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="e.g. 280"
                  className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-white border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none leading-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError('');
                  }}
                  className="min-h-[2.4rem] py-1.5 px-2 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white rounded-lg font-black text-xs shadow-2xs transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
                >
                  <span className="leading-normal">{t.cancel}</span>
                </button>
                <button
                  id="btn-confirm-add-product"
                  type="submit"
                  className="min-h-[2.4rem] py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg font-black text-xs shadow-2xs shadow-emerald-700/25 transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
                >
                  <span className="leading-normal">{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        title={language === 'ta' ? 'பொருளை நீக்கவா?' : 'Delete product?'}
        message={
          language === 'ta'
            ? `"${productToDelete ? getProductName(productToDelete, language) : ''}" பொருளை நிச்சயமாக நீக்க விரும்புகிறீர்களா? இது தினசரி விலை மற்றும் பில்லிங்கிலிருந்து நீக்கப்படும்.`
            : `Are you sure you want to delete "${productToDelete ? getProductName(productToDelete, language) : ''}"? This will remove it from daily pricing and billing.`
        }
        itemDetails={
          productToDelete
            ? `${getProductName(productToDelete, language)} • ₹${priceMap[productToDelete.id] || productToDelete.pricePerKg || '0'}/KG`
            : undefined
        }
        confirmLabel={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete'}
        cancelLabel={language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
        language={language}
        onConfirm={() => {
          if (productToDelete) {
            onDeleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
