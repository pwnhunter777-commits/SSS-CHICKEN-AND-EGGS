import React, { useState, useMemo } from 'react';
import {
  Check,
  Plus,
  RefreshCw,
  X,
  ChevronDown,
  Trash2,
  Send,
  FileText,
  Printer,
} from 'lucide-react';
import {
  Bill,
  BillItem,
  DailyPriceRecord,
  getHotelName,
  getProductName,
  HotelItem,
  HotelPayment,
  LanguageCode,
  ProductItem,
  ShopSettings,
} from '../types';
import { getNextBillNumber, getTodayDateString } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface BillingPageProps {
  products: ProductItem[];
  dailyPrices: DailyPriceRecord | null;
  hotels: HotelItem[];
  bills?: Bill[];
  payments?: HotelPayment[];
  settings: ShopSettings;
  language: LanguageCode;
  onSaveBill: (bill: Bill) => void;
  onOpenReceipt: (bill: Bill, isDraft?: boolean, onSaved?: () => void, autoPrintBluetooth?: boolean) => void;
  onNavigateToDailyPrice: () => void;
  onNavigateToHotel?: () => void;
  onAddHotel?: (nameEn: string, nameTa: string) => void;
  onAddProduct?: (nameEn: string, nameTa: string, price: number) => void;
  onDeleteProduct?: (productId: string) => void;
}

interface ProductBillingState {
  productId: string;
  kgInput: string;
  priceInput: string;
  rateInput?: string;
  isCustomManual?: boolean;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  products,
  dailyPrices,
  hotels,
  bills = [],
  payments = [],
  settings,
  language,
  onSaveBill,
  onOpenReceipt,
  onNavigateToDailyPrice,
  onNavigateToHotel,
  onAddHotel,
  onAddProduct,
  onDeleteProduct,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const todayStr = getTodayDateString();

  // Hotel Selection State
  const [selectedHotelId, setSelectedHotelId] = useState<string>(hotels[0]?.id || 'h_0');
  const [customHotelInput, setCustomHotelInput] = useState<string>('');
  const [isCustomHotel, setIsCustomHotel] = useState<boolean>(false);
  const [isAddingHotel, setIsAddingHotel] = useState<boolean>(false);
  const [newHotelNameEn, setNewHotelNameEn] = useState<string>('');
  const [newHotelNameTa, setNewHotelNameTa] = useState<string>('');
  const [addNotification, setAddNotification] = useState<string | null>(null);

  // Add Product State in Billing Selection
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [newProductNameEn, setNewProductNameEn] = useState<string>('');
  const [newProductNameTa, setNewProductNameTa] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<string>('');
  const [productAddNotification, setProductAddNotification] = useState<string | null>(null);

  // Billing items input state: map of productId -> { kgInput, priceInput, rateInput }
  const [billingInputs, setBillingInputs] = useState<Record<string, ProductBillingState>>({});

  // Delete item and clear confirmation states
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);

  // Base rate from daily prices or product default
  const getBaseProductRate = (product: ProductItem): number => {
    if (dailyPrices && dailyPrices.prices[product.id] !== undefined) {
      return dailyPrices.prices[product.id];
    }
    return product.pricePerKg || 0;
  };

  const getProductRate = (product: ProductItem): number => {
    return getBaseProductRate(product);
  };

  // Helper to determine effective KG price
  const getActiveRate = (productId: string): number => {
    const existing = billingInputs[productId];
    if (existing?.rateInput !== undefined && existing.rateInput !== '' && !isNaN(parseFloat(existing.rateInput))) {
      return parseFloat(existing.rateInput);
    }
    const product = products.find((p) => p.id === productId);
    return product ? getProductRate(product) : 0;
  };

  // Synchronized inputs handler
  const handleKgChange = (productId: string, value: string) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
    const rate = getActiveRate(productId);
    const existing = billingInputs[productId];
    let calcPrice = '';
    if (value !== '' && !isNaN(parseFloat(value)) && rate > 0) {
      const calculated = parseFloat(value) * rate;
      calcPrice = Math.round(calculated).toString();
    }
    setBillingInputs((prev) => ({
      ...prev,
      [productId]: {
        productId,
        kgInput: value,
        priceInput: calcPrice,
        rateInput: existing?.rateInput,
      },
    }));
  };

  const handlePriceChange = (productId: string, value: string) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
    const rate = getActiveRate(productId);
    const existing = billingInputs[productId];
    let calcKg = '';
    if (value !== '' && !isNaN(parseFloat(value)) && rate > 0) {
      const calculated = parseFloat(value) / rate;
      calcKg = (Math.round(calculated * 100) / 100).toFixed(2);
    }
    setBillingInputs((prev) => ({
      ...prev,
      [productId]: {
        productId,
        kgInput: calcKg,
        priceInput: value,
        rateInput: existing?.rateInput,
      },
    }));
  };

  const handleRateChange = (productId: string, newRateStr: string) => {
    if (newRateStr !== '' && !/^\d*\.?\d*$/.test(newRateStr)) return;
    const newRate = parseFloat(newRateStr);
    setBillingInputs((prev) => {
      const existing = prev[productId] || { productId, kgInput: '', priceInput: '' };
      let newPrice = existing.priceInput;
      let newKg = existing.kgInput;

      if (newRateStr !== '' && !isNaN(newRate) && newRate > 0) {
        if (existing.kgInput && !isNaN(parseFloat(existing.kgInput)) && parseFloat(existing.kgInput) > 0) {
          newPrice = Math.round(parseFloat(existing.kgInput) * newRate).toString();
        } else if (existing.priceInput && !isNaN(parseFloat(existing.priceInput)) && parseFloat(existing.priceInput) > 0) {
          newKg = (Math.round((parseFloat(existing.priceInput) / newRate) * 100) / 100).toFixed(2);
        }
      }

      return {
        ...prev,
        [productId]: {
          ...existing,
          rateInput: newRateStr,
          priceInput: newPrice,
          kgInput: newKg,
        },
      };
    });
  };

  const handleClearItem = (productId: string) => {
    setBillingInputs((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Calculate active bill items
  const activeBillItems: BillItem[] = useMemo(() => {
    const items: BillItem[] = [];
    products.forEach((product) => {
      const state = billingInputs[product.id];
      if (!state) return;
      const kg = parseFloat(state.kgInput || '0');
      const amount = parseFloat(state.priceInput || '0');
      const defaultRate = getProductRate(product);
      const effectiveRate =
        state.rateInput !== undefined && state.rateInput !== '' && !isNaN(parseFloat(state.rateInput))
          ? parseFloat(state.rateInput)
          : defaultRate;

      if (kg > 0 && amount > 0) {
        items.push({
          productId: product.id,
          productName: product.nameTa || getProductName(product, 'ta'),
          pricePerKg: effectiveRate,
          kg,
          amount,
        });
      }
    });
    return items;
  }, [billingInputs, products, dailyPrices, language]);

  const totalKg = useMemo(() => {
    return activeBillItems.reduce((sum, item) => sum + item.kg, 0);
  }, [activeBillItems]);

  const totalAmount = useMemo(() => {
    return activeBillItems.reduce((sum, item) => sum + item.amount, 0);
  }, [activeBillItems]);

  // Selected Hotel resolution
  const currentSelectedHotelItem = hotels.find((h) => h.id === selectedHotelId) || hotels[0];
  const currentHotelDisplayName = isCustomHotel
    ? customHotelInput.trim() || (language === 'ta' ? 'வாடிக்கையாளர்' : 'Other Customer')
    : currentSelectedHotelItem
    ? getHotelName(currentSelectedHotelItem, language)
    : 'Hotel';

  // Compute map of balances for all hotels
  const hotelBalancesMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!bills || !payments || !hotels) return map;
    hotels.forEach((h) => {
      const targetId = h.id;
      const targetEn = (h.nameEn || '').trim().toLowerCase();
      const targetTa = (h.nameTa || '').trim().toLowerCase();
      const bList = bills.filter((b) => (b.hotelId && b.hotelId === targetId) || (b.hotelName && (b.hotelName.trim().toLowerCase() === targetEn || b.hotelName.trim().toLowerCase() === targetTa)));
      const pList = payments.filter((p) => (p.hotelId && p.hotelId === targetId) || (p.hotelName && (p.hotelName.trim().toLowerCase() === targetEn || p.hotelName.trim().toLowerCase() === targetTa)));
      const billed = bList.reduce((sum, b) => sum + b.totalAmount, 0);
      const paid = pList.filter((p) => p.type !== 'balance_add').reduce((sum, p) => sum + p.amount, 0);
      const balAdded = pList.filter((p) => p.type === 'balance_add').reduce((sum, p) => sum + p.amount, 0);
      map[h.id] = billed + balAdded - paid;
    });
    return map;
  }, [hotels, bills, payments]);

  // Compute selected hotel outstanding balance
  const hotelBalance = useMemo(() => {
    if (!bills || !payments) return 0;
    if (isCustomHotel) {
      const customName = customHotelInput.trim().toLowerCase();
      if (!customName) return 0;
      const hotelBills = bills.filter((b) => (b.hotelName || '').trim().toLowerCase() === customName);
      const hotelPayments = payments.filter((p) => (p.hotelName || '').trim().toLowerCase() === customName);
      const billed = hotelBills.reduce((sum, b) => sum + b.totalAmount, 0);
      const paid = hotelPayments.filter((p) => p.type !== 'balance_add').reduce((sum, p) => sum + p.amount, 0);
      const balAdded = hotelPayments.filter((p) => p.type === 'balance_add').reduce((sum, p) => sum + p.amount, 0);
      return billed + balAdded - paid;
    }
    if (!currentSelectedHotelItem) return 0;
    const targetHotelId = currentSelectedHotelItem.id;
    const targetHotelNameEn = (currentSelectedHotelItem.nameEn || '').trim().toLowerCase();
    const targetHotelNameTa = (currentSelectedHotelItem.nameTa || '').trim().toLowerCase();

    const isMatchingBill = (b: Bill) => {
      if (b.hotelId && b.hotelId === targetHotelId) return true;
      const bName = (b.hotelName || '').trim().toLowerCase();
      return bName === targetHotelNameEn || bName === targetHotelNameTa;
    };
    const isMatchingPayment = (p: HotelPayment) => {
      if (p.hotelId && p.hotelId === targetHotelId) return true;
      const pName = (p.hotelName || '').trim().toLowerCase();
      return pName === targetHotelNameEn || pName === targetHotelNameTa;
    };

    const hotelBills = bills.filter(isMatchingBill);
    const hotelPayments = payments.filter(isMatchingPayment);
    const billed = hotelBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const paid = hotelPayments.filter((p) => p.type !== 'balance_add').reduce((sum, p) => sum + p.amount, 0);
    const balAdded = hotelPayments.filter((p) => p.type === 'balance_add').reduce((sum, p) => sum + p.amount, 0);
    return billed + balAdded - paid;
  }, [selectedHotelId, isCustomHotel, customHotelInput, currentSelectedHotelItem, bills, payments]);

  // Handle Complete Bill Creation
  const handleCreateBill = (_triggerBluetooth = false) => {
    if (activeBillItems.length === 0) {
      alert(language === 'ta' ? 'குறைந்தது ஒரு பொருளுக்கான எடை அல்லது தொகையை உள்ளிடவும்.' : 'Please enter weight (KG) or price for at least one chicken product.');
      return;
    }
    const prevBal = hotelBalance;
    const netTotalWithBal = totalAmount + prevBal;
    const newBill: Bill = {
      id: 'bill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      billNumber: getNextBillNumber(),
      date: todayStr,
      createdAt: new Date().toISOString(),
      hotelName: currentHotelDisplayName,
      hotelId: isCustomHotel ? undefined : currentSelectedHotelItem?.id,
      items: activeBillItems,
      totalKg,
      totalAmount,
      previousBalance: prevBal !== 0 ? prevBal : undefined,
      netTotalWithBalance: prevBal !== 0 ? netTotalWithBal : totalAmount,
    };

    // Open receipt modal as a DRAFT.
    // It will ONLY be saved in the history of wholesale when the user sends the PDF in WhatsApp (or prints via Bluetooth)!
    onOpenReceipt(
      newBill,
      true, // isDraft: true
      () => {
        setBillingInputs({});
      },
      _triggerBluetooth
    );
  };

  const handleClearAll = () => {
    setBillingInputs({});
  };

  const handleSaveNewHotel = (e: React.FormEvent) => {
    e.preventDefault();
    const enTrimmed = newHotelNameEn.trim();
    const taTrimmed = newHotelNameTa.trim();
    if (!enTrimmed && !taTrimmed) return;
    if (onAddHotel) {
      onAddHotel(enTrimmed, taTrimmed);
    }
    setNewHotelNameEn('');
    setNewHotelNameTa('');
    setIsAddingHotel(false);
    const addedName = language === 'ta' ? taTrimmed || enTrimmed : enTrimmed || taTrimmed;
    setAddNotification(
      language === 'ta' ? `"${addedName}" ஹோட்டல் சேர்க்கப்பட்டது!` : `Hotel "${addedName}" added & selected!`
    );
    setTimeout(() => setAddNotification(null), 3500);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomHotel(true);
    } else {
      setIsCustomHotel(false);
      setSelectedHotelId(val);
    }
  };

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const enTrimmed = newProductNameEn.trim();
    const taTrimmed = newProductNameTa.trim();
    const priceVal = parseFloat(newProductPrice) || 0;
    if (!enTrimmed && !taTrimmed) return;
    if (onAddProduct) {
      onAddProduct(enTrimmed, taTrimmed, priceVal);
    }
    setNewProductNameEn('');
    setNewProductNameTa('');
    setNewProductPrice('');
    setIsAddingProduct(false);
    const addedName = language === 'ta' ? taTrimmed || enTrimmed : enTrimmed || taTrimmed;
    setProductAddNotification(
      language === 'ta' ? `"${addedName}" பொருள் பில்லிங்கில் சேர்க்கப்பட்டது!` : `Product "${addedName}" added to billing!`
    );
    setTimeout(() => setProductAddNotification(null), 3500);
  };

  return (
    <div id="page-billing" className="pb-8 pt-1.5 px-2.5 sm:px-3.5 max-w-md mx-auto animate-in fade-in">
      {/* Missing Daily Prices Banner */}
      {!dailyPrices && (
        <div
          id="billing-missing-prices-banner"
          className="mb-1.5 bg-amber-50/90 border border-amber-300/80 rounded-lg py-1 px-2 flex items-center justify-between gap-1.5 shadow-2xs"
        >
          <div
            id="billing-missing-prices-text"
            className="text-[10px] leading-tight text-amber-900 break-words flex-1"
          >
            <span className="font-bold">{t.pricesRequiredNotice}:</span>{' '}
            <span>{language === 'ta' ? 'இன்றைய விலை நிர்ணயிக்கப்படவில்லை.' : 'Daily rates not set for today.'}</span>
          </div>
          <button
            id="btn-billing-navigate-daily-price"
            type="button"
            onClick={onNavigateToDailyPrice}
            className="min-h-[1.85rem] text-[10px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 px-2 py-0.5 rounded-md shadow-2xs transition-all active:scale-95 cursor-pointer touch-manipulation flex-shrink-0"
          >
            <span className="leading-normal">{t.dailyPrice}</span>
          </button>
        </div>
      )}

      {/* Hotel Selection Section with Dropdown and Add Button */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2 sm:p-2.5 shadow-2xs mb-2 space-y-2">
        {/* Dropdown & Add Hotel Button in single row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <select
              id="hotel-dropdown-select"
              value={isCustomHotel ? '__custom__' : selectedHotelId}
              onChange={handleDropdownChange}
              className="w-full min-h-[2.5rem] px-3 pr-8 bg-slate-50 hover:bg-white border-2 border-slate-200 focus:border-emerald-600 focus:bg-white rounded-lg text-xs sm:text-sm font-bold text-slate-900 outline-none appearance-none transition-all cursor-pointer shadow-2xs leading-normal"
            >
              <optgroup label={t.selectHotel}>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id} className="py-1 font-semibold text-gray-900">
                    {getHotelName(hotel, language)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t.other}>
                <option value="__custom__" className="py-1 font-bold text-emerald-800">
                  {language === 'ta' ? 'மற்ற வாடிக்கையாளர்...' : 'Other / One-time Customer...'}
                </option>
              </optgroup>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <button
            id="btn-open-add-hotel"
            type="button"
            onClick={() => {
              setIsAddingHotel((prev) => !prev);
              setNewHotelNameEn('');
              setNewHotelNameTa('');
            }}
            className="min-h-[2.5rem] px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span className="leading-normal">{t.addHotel}</span>
          </button>
        </div>

        {/* Selected Hotel Balance Display at the Top - Big in size */}
        {(!isCustomHotel || customHotelInput.trim() !== '') && (
          <div
            id="billing-top-hotel-balance"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 transition-all shadow-xs ${
              hotelBalance > 0
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : hotelBalance === 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-sky-50 border-sky-300 text-sky-950'
            }`}
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {currentHotelDisplayName}
              </span>
              <span className={`text-[10px] sm:text-[11px] uppercase font-black tracking-wider mt-0.5 ${
                hotelBalance > 0
                  ? 'text-rose-700'
                  : hotelBalance === 0
                  ? 'text-emerald-700'
                  : 'text-sky-700'
              }`}>
                {hotelBalance > 0
                  ? (language === 'ta' ? 'முந்தைய மீதி பாக்கி' : 'Old Balance Due')
                  : hotelBalance === 0
                  ? (language === 'ta' ? 'பாக்கி தொகை இல்லை' : 'All Settled (No Dues)')
                  : (language === 'ta' ? 'முன்பணம்' : 'Advance Credit')}
              </span>
            </div>
            <div className="flex items-baseline gap-1 shrink-0">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                hotelBalance > 0
                  ? 'text-rose-700'
                  : hotelBalance === 0
                  ? 'text-emerald-700'
                  : 'text-sky-700'
              }`}>
                ₹{Math.abs(Math.round(hotelBalance)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Notification when hotel added */}
        {addNotification && (
          <div className="bg-emerald-600 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs animate-in fade-in leading-normal break-words">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{addNotification}</span>
          </div>
        )}

        {/* Inline Add Hotel Form */}
        {isAddingHotel && (
          <form
            onSubmit={handleSaveNewHotel}
            className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider leading-normal">
                {t.addHotel}
              </span>
              <button
                type="button"
                onClick={() => setIsAddingHotel(false)}
                className="text-gray-400 hover:text-gray-700 p-1 min-h-[2rem] min-w-[2rem] flex items-center justify-center cursor-pointer touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <input
                id="input-new-hotel-en"
                type="text"
                value={newHotelNameEn}
                onChange={(e) => setNewHotelNameEn(e.target.value)}
                placeholder={t.hotelNameEn + ' (e.g. Star Biriyani)'}
                className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs sm:text-sm font-bold text-gray-900 outline-none focus:border-emerald-700 leading-normal"
                autoFocus
              />
              <input
                id="input-new-hotel-ta"
                type="text"
                value={newHotelNameTa}
                onChange={(e) => setNewHotelNameTa(e.target.value)}
                placeholder={t.hotelNameTa + ' (உ.ம். ஸ்டார் பிரியாணி)'}
                className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs sm:text-sm font-bold text-gray-900 outline-none focus:border-emerald-700 leading-normal"
              />
            </div>
            <div className="flex justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setIsAddingHotel(false)}
                className="min-h-[2.4rem] px-3 py-1 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
              >
                <span className="leading-normal">{t.cancel}</span>
              </button>
              <button
                id="btn-save-new-hotel-billing"
                type="submit"
                className="min-h-[2.4rem] px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
              >
                <span className="leading-normal">{t.save}</span>
              </button>
            </div>
          </form>
        )}

        {/* Custom Hotel Input if selected from dropdown */}
        {isCustomHotel && (
          <div className="pt-0.5 animate-in fade-in">
            <input
              id="custom-hotel-text-input"
              type="text"
              value={customHotelInput}
              onChange={(e) => setCustomHotelInput(e.target.value)}
              placeholder={language === 'ta' ? 'வாடிக்கையாளர் பெயரை உள்ளிடவும்...' : 'Type customer or hotel name for this bill...'}
              className="w-full min-h-[2.5rem] px-3 py-1.5 bg-emerald-50/60 border-2 border-emerald-400 rounded-lg text-xs sm:text-sm font-bold text-gray-900 outline-none focus:border-emerald-700 focus:bg-white leading-normal"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Products Section Header Actions */}
      {activeBillItems.length > 0 && (
        <div className="flex items-center justify-end mb-1.5 px-0.5 gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              id="btn-clear-all-billing"
              type="button"
              onClick={() => setShowClearAllConfirm(true)}
              className="min-h-[2.4rem] text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 flex items-center gap-1 px-3 py-1 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer touch-manipulation"
            >
              <RefreshCw className="w-3 h-3 text-white" />
              <span className="leading-normal">{t.resetAll}</span>
            </button>
          </div>
        </div>
      )}

      {/* Chicken Products List - Compact Divs */}
      <div className="space-y-1.5">
        {products.map((product) => {
          const defaultRate = getProductRate(product);
          const prodDisplayName = product.nameTa || getProductName(product, 'ta');
          const currentKg = billingInputs[product.id]?.kgInput || '';
          const currentPrice = billingInputs[product.id]?.priceInput || '';
          const customRateStr = billingInputs[product.id]?.rateInput;
          const displayedRate =
            customRateStr !== undefined ? customRateStr : defaultRate > 0 ? defaultRate.toString() : '';
          const isItemActive = parseFloat(currentKg) > 0 || parseFloat(currentPrice) > 0;

          return (
            <div
              key={product.id}
              id={`billing-card-${product.id}`}
              className={`rounded-xl px-2.5 py-1.5 sm:py-2 transition-all border flex flex-col gap-1.5 ${
                isItemActive
                  ? 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 border-2 border-emerald-600 shadow-2xs'
                  : 'bg-white border-slate-200/90 hover:border-emerald-300 shadow-2xs'
              }`}
            >
              {/* TOP ROW: PRODUCT NAME (LEFT) & DELETE BUTTON (RIGHT) */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                      isItemActive ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-slate-300'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight leading-tight break-words">
                      {prodDisplayName}
                    </h4>
                  </div>
                </div>
                {/* DELETE BUTTON */}
                <button
                  id={`btn-delete-${product.id}`}
                  type="button"
                  onClick={() => setItemToDelete(product)}
                  className="flex items-center gap-1 px-2 py-1 min-h-[2.2rem] rounded-lg text-[11px] font-black transition-all active:scale-95 touch-manipulation shadow-2xs bg-rose-50 hover:bg-rose-600 hover:text-white active:bg-rose-700 text-rose-700 border border-rose-200/90 flex-shrink-0 cursor-pointer"
                  title={language === 'ta' ? 'பொருளை நீக்கு' : 'Delete / Clear item'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider font-bold leading-none">
                    {language === 'ta' ? 'நீக்கு' : 'DEL'}
                  </span>
                </button>
              </div>

              {/* BOTTOM ROW: 3 INPUTS [ KG ] [ PRICE ] [ KG PRICE ] */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* 1. KG INPUT */}
                <div className="flex flex-col">
                  <input
                    id={`input-kg-${product.id}`}
                    type="text"
                    inputMode="decimal"
                    value={currentKg}
                    onChange={(e) => handleKgChange(product.id, e.target.value)}
                    placeholder="KG"
                    aria-label={language === 'ta' ? 'அளவு (KG)' : 'KG'}
                    className={`w-full min-h-[2.4rem] px-1.5 py-1 rounded-lg text-xs sm:text-sm font-black outline-none text-center transition-all flex items-center justify-center leading-normal ${
                      parseFloat(currentKg) > 0
                        ? 'bg-emerald-50/70 border-2 border-emerald-600 ring-1 ring-emerald-500/15 text-emerald-950 shadow-2xs'
                        : 'bg-white border-2 border-slate-200 focus:border-emerald-600 focus:bg-emerald-50/20 text-slate-900 shadow-2xs placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {/* 2. PRICE INPUT */}
                <div className="flex flex-col">
                  <input
                    id={`input-price-${product.id}`}
                    type="text"
                    inputMode="decimal"
                    value={currentPrice}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                    placeholder="PRICE (₹)"
                    aria-label={language === 'ta' ? 'தொகை (₹)' : 'Price (₹)'}
                    className={`w-full min-h-[2.4rem] px-1.5 py-1 rounded-lg text-xs sm:text-sm font-black outline-none text-center transition-all flex items-center justify-center leading-normal ${
                      parseFloat(currentPrice) > 0
                        ? 'bg-emerald-50/70 border-2 border-emerald-600 ring-1 ring-emerald-500/15 text-emerald-950 shadow-2xs'
                        : 'bg-white border-2 border-slate-200 focus:border-emerald-600 focus:bg-emerald-50/20 text-slate-900 shadow-2xs placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {/* 3. KG PRICE INPUT */}
                <div className="flex flex-col">
                  <input
                    id={`input-rate-${product.id}`}
                    type="text"
                    inputMode="decimal"
                    value={displayedRate}
                    onChange={(e) => handleRateChange(product.id, e.target.value)}
                    placeholder="RATE"
                    aria-label={language === 'ta' ? 'கிலோ விலை' : 'KG Rate'}
                    className="w-full min-h-[2.4rem] px-1.5 py-1 bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs sm:text-sm font-black text-slate-900 outline-none text-center shadow-2xs transition-all placeholder:text-slate-400 flex items-center justify-center leading-normal"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Total Pill & Bottom Actions Bar */}
      <div className="mt-3 space-y-2">
        {/* Compact Live Total Strip */}
        <div className="bg-slate-900 text-white rounded-xl px-3 py-2 flex items-center justify-between shadow-2xs border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <span>{language === 'ta' ? 'மொத்த எடை' : 'Total Qty'}:</span>
            <span className="text-white font-black text-sm">{totalKg.toFixed(2)} KG</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
            <span>{language === 'ta' ? 'பில் தொகை' : 'Bill'}:</span>
            <span className="text-emerald-400 font-black text-base">₹{Math.round(totalAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Buttons: Bluetooth Print (19cm) & Create Bill */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            id="btn-bluetooth-print-bill"
            type="button"
            onClick={() => handleCreateBill(true)}
            disabled={activeBillItems.length === 0}
            className="w-full min-h-[2.75rem] py-2 px-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer touch-manipulation"
            title={language === 'ta' ? 'புளூடூத் மூலம் 19cm பில் பிரிண்ட் செய்க' : 'Print 19cm Bill via Bluetooth'}
          >
            <Printer className="w-4 h-4 text-white flex-shrink-0" />
            <span className="font-extrabold leading-normal truncate">
              {language === 'ta' ? 'புளூடூத் பிரிண்ட்' : 'Bluetooth Print'}
            </span>
          </button>

          <button
            id="btn-create-bill"
            type="button"
            onClick={() => handleCreateBill(false)}
            disabled={activeBillItems.length === 0}
            className="w-full min-h-[2.75rem] py-2 px-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer touch-manipulation"
            title={language === 'ta' ? 'பில் மாதிரிக்காட்சி & சேமிக்க' : 'Preview & Create Bill'}
          >
            <Send className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            <span className="font-extrabold leading-normal truncate">{t.createBill}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Delete Item */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        title={language === 'ta' ? 'பொருளை நீக்கவா?' : 'Delete item?'}
        message={
          language === 'ta'
            ? `"${itemToDelete ? getProductName(itemToDelete, language) : ''}" பொருளை இந்த பில்லில் இருந்து நீக்க விரும்புகிறீர்களா?`
            : `Do you want to delete "${itemToDelete ? getProductName(itemToDelete, language) : ''}" from this bill?`
        }
        itemDetails={
          itemToDelete && billingInputs[itemToDelete.id]
            ? `${billingInputs[itemToDelete.id]?.kgInput || '0'} KG • ₹${billingInputs[itemToDelete.id]?.priceInput || '0'}`
            : undefined
        }
        confirmLabel={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete'}
        cancelLabel={language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
        language={language}
        onConfirm={() => {
          if (itemToDelete) {
            handleClearItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Confirmation Modal: Clear Entire Bill */}
      <ConfirmDeleteModal
        isOpen={showClearAllConfirm}
        title={language === 'ta' ? 'பில் அழிக்கவா?' : 'Clear entire bill?'}
        message={
          language === 'ta'
            ? 'அனைத்து உள்ளீடுகளையும் அழித்து இந்த பில்லை மீட்டமைக்க விரும்புகிறீர்களா?'
            : 'Do you want to clear all entered items and reset this bill?'
        }
        confirmLabel={language === 'ta' ? 'ஆம், மீட்டமை' : 'Yes, Clear'}
        cancelLabel={language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
        language={language}
        onConfirm={() => {
          handleClearAll();
          setShowClearAllConfirm(false);
        }}
        onCancel={() => setShowClearAllConfirm(false)}
      />
    </div>
  );
};
