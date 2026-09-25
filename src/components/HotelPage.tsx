import React, { useState, useMemo } from 'react';
import {
  Building2,
  ChevronDown,
  PlusCircle,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Trash2,
  Download,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  AlertCircle,
  Sparkles,
  MessageCircle,
  RefreshCw,
  Lock,
  Archive,
} from 'lucide-react';
import { Bill, getHotelName, HotelItem, HotelPayment, LanguageCode, ShopSettings } from '../types';
import {
  exportHotelStatementToCSV,
  formatDisplayDate,
  formatDisplayTime,
  getTodayDateString,
} from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { HotelBalanceSlipModal } from './HotelBalanceSlipModal';
import {
  HotelBalanceShareData,
  shareHotelStatementAsPdfToWhatsApp,
} from '../utils/whatsapp';

interface HotelPageProps {
  hotels: HotelItem[];
  bills: Bill[];
  payments: HotelPayment[];
  settings: ShopSettings;
  language: LanguageCode;
  onAddPayment: (payment: HotelPayment) => void;
  onDeletePayment: (paymentId: string) => void;
  onReprintBill: (bill: Bill) => void;
}

export const HotelPage: React.FC<HotelPageProps> = ({
  hotels,
  bills,
  payments,
  settings,
  language,
  onAddPayment,
  onDeletePayment,
  onReprintBill,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const todayStr = getTodayDateString();

  const [selectedHotelKey, setSelectedHotelKey] = useState<string>(
    hotels.length > 0 ? hotels[0].id : 'all'
  );

  const [activeLedgerTab, setActiveLedgerTab] = useState<'payments' | 'bills'>('payments');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(true);
  const [entryMode, setEntryMode] = useState<'payment' | 'balance_add'>('payment');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(todayStr);
  const [payMode, setPayMode] = useState<'cash' | 'upi' | 'bank' | 'cheque' | 'other'>('cash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<HotelPayment | null>(null);
  const [isBalanceSlipModalOpen, setIsBalanceSlipModalOpen] = useState(false);
  const [isSharingBalance, setIsSharingBalance] = useState(false);

  const allHotelOptions = useMemo(() => {
    const list: { id: string; nameEn: string; nameTa: string; key: string }[] = hotels.map((h) => ({
      id: h.id,
      nameEn: h.nameEn,
      nameTa: h.nameTa,
      key: h.id,
    }));

    bills.forEach((b) => {
      const bName = b.hotelName?.trim();
      if (!bName) return;
      const matched = hotels.some(
        (h) =>
          h.nameEn.toLowerCase() === bName.toLowerCase() ||
          h.nameTa.toLowerCase() === bName.toLowerCase()
      );
      if (!matched && !list.some((it) => it.nameEn.toLowerCase() === bName.toLowerCase())) {
        list.push({
          id: 'custom_' + bName,
          nameEn: bName,
          nameTa: bName,
          key: 'custom_' + bName,
        });
      }
    });
    return list;
  }, [hotels, bills]);

  const currentSelectedHotel = useMemo(() => {
    if (selectedHotelKey === 'all') return null;
    return allHotelOptions.find((h) => h.key === selectedHotelKey) || null;
  }, [selectedHotelKey, allHotelOptions]);

  const isBillForHotel = (bill: Bill, hotel: { nameEn: string; nameTa: string; id: string }) => {
    const bName = (bill.hotelName || '').trim().toLowerCase();
    const en = hotel.nameEn.trim().toLowerCase();
    const ta = hotel.nameTa.trim().toLowerCase();
    return bName === en || bName === ta;
  };

  const isPaymentForHotel = (
    payment: HotelPayment,
    hotel: { nameEn: string; nameTa: string; id: string; key: string }
  ) => {
    if (payment.hotelId && (payment.hotelId === hotel.id || payment.hotelId === hotel.key)) {
      return true;
    }
    const pName = (payment.hotelName || '').trim().toLowerCase();
    const en = hotel.nameEn.trim().toLowerCase();
    const ta = hotel.nameTa.trim().toLowerCase();
    return pName === en || pName === ta;
  };

  const hotelStats = useMemo(() => {
    if (!currentSelectedHotel) {
      return {
        totalBilled: 0,
        totalKg: 0,
        totalPaid: 0,
        totalBalAdded: 0,
        balance: 0,
        hotelBills: [],
        hotelPayments: [],
      };
    }
    const hotelBills = bills.filter((b) => isBillForHotel(b, currentSelectedHotel));
    const hotelPayments = payments.filter((p) => isPaymentForHotel(p, currentSelectedHotel));
    const totalBilled = hotelBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalKg = hotelBills.reduce((sum, b) => sum + b.totalKg, 0);
    const totalPaid = hotelPayments.filter((p) => p.type !== 'balance_add').reduce((sum, p) => sum + p.amount, 0);
    const totalBalAdded = hotelPayments.filter((p) => p.type === 'balance_add').reduce((sum, p) => sum + p.amount, 0);
    const balance = totalBilled + totalBalAdded - totalPaid;
    return {
      totalBilled,
      totalKg,
      totalPaid,
      totalBalAdded,
      balance,
      hotelBills,
      hotelPayments,
    };
  }, [currentSelectedHotel, bills, payments]);

  const matchedHotelItem: HotelItem = useMemo(() => {
    if (!currentSelectedHotel) {
      return { id: '', nameEn: '', nameTa: '', phone: '' };
    }
    const found = hotels.find(
      (h) =>
        h.id === currentSelectedHotel.id ||
        h.nameEn.toLowerCase() === currentSelectedHotel.nameEn.toLowerCase()
    );
    return (
      found || {
        id: currentSelectedHotel.id,
        nameEn: currentSelectedHotel.nameEn,
        nameTa: currentSelectedHotel.nameTa,
        phone: '',
      }
    );
  }, [currentSelectedHotel, hotels]);

  const handleDirectWhatsAppShare = async () => {
    if (!currentSelectedHotel) return;
    setIsSharingBalance(true);
    try {
      const sortedPayments = [...hotelStats.hotelPayments]
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      const actualPayments = sortedPayments.filter((p) => p.type !== 'balance_add');
      const lastTwoPayments = (actualPayments.length > 0 ? actualPayments : sortedPayments).slice(0, 2);

      const now = new Date();
      const statementTime = formatDisplayTime(now.toISOString(), language);

      const data: HotelBalanceShareData = {
        hotelName: currentSelectedHotel.nameEn,
        hotelNameTa: currentSelectedHotel.nameTa,
        hotelPhone: matchedHotelItem.phone,
        totalBilled: hotelStats.totalBilled,
        totalPaid: hotelStats.totalPaid,
        totalBalAdded: hotelStats.totalBalAdded,
        balance: hotelStats.balance,
        totalKg: hotelStats.totalKg,
        billCount: hotelStats.hotelBills.length,
        paymentCount: hotelStats.hotelPayments.filter((p) => p.type !== 'balance_add').length,
        statementTime,
        recentBills: hotelStats.hotelBills.slice(0, 3).map((b) => ({
          billNumber: b.billNumber,
          date: b.date,
          amount: b.totalAmount,
          kg: b.totalKg,
        })),
        recentPayments: lastTwoPayments.map((p) => ({
          date: p.date,
          createdAt: p.createdAt,
          time: p.createdAt ? formatDisplayTime(p.createdAt, language) : '',
          amount: p.amount,
          mode: p.paymentMode || 'cash',
        })),
      };
      const res = await shareHotelStatementAsPdfToWhatsApp(
        data,
        settings,
        'printable-hotel-statement',
        language
      );
      setPaymentSuccessToast(res.message);
      setTimeout(() => setPaymentSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Direct WhatsApp share error:', err);
    } finally {
      setIsSharingBalance(false);
    }
  };

  const allHotelsBalances = useMemo(() => {
    return allHotelOptions.map((h) => {
      const hBills = bills.filter((b) => isBillForHotel(b, h));
      const hPayments = payments.filter((p) => isPaymentForHotel(p, h));
      const billed = hBills.reduce((sum, b) => sum + b.totalAmount, 0);
      const paid = hPayments.filter((p) => p.type !== 'balance_add').reduce((sum, p) => sum + p.amount, 0);
      const balAdded = hPayments.filter((p) => p.type === 'balance_add').reduce((sum, p) => sum + p.amount, 0);
      const bal = billed + balAdded - paid;
      const lastPayment = hPayments.length > 0 ? hPayments[0] : null;
      return {
        hotel: h,
        billed,
        paid,
        balance: bal,
        billCount: hBills.length,
        paymentCount: hPayments.length,
        lastPayment,
      };
    });
  }, [allHotelOptions, bills, payments]);

  const totalPendingAllHotels = useMemo(() => {
    return allHotelsBalances.reduce((sum, item) => (item.balance > 0 ? sum + item.balance : sum), 0);
  }, [allHotelsBalances]);

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedHotel) return;
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }
    const hotelDisplayName = language === 'ta' ? currentSelectedHotel.nameTa : currentSelectedHotel.nameEn;
    const isBalAdd = entryMode === 'balance_add';
    const newPayment: HotelPayment = {
      id: (isBalAdd ? 'bal_add_' : 'pay_') + Date.now(),
      hotelId: currentSelectedHotel.id,
      hotelName: hotelDisplayName,
      amount: amountNum,
      date: payDate || todayStr,
      createdAt: new Date().toISOString(),
      paymentMode: isBalAdd ? 'other' : payMode,
      type: isBalAdd ? 'balance_add' : 'payment',
      notes: payNotes.trim() || (isBalAdd ? (language === 'ta' ? 'பாக்கி சேர்த்தல்' : 'Bal Add') : undefined),
    };
    onAddPayment(newPayment);
    setPayAmount('');
    setPayNotes('');
    setPaymentSuccessToast(
      isBalAdd
        ? language === 'ta'
          ? `₹${amountNum.toLocaleString('en-IN')} பாக்கியில் சேர்க்கப்பட்டது (Bal Add)!`
          : `₹${amountNum.toLocaleString('en-IN')} added to hotel balance!`
        : language === 'ta'
        ? `₹${amountNum.toLocaleString('en-IN')} வரவு வைக்கப்பட்டது!`
        : `₹${amountNum.toLocaleString('en-IN')} payment recorded!`
    );
    setTimeout(() => setPaymentSuccessToast(null), 3500);
  };

  const handleQuickAmount = (amt: number) => {
    setPayAmount(String(amt));
  };

  return (
    <div id="page-hotel" className="pb-8 pt-2 px-2.5 sm:px-3.5 max-w-md mx-auto space-y-2 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-emerald-950 leading-tight">
              {t.hotelAccounts}
            </h2>
          </div>
        </div>
        {totalPendingAllHotels > 0 && (
          <div className="text-right bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
            <span className="text-[9px] font-bold text-amber-800 uppercase block leading-tight">
              {language === 'ta' ? 'மொத்த பாக்கி' : 'Total Dues'}
            </span>
            <span className="text-xs font-black text-amber-900 leading-tight">
              ₹{Math.round(totalPendingAllHotels).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Hotel Dropdown Selector Container */}
      <div className="bg-white border border-emerald-200 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-1.5">
        <label className="block text-xs font-black text-emerald-950 flex items-center justify-between">
          <span className="flex items-center gap-1.5 leading-normal">
            <Building2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span>{t.selectHotelToViewBal}</span>
          </span>
        </label>
        <div className="relative">
          <select
            id="hotel-dropdown-selector"
            value={selectedHotelKey}
            onChange={(e) => setSelectedHotelKey(e.target.value)}
            className="w-full pl-3 pr-8 min-h-[2.4rem] py-1.5 bg-emerald-50/50 hover:bg-emerald-50/80 border border-emerald-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm font-black text-emerald-950 outline-none appearance-none transition-all cursor-pointer shadow-2xs leading-normal"
          >
            <option value="all">
              {language === 'ta' ? 'அனைத்து ஹோட்டல் சுருக்கம்' : 'All Hotels Overview'}
            </option>
            {allHotelOptions.map((hotel) => {
              const displayName = language === 'ta' ? (hotel.nameTa || hotel.nameEn) : (hotel.nameEn || hotel.nameTa);
              return (
                <option key={hotel.key} value={hotel.key}>
                  {displayName}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-emerald-700">
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* SUCCESS TOAST MESSAGE */}
      {paymentSuccessToast && (
        <div className="bg-emerald-700 text-white p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs animate-in fade-in slide-in-from-top-2 leading-normal break-words">
          <Check className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{paymentSuccessToast}</span>
        </div>
      )}

      {/* VIEW 1: SPECIFIC HOTEL SELECTED */}
      {currentSelectedHotel && (
        <div className="space-y-2">
          {/* Main Balance Display Card */}
          <div
            id="hotel-balance-summary-card"
            className={`rounded-xl p-2.5 sm:p-3 text-white shadow-2xs transition-all ${
              hotelStats.balance > 0
                ? 'bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 border border-emerald-600'
                : hotelStats.balance === 0
                ? 'bg-gradient-to-br from-teal-800 to-emerald-900 border border-emerald-500'
                : 'bg-gradient-to-br from-sky-800 to-emerald-900 border border-sky-500'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/20 gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                <h3 className="font-black text-xs sm:text-sm text-white tracking-wide break-words leading-tight">
                  {language === 'ta' ? currentSelectedHotel.nameTa : currentSelectedHotel.nameEn}
                </h3>
              </div>
            </div>

            <div className="pt-2 pb-1.5 text-center">
              <div className="text-2xl sm:text-3xl leading-tight font-black tracking-tight text-white flex items-center justify-center gap-0.5">
                <span className="text-xl sm:text-2xl opacity-90">₹</span>
                <span>{Math.abs(Math.round(hotelStats.balance)).toLocaleString('en-IN')}</span>
              </div>
              {hotelStats.balance === 0 && (
                <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-emerald-200 bg-white/10 px-2 py-0.5 rounded-full leading-normal">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t.allSettled}</span>
                </div>
              )}
              {hotelStats.balance < 0 && (
                <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-sky-200 bg-white/10 px-2 py-0.5 rounded-full leading-normal">
                  <Sparkles className="w-3 h-3" />
                  <span>{t.advancePaid}</span>
                </div>
              )}
            </div>

            {/* Share Balance Action Bar */}
            <div className="pt-1.5 pb-1 border-t border-white/20">
              <button
                id="btn-share-hotel-balance"
                type="button"
                onClick={handleDirectWhatsAppShare}
                disabled={isSharingBalance}
                className="w-full min-h-[2.4rem] py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-2xs cursor-pointer touch-manipulation"
                title={language === 'ta' ? 'வாட்ஸ்அப் வழி பாக்கி விவரம் பகிர்' : 'Share Balance to WhatsApp'}
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-950 text-emerald-950 flex-shrink-0" />
                <span className="leading-normal break-words text-center">
                  {isSharingBalance
                    ? (language === 'ta' ? 'பகிர்கிறது...' : 'Sharing...')
                    : (language === 'ta' ? 'வாட்ஸ்அப் பகிர்' : 'WhatsApp Share')}
                </span>
              </button>
            </div>

            <div className={`grid gap-1.5 pt-1.5 border-t border-white/20 text-xs ${hotelStats.totalBalAdded !== 0 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
              <div className="bg-black/15 rounded-lg p-2">
                <div className="flex items-center gap-1 text-emerald-200 text-[9px] font-bold uppercase mb-0.5 leading-none">
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                  <span>{t.totalBilled}</span>
                </div>
                <div className="font-black text-sm sm:text-base text-white tracking-tight leading-tight">
                  ₹{Math.round(hotelStats.totalBilled).toLocaleString('en-IN')}
                </div>
              </div>
              {hotelStats.totalBalAdded !== 0 && (
                <div className="bg-black/15 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-amber-300 text-[9px] font-bold uppercase mb-0.5 leading-none">
                    <ArrowUpRight className="w-3 h-3 text-amber-300 flex-shrink-0" />
                    <span>
                      {hotelStats.totalBalAdded > 0
                        ? (language === 'ta' ? 'பாக்கி கூட்டல்' : 'Bal Added')
                        : (language === 'ta' ? 'ஆரம்ப இருப்பு' : 'Opening Bal')}
                    </span>
                  </div>
                  <div className={`font-black text-sm sm:text-base tracking-tight leading-tight ${
                    hotelStats.totalBalAdded > 0 ? 'text-amber-200' : 'text-sky-200'
                  }`}>
                    {hotelStats.totalBalAdded > 0 ? '+' : '-'} ₹{Math.abs(Math.round(hotelStats.totalBalAdded)).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
              <div className="bg-black/15 rounded-lg p-2">
                <div className="flex items-center gap-1 text-emerald-200 text-[9px] font-bold uppercase mb-0.5 leading-none">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-300 flex-shrink-0" />
                  <span>{t.totalPaid}</span>
                </div>
                <div className="font-black text-sm sm:text-base text-white tracking-tight leading-tight">
                  ₹{Math.round(hotelStats.totalPaid).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Form Card: Add Paid Payment or Bal Add */}
          <div className={`bg-white border rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2 transition-colors ${
            entryMode === 'payment' ? 'border-emerald-200' : 'border-amber-300 ring-1 ring-amber-400/20'
          }`}>
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div
                className="flex items-center gap-1.5 cursor-pointer select-none min-h-[2.2rem]"
                onClick={() => setIsAddPaymentOpen(!isAddPaymentOpen)}
              >
                {entryMode === 'payment' ? (
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                )}
                <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide leading-tight">
                  {entryMode === 'payment'
                    ? language === 'ta'
                      ? 'வரவு சேர்க்க (Add Payment)'
                      : 'Add Payment'
                    : language === 'ta'
                    ? 'பாக்கி சேர்க்க (Bal Add)'
                    : 'Add Balance (Bal Add)'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="btn-change-payment-bal-add"
                  type="button"
                  onClick={() => setEntryMode(entryMode === 'payment' ? 'balance_add' : 'payment')}
                  className={`min-h-[2.2rem] text-xs font-black px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs active:scale-95 text-white cursor-pointer touch-manipulation ${
                    entryMode === 'payment'
                      ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                      : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900'
                  }`}
                  title={entryMode === 'payment' ? 'Switch to Bal Add' : 'Switch to Add Payment'}
                >
                  <RefreshCw className="w-3 h-3 text-white flex-shrink-0" />
                  <span className="leading-none">
                    {entryMode === 'payment'
                      ? language === 'ta'
                        ? 'பாக்கி சேர்க்க'
                        : 'Bal Add'
                      : language === 'ta'
                        ? 'வரவு வைக்க'
                        : 'Payment'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(!isAddPaymentOpen)}
                  className="min-h-[2.2rem] text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-800 active:bg-slate-900 transition-colors shadow-2xs cursor-pointer touch-manipulation flex items-center justify-center"
                >
                  <span className="leading-none">
                    {isAddPaymentOpen ? (language === 'ta' ? 'மறை' : 'Hide') : (language === 'ta' ? 'திற' : 'Open')}
                  </span>
                </button>
              </div>
            </div>

            {isAddPaymentOpen && (
              <div className="space-y-2 pt-0.5">
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200 rounded-xl border border-slate-300 text-xs font-extrabold">
                  <button
                    type="button"
                    id="tab-btn-add-payment"
                    onClick={() => setEntryMode('payment')}
                    className={`min-h-[2.2rem] py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer touch-manipulation ${
                      entryMode === 'payment'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="leading-normal">{language === 'ta' ? 'வரவு (Payment)' : 'Add Payment'}</span>
                  </button>
                  <button
                    type="button"
                    id="tab-btn-bal-add"
                    onClick={() => setEntryMode('balance_add')}
                    className={`min-h-[2.2rem] py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer touch-manipulation ${
                      entryMode === 'balance_add'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="leading-normal">{language === 'ta' ? 'பாக்கி (Bal Add)' : 'Bal Add'}</span>
                  </button>
                </div>

                <form onSubmit={handleAddPaymentSubmit} className="space-y-2 pt-0.5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between leading-none">
                      <span className="flex items-center gap-1">
                        <IndianRupee className={`w-3.5 h-3.5 ${entryMode === 'payment' ? 'text-emerald-700' : 'text-amber-600'}`} />
                        <span>
                          {entryMode === 'payment'
                            ? t.paymentAmount
                            : language === 'ta'
                            ? 'கூட்ட வேண்டிய பாக்கித் தொகை (Bal Add)'
                            : 'Balance Amount to Add'}
                        </span>
                      </span>
                    </label>
                    <input
                      id="input-pay-amount"
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={entryMode === 'payment' ? 'e.g. 2000' : 'e.g. 1500'}
                      className={`w-full min-h-[2.4rem] px-3 py-1.5 border rounded-xl text-sm sm:text-base font-black text-gray-900 outline-none transition-all leading-normal ${
                        entryMode === 'payment'
                          ? 'bg-emerald-50/40 border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/20'
                          : 'bg-amber-50/40 border-amber-300 focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>

                  {entryMode === 'balance_add' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1 leading-none">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>{language === 'ta' ? 'காரணம் / குறிப்பு' : 'Reason / Note'}</span>
                      </label>
                      <input
                        id="input-pay-notes"
                        type="text"
                        value={payNotes}
                        onChange={(e) => setPayNotes(e.target.value)}
                        placeholder={language === 'ta' ? 'முந்தைய பாக்கி, சரிக்கட்டல்' : 'e.g. Previous balance, adjustment'}
                        className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-amber-50/40 border border-amber-300 focus:border-amber-600 rounded-xl text-xs font-bold text-gray-900 outline-none leading-normal"
                      />
                    </div>
                  )}

                  {entryMode === 'balance_add' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs text-amber-900 flex items-start gap-1.5 leading-normal break-words">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        {language === 'ta'
                          ? 'இந்த பாக்கியைச் சேர்ப்பது வாடிக்கையாளரின் மொத்த நிலுவைத் தொகையை அதிகரிக்கும்.'
                          : 'Adding this balance will increase the total due amount for this customer.'}
                      </span>
                    </div>
                  )}

                  <div className="pt-0.5">
                    <button
                      id="btn-save-hotel-payment"
                      type="submit"
                      className={`w-full min-h-[2.4rem] py-1.5 px-3 text-white font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer touch-manipulation ${
                        entryMode === 'payment'
                          ? 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900'
                          : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                      }`}
                    >
                      {entryMode === 'payment' ? (
                        <>
                          <PlusCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="leading-normal">{t.savePayment}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="leading-normal">{language === 'ta' ? 'பாக்கி சேர்க்க (Save Bal Add)' : 'Save Bal Add'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Ledger Breakdown Tabs: Payments vs Bills */}
          <div className="bg-white border border-emerald-200 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2">
            <div className="flex bg-emerald-50 p-1 rounded-xl border border-emerald-200/80 gap-1">
              <button
                type="button"
                onClick={() => setActiveLedgerTab('payments')}
                className={`flex-1 min-h-[2.4rem] py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                  activeLedgerTab === 'payments'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-emerald-900 hover:bg-emerald-100/50'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="leading-normal break-words text-center">
                  {language === 'ta' ? 'வரவு & பாக்கி' : 'Payments & Bal Add'} ({hotelStats.hotelPayments.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLedgerTab('bills')}
                className={`flex-1 min-h-[2.4rem] py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                  activeLedgerTab === 'bills'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-emerald-900 hover:bg-emerald-100/50'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="leading-normal break-words text-center">
                  {t.billsHistory} ({hotelStats.hotelBills.length})
                </span>
              </button>
            </div>

            {/* TAB 1 CONTENT: PAYMENTS & BAL ADD */}
            {activeLedgerTab === 'payments' && (
              <div className="space-y-1.5">
                {hotelStats.hotelPayments.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    <IndianRupee className="w-6 h-6 mx-auto mb-1 opacity-40 text-emerald-700" />
                    <p className="font-bold text-gray-600">{t.noPaymentsRecorded}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
                      {language === 'ta' ? 'மேலே உள்ள படிவத்தைப் பயன்படுத்தி வரவு சேர்க்கவும்.' : 'Use the form above to record payment or add balance.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-emerald-50 max-h-80 overflow-y-auto">
                    {hotelStats.hotelPayments.map((p) => {
                      const isBalAdd = p.type === 'balance_add';
                      const isOpBal = Boolean(p.isOpeningBalance);
                      const isNegative = p.amount < 0;

                      // Badge styling and text
                      let badgeClass = 'bg-emerald-100 text-emerald-800';
                      let badgeText = p.paymentMode || 'cash';
                      if (isOpBal) {
                        badgeClass = isNegative
                          ? 'bg-sky-100 text-sky-900 border border-sky-200'
                          : 'bg-indigo-100 text-indigo-900 border border-indigo-200';
                        badgeText = isNegative
                          ? (language === 'ta' ? 'ஆரம்ப முன்பணம்' : 'Opening Credit')
                          : (language === 'ta' ? 'ஆரம்ப பாக்கி' : 'Opening Bal');
                      } else if (isBalAdd) {
                        badgeClass = isNegative
                          ? 'bg-sky-100 text-sky-900 border border-sky-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200';
                        badgeText = isNegative
                          ? (language === 'ta' ? 'பாக்கி கழிவு' : 'Bal Adj (-)')
                          : (language === 'ta' ? 'பாக்கி கூட்டல்' : 'Bal Add (+)');
                      }

                      // Amount color and prefix
                      let amountClass = 'text-emerald-950';
                      let prefix = '';
                      if (isOpBal) {
                        amountClass = isNegative ? 'text-sky-950' : 'text-indigo-950';
                        prefix = isNegative ? '- ' : '+ ';
                      } else if (isBalAdd) {
                        amountClass = isNegative ? 'text-sky-950' : 'text-amber-950';
                        prefix = isNegative ? '- ' : '+ ';
                      }

                      // Main descriptive label for opening balance
                      const openingBalLabel = isOpBal
                        ? language === 'ta'
                          ? `ஆரம்ப பாக்கி (${formatDisplayDate(p.date)} வரை காப்பகம்)`
                          : `Opening balance (archived up to ${formatDisplayDate(p.date)})`
                        : null;

                      return (
                        <div
                          key={p.id}
                          id={`payment-row-${p.id}`}
                          className={`min-h-[2.4rem] py-2 flex items-center justify-between gap-2 rounded-xl px-1.5 transition-colors ${
                            isOpBal ? 'bg-indigo-50/50 hover:bg-indigo-50/80 border border-indigo-100/60 my-0.5' : 'hover:bg-emerald-50/40'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isOpBal
                                  ? isNegative ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'
                                  : isBalAdd
                                  ? isNegative ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOpBal ? (
                                <Archive className="w-3.5 h-3.5" />
                              ) : isBalAdd ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs sm:text-sm font-black ${amountClass} leading-tight`}>
                                  {prefix}₹{Math.abs(Math.round(p.amount)).toLocaleString('en-IN')}
                                </span>
                                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase ${badgeClass} leading-tight`}>
                                  {badgeText}
                                </span>
                              </div>
                              {openingBalLabel ? (
                                <div className="text-[10px] font-bold text-indigo-900 flex items-center gap-1 mt-0.5 leading-tight break-words">
                                  <span>{openingBalLabel}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 flex-wrap leading-tight">
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                    <span>{formatDisplayDate(p.date)}</span>
                                  </span>
                                  {p.notes && (
                                    <span className="text-gray-500 break-words">
                                      • {p.notes}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {isOpBal ? (
                            <div
                              className="min-h-[2.2rem] min-w-[2.2rem] p-1 text-slate-400 bg-slate-100 rounded-lg flex items-center justify-center cursor-not-allowed flex-shrink-0"
                              title={language === 'ta' ? 'ஆரம்ப பாக்கியை நீக்க முடியாது' : 'Opening balance is protected and cannot be deleted'}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPaymentToDelete(p)}
                              title={isBalAdd ? 'Delete Bal Add' : 'Delete payment'}
                              className="min-h-[2.2rem] min-w-[2.2rem] p-1 text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition-colors shadow-2xs cursor-pointer flex-shrink-0 flex items-center justify-center touch-manipulation"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2 CONTENT: BILLS */}
            {activeLedgerTab === 'bills' && (
              <div className="space-y-1.5">
                {hotelStats.hotelBills.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    <Receipt className="w-6 h-6 mx-auto mb-1 opacity-40 text-emerald-700" />
                    <p className="font-bold text-gray-600">{t.noBillsForThisHotel}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-emerald-50 max-h-80 overflow-y-auto">
                    {hotelStats.hotelBills.map((b) => (
                      <div
                        key={b.id}
                        id={`hotel-bill-row-${b.id}`}
                        className="min-h-[2.4rem] py-2 flex items-center justify-between gap-2 hover:bg-emerald-50/40 rounded-xl px-1.5 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-emerald-700 text-white font-mono text-[9px] font-bold rounded-md leading-tight">
                              #{b.billNumber}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 leading-tight">
                              {formatDisplayDate(b.date)}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5 leading-tight break-words">
                            <strong>{b.totalKg.toFixed(2)} {t.kg}</strong> • {b.items.length} {language === 'ta' ? 'பொருட்கள்' : 'items'}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-1.5 flex-shrink-0">
                          <div className="text-xs sm:text-sm font-black text-emerald-950 leading-tight">
                            ₹{Math.round(b.totalAmount).toLocaleString('en-IN')}
                          </div>
                          <button
                            type="button"
                            onClick={() => onReprintBill(b)}
                            className="min-h-[2.2rem] min-w-[2.2rem] p-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center justify-center touch-manipulation"
                            title={language === 'ta' ? 'வாட்ஸ்அப் PDF' : 'Send WhatsApp PDF'}
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReprintBill(b)}
                            className="min-h-[2.2rem] min-w-[2.2rem] p-1.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center justify-center touch-manipulation"
                            title={t.reprint}
                          >
                            <Receipt className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ALL HOTELS SUMMARY / OVERVIEW */}
      {!currentSelectedHotel && (
        <div className="space-y-2">
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/20 gap-2">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider leading-none">
                {t.totalPendingAcrossHotels}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white leading-none flex-shrink-0">
                {allHotelsBalances.filter((h) => h.balance > 0).length} {t.hotelsWithBalance}
              </span>
            </div>
            <div className="pt-2 text-center">
              <div className="text-xl sm:text-2xl font-black text-white leading-tight">
                ₹{Math.round(totalPendingAllHotels).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-200 mt-0.5 block leading-normal break-words">
                {language === 'ta'
                  ? 'கீழே உள்ள ஏதேனும் ஹோட்டலைக் கிளிக் செய்து பாக்கி மற்றும் வரவு விவரங்களை பார்க்கவும்.'
                  : 'Click any hotel below to view balance ledger or add payment.'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
              <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide leading-none">
                {t.allHotelsOverview} ({allHotelsBalances.length})
              </h3>
            </div>
            <div className="divide-y divide-emerald-50">
              {allHotelsBalances.map((item) => {
                const displayName = language === 'ta' ? item.hotel.nameTa : item.hotel.nameEn;
                const secondaryName = language === 'ta' ? item.hotel.nameEn : item.hotel.nameTa;
                return (
                  <div
                    key={item.hotel.key}
                    id={`hotel-overview-row-${item.hotel.key}`}
                    onClick={() => setSelectedHotelKey(item.hotel.key)}
                    className="min-h-[2.4rem] py-2 px-2 flex items-center justify-between gap-2 hover:bg-emerald-50/70 rounded-xl transition-all cursor-pointer group touch-manipulation"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-emerald-900 break-words leading-tight">
                        {displayName}
                      </h4>
                      {secondaryName !== displayName && (
                        <span className="text-[10px] text-gray-400 block break-words mt-0.5 leading-none">
                          {secondaryName}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] text-gray-500 flex-wrap leading-none">
                        <span>{item.billCount} {language === 'ta' ? 'பில்கள்' : 'bills'}</span>
                        <span>•</span>
                        <span className="break-words">
                          {item.lastPayment
                            ? `${t.lastPaymentOn} ₹${Math.round(item.lastPayment.amount)} (${formatDisplayDate(item.lastPayment.date)})`
                            : t.noPayments}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[9px] font-bold uppercase block text-gray-400 leading-none">
                        {t.balanceDue}
                      </span>
                      <div
                        className={`text-xs sm:text-sm font-black leading-tight ${
                          item.balance > 0
                            ? 'text-amber-800'
                            : item.balance === 0
                            ? 'text-emerald-700'
                            : 'text-sky-700'
                        }`}
                      >
                        ₹{Math.abs(Math.round(item.balance)).toLocaleString('en-IN')}
                      </div>
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none ${
                          item.balance > 0
                            ? 'bg-amber-100 text-amber-900'
                            : item.balance === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {item.balance > 0
                          ? language === 'ta'
                            ? 'நிலுவை'
                            : 'Due'
                          : item.balance === 0
                          ? language === 'ta'
                            ? 'பாக்கி இல்லை'
                            : 'Settled'
                          : language === 'ta'
                            ? 'முன்பணம்'
                            : 'Advance'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!paymentToDelete}
        title={language === 'ta' ? 'வரவை நீக்கவா?' : t.deletePayment}
        message={
          language === 'ta'
            ? 'இந்த வரவு பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?'
            : 'Are you sure you want to delete this payment transaction record?'
        }
        itemDetails={
          paymentToDelete
            ? `₹${Math.round(paymentToDelete.amount).toLocaleString('en-IN')} • ${
                paymentToDelete.type === 'balance_add'
                  ? language === 'ta'
                    ? 'பாக்கி கூட்டல் (+)'
                    : 'Balance Add (+)'
                  : (paymentToDelete.paymentMode || 'cash').toUpperCase()
              } (${formatDisplayDate(paymentToDelete.date)})`
            : undefined
        }
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        language={language}
        onConfirm={() => {
          if (paymentToDelete) {
            onDeletePayment(paymentToDelete.id);
            setPaymentToDelete(null);
          }
        }}
        onCancel={() => setPaymentToDelete(null)}
      />

      {/* Hotel Balance Bill Slip / Statement Modal (Same like the bill receipt) */}
      {currentSelectedHotel && (
        <HotelBalanceSlipModal
          isOpen={isBalanceSlipModalOpen}
          hotel={matchedHotelItem}
          hotelStats={hotelStats}
          settings={settings}
          language={language}
          onClose={() => setIsBalanceSlipModalOpen(false)}
        />
      )}
    </div>
  );
};
