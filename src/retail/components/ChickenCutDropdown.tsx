import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ShoppingBag,
  Search,
  Check,
  Trash2,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { Product, Language, getProductName } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { ChickenCutItemData } from './ChickenCutCard';

interface ChickenCutDropdownProps {
  products: Product[];
  dailyPrices: { [productId: string]: number };
  cutItems: { [productId: string]: ChickenCutItemData };
  selectedProductId: string;
  language?: Language;
  onSelectCut: (productId: string) => void;
  onAddProduct: (nameEn: string, nameTa: string, price: number) => void;
  onRemoveProduct: (productId: string) => void;
}

export const ChickenCutDropdown: React.FC<ChickenCutDropdownProps> = ({
  products,
  dailyPrices,
  cutItems,
  selectedProductId,
  language = 'en',
  onSelectCut,
  onAddProduct,
  onRemoveProduct,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCutNameEn, setNewCutNameEn] = useState('');
  const [newCutNameTa, setNewCutNameTa] = useState('');
  const [newCutPrice, setNewCutPrice] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newNameEnInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];
  const selectedBaseRate = selectedProduct
    ? dailyPrices[selectedProduct.id] || selectedProduct.defaultPrice || 220
    : 220;
  const selectedItemData = selectedProduct ? cutItems[selectedProduct.id] : null;

  // Filter products based on search query (searching english or tamil name)
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const nameEnMatch = (p.nameEn || p.name || '').toLowerCase().includes(q);
    const nameTaMatch = (p.nameTa || '').toLowerCase().includes(q);
    return nameEnMatch || nameTaMatch;
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsAddingNew(false);
        setDeleteConfirmId(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current && !isAddingNew) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else if (!isOpen) {
      setSearchQuery('');
      setIsAddingNew(false);
      setDeleteConfirmId(null);
    }
  }, [isOpen, isAddingNew]);

  // Focus new cut name input when add form opens
  useEffect(() => {
    if (isAddingNew && newNameEnInputRef.current) {
      setTimeout(() => {
        newNameEnInputRef.current?.focus();
      }, 50);
    }
  }, [isAddingNew]);

  const handleSelect = (productId: string) => {
    onSelectCut(productId);
    setIsOpen(false);
  };

  const handleSaveNewCut = (e: React.FormEvent) => {
    e.preventDefault();
    const nameEn = newCutNameEn.trim();
    const nameTa = newCutNameTa.trim();
    if (!nameEn && !nameTa) return;
    const priceNum = parseFloat(newCutPrice) || 220;
    onAddProduct(nameEn || nameTa, nameTa || nameEn, priceNum);
    setNewCutNameEn('');
    setNewCutNameTa('');
    setNewCutPrice('');
    setIsAddingNew(false);
  };

  const handleTriggerRemove = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(productId);
  };

  const handleConfirmDelete = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    onRemoveProduct(productId);
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const selectedName = selectedProduct ? getProductName(selectedProduct, language) : t.selectCut;

  return (
    <div className="relative mb-2.5" ref={dropdownRef}>
      {/* Compact Header & Trigger Row */}
      <div className="flex items-center gap-2">
        {/* Compact Dropdown Button */}
        <button
          type="button"
          id="chicken-cut-dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 bg-white rounded-2xl border transition-all py-2 px-3 text-left flex items-center justify-between gap-2 shadow-2xs active:scale-[0.99] cursor-pointer ${
            isOpen
              ? 'border-emerald-600 ring-2 ring-emerald-600/15 shadow-xs'
              : 'border-slate-200 hover:border-emerald-500/80 hover:bg-emerald-50/10'
          }`}
        >
          {/* Left: Cut Name + Rate */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {selectedName}
              </span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md shrink-0">
                ₹{selectedBaseRate}/{selectedProduct?.id === 'p_egg' || (selectedProduct?.nameEn || selectedProduct?.name || '').trim().toLowerCase() === 'egg' ? (language === 'ta' ? 'முட்டை' : 'Egg') : (language === 'ta' ? 'கிலோ' : 'Kg')}
              </span>
              {selectedItemData && selectedItemData.numericAmount > 0 && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md shrink-0 hidden sm:inline-block">
                  {t.added}
                </span>
              )}
            </div>
          </div>
          {/* Right: Small Chevron */}
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 ${
              isOpen
                ? 'text-emerald-700 rotate-180'
                : 'text-slate-400'
            }`}
          >
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* Small "+ Cut" Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsAddingNew(true);
          }}
          title={t.addChickenCut}
          className="min-h-[2.25rem] py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-2xl flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5] text-emerald-700" />
          <span className="text-xs font-extrabold">{t.add}</span>
        </button>
      </div>

      {/* Compact Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-40 bg-white rounded-2xl border-2 border-emerald-600/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Bar */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              {products.length} {t.cutsAvailable}
            </span>
            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                isAddingNew
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-emerald-700 text-white shadow-2xs hover:bg-emerald-800'
              }`}
            >
              {isAddingNew ? (
                <>
                  <X className="w-3 h-3" />
                  <span>{t.cancel}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>{t.newCut}</span>
                </>
              )}
            </button>
          </div>

          {/* Inline Add New Cut Form */}
          {isAddingNew && (
            <form
              onSubmit={handleSaveNewCut}
              className="p-3 bg-emerald-50/80 border-b border-emerald-200 animate-in fade-in slide-in-from-top-2 space-y-2"
            >
              <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t.addChickenCut}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {t.productNameEn} *
                  </label>
                  <input
                    ref={newNameEnInputRef}
                    type="text"
                    required
                    placeholder="e.g. Lollipop piece"
                    value={newCutNameEn}
                    onChange={(e) => setNewCutNameEn(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {t.productNameTa} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="எ.கா. லாலிபாப்"
                    value={newCutNameTa}
                    onChange={(e) => setNewCutNameTa(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  {t.pricePerKg} *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="240"
                    value={newCutPrice}
                    onChange={(e) => setNewCutPrice(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg pl-6 pr-2 py-1 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          )}

          {/* Search Bar */}
          {!isAddingNew && (
            <div className="p-2 bg-white border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchCut}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* List of Cuts */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  {t.noCutMatches} "{searchQuery}"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewCutNameEn(searchQuery);
                    setIsAddingNew(true);
                  }}
                  className="mt-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t.add} "{searchQuery}"</span>
                </button>
              </div>
            ) : (
              filteredProducts.map((product, idx) => {
                const isSelected = product.id === selectedProductId;
                const rate =
                  dailyPrices[product.id] || product.defaultPrice || 220;
                const cutData = cutItems[product.id];
                const hasAmountInBill = cutData && cutData.numericAmount > 0;
                const isDeleting = deleteConfirmId === product.id;
                const isMainCut = idx === 0 || (product.nameEn || product.name || '').trim().toLowerCase() === 'chicken';
                const displayName = getProductName(product, language);
                const secondaryName = language === 'ta' ? (product.nameEn || product.name) : product.nameTa;

                return (
                  <div
                    key={product.id}
                    className={`w-full rounded-xl transition-all flex items-center justify-between p-2 gap-2 ${
                      isSelected
                        ? 'bg-emerald-800 text-white font-extrabold shadow-xs'
                        : 'bg-white hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200/50'
                    }`}
                  >
                    {/* Left: Clickable Section to Select Cut */}
                    <button
                      type="button"
                      onClick={() => handleSelect(product.id)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-emerald-100/60 text-emerald-800'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {displayName}
                        </span>
                        {secondaryName && secondaryName !== displayName && (
                          <span
                            className={`text-xs font-normal truncate ${
                              isSelected ? 'text-emerald-200' : 'text-slate-400'
                            }`}
                          >
                            ({secondaryName})
                          </span>
                        )}
                        {isMainCut && (
                          <span
                            className={`text-xs font-extrabold uppercase px-1.5 py-0.5 rounded-md shrink-0 ${
                              isSelected
                                ? 'bg-emerald-700 text-emerald-100 border border-emerald-500/60'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {t.mainCut}
                          </span>
                        )}
                        {product.id === 'p_egg' || (product.nameEn || product.name || '').trim().toLowerCase() === 'egg' ? (
                          <span
                            className={`text-xs font-extrabold uppercase px-1.5 py-0.5 rounded-md shrink-0 ${
                              isSelected
                                ? 'bg-amber-600 text-amber-50 border border-amber-400'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {language === 'ta' ? 'முட்டை' : 'EGG'}
                          </span>
                        ) : null}
                        <span
                          className={`text-xs font-semibold shrink-0 ${
                            isSelected ? 'text-emerald-200' : 'text-emerald-700'
                          }`}
                        >
                          ₹{rate}/{product.id === 'p_egg' || (product.nameEn || product.name || '').trim().toLowerCase() === 'egg' ? (language === 'ta' ? 'முட்டை' : 'Egg') : (language === 'ta' ? 'கிலோ' : 'Kg')}
                        </span>
                        {hasAmountInBill && (
                          <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              isSelected
                                ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {t.inBill}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Right: Actions (Delete / Checkmark) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isDeleting ? (
                        <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-md border border-red-200 animate-in fade-in">
                          <span className="text-[9px] font-bold text-red-700 px-1">
                            {t.deleteConfirmCut}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleConfirmDelete(e, product.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs cursor-pointer"
                          >
                            {t.yes}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelDelete}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold px-1 py-0.5 rounded cursor-pointer"
                          >
                            {t.no}
                          </button>
                        </div>
                      ) : (
                        <>
                          {!isMainCut && product.id !== 'p_egg' && (product.nameEn || product.name || '').trim().toLowerCase() !== 'egg' ? (
                            <button
                              type="button"
                              onClick={(e) => handleTriggerRemove(e, product.id)}
                              title={t.deleteProduct}
                              className={`p-1 rounded transition-colors active:scale-90 cursor-pointer ${
                                isSelected
                                  ? 'hover:bg-emerald-900 text-emerald-200 hover:text-red-300'
                                  : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300 shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
