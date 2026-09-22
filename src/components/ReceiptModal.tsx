import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  MessageCircle,
  Download,
  Check,
  Building2,
  Calendar,
  Layers,
  Phone,
  AlertCircle,
} from 'lucide-react';
import {
  Bill,
  getShopDisplayName,
  HotelItem,
  HotelPayment,
  LanguageCode,
  ProductItem,
  resolveHotelDisplayName,
  resolveItemDisplayName,
  ShopSettings,
} from '../types';
import { formatDisplayDate, formatDisplayTime, getHotelPhone, saveOrUpdateHotelPhone } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { downloadBillPdf, shareBillAsPdfToWhatsApp } from '../utils/whatsapp';
import { printViaBluetooth } from '../utils/bluetoothPrinter';

interface ReceiptModalProps {
  isOpen: boolean;
  bill: Bill | null;
  isDraft?: boolean;
  settings: ShopSettings;
  language: LanguageCode;
  hotels?: HotelItem[];
  products?: ProductItem[];
  payments?: HotelPayment[];
  bills?: Bill[];
  autoPrintBluetooth?: boolean;
  onConfirmSave?: () => void;
  onClose: () => void;
  onUpdateHotels?: (hotels: HotelItem[]) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  bill,
  isDraft = false,
  settings,
  language,
  hotels = [],
  products = [],
  payments = [],
  bills = [],
  autoPrintBluetooth = false,
  onConfirmSave,
  onClose,
  onUpdateHotels,
}) => {
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billLang, setBillLang] = useState<LanguageCode>(language);

  // Hotel Phone Management State
  const [hotelPhone, setHotelPhone] = useState<string>('');
  const [showPhonePrompt, setShowPhonePrompt] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    setBillLang(language);
  }, [language, isOpen]);

  const t = TRANSLATIONS[billLang] || TRANSLATIONS.en;

  // Find customer phone if registered
  const matchedHotel = useMemo(() => {
    if (!bill) return undefined;
    return hotels.find(
      (h) =>
        h.nameEn.toLowerCase() === bill.hotelName.toLowerCase() ||
        h.nameTa.toLowerCase() === bill.hotelName.toLowerCase() ||
        (bill.hotelId && h.id === bill.hotelId)
    );
  }, [hotels, bill]);

  // Sync hotel phone state whenever bill or hotels change
  useEffect(() => {
    if (bill) {
      const p = (
        bill.hotelPhone ||
        matchedHotel?.phone ||
        getHotelPhone(bill.hotelId || bill.hotelName, hotels) ||
        ''
      ).trim();
      setHotelPhone(p);
      setPhoneInput(p);
    }
  }, [bill, matchedHotel, hotels]);

  const recipientPhone = hotelPhone || bill?.hotelPhone || matchedHotel?.phone || '';

  // Determine current hotel balance accurately
  const hotelBal = useMemo(() => {
    if (bill?.previousBalance !== undefined) {
      return bill.previousBalance;
    }
    if (!bill || !bills || !payments) return 0;

    const bHotelName = (bill.hotelName || '').trim().toLowerCase();
    const bHotelId = bill.hotelId;

    const matched = hotels.find(
      (h) =>
        (bHotelId && h.id === bHotelId) ||
        h.nameEn.trim().toLowerCase() === bHotelName ||
        h.nameTa.trim().toLowerCase() === bHotelName
    );

    const targetId = matched?.id || bHotelId;
    const targetNameEn = (matched?.nameEn || bHotelName).trim().toLowerCase();
    const targetNameTa = (matched?.nameTa || '').trim().toLowerCase();

    const isMatchBill = (b: Bill) => {
      if (b.id === bill.id) return false;
      if (targetId && b.hotelId && b.hotelId === targetId) return true;
      const name = (b.hotelName || '').trim().toLowerCase();
      return name === targetNameEn || (Boolean(targetNameTa) && name === targetNameTa);
    };

    const isMatchPayment = (p: HotelPayment) => {
      if (targetId && p.hotelId && p.hotelId === targetId) return true;
      const name = (p.hotelName || '').trim().toLowerCase();
      return name === targetNameEn || (Boolean(targetNameTa) && name === targetNameTa);
    };

    const hotelBills = bills.filter(isMatchBill);
    const hotelPayments = payments.filter(isMatchPayment);

    const billed = hotelBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const paid = hotelPayments
      .filter((p) => p.type !== 'balance_add')
      .reduce((sum, p) => sum + p.amount, 0);
    const balAdded = hotelPayments
      .filter((p) => p.type === 'balance_add')
      .reduce((sum, p) => sum + p.amount, 0);

    return billed + balAdded - paid;
  }, [bill, bills, payments, hotels]);

  const handleBluetoothPrint = async () => {
    if (!bill) return;
    setIsProcessing(true);
    setPrintStatus(
      billLang === 'ta'
        ? 'புளூடூத் பிரிண்டருடன் இணைகிறது...'
        : 'Connecting to Bluetooth Printer...'
    );
    try {
      const result = await printViaBluetooth(
        bill,
        settings,
        'printable-thermal-receipt'
      );
      setPrintStatus(result.message);
      if (result.success && isDraft && onConfirmSave) {
        onConfirmSave();
      }
    } catch (e: any) {
      setPrintStatus(
        e?.message ||
          (billLang === 'ta' ? 'புளூடூத் பிழை' : 'Bluetooth print error')
      );
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPrintStatus(null), 4000);
    }
  };

  const handleSystemPrint = () => {
    if (!bill) return;
    window.print();
    if (isDraft && onConfirmSave) {
      onConfirmSave();
    }
  };

  const handleDownloadPdf = async () => {
    if (!bill) return;
    setIsProcessing(true);
    setPrintStatus(billLang === 'ta' ? 'PDF தயாராகிறது...' : 'Generating PDF...');
    try {
      const ok = await downloadBillPdf(
        bill,
        settings,
        recipientPhone,
        'printable-thermal-receipt',
        billLang,
        hotels,
        products
      );
      if (ok) {
        setPrintStatus(
          billLang === 'ta' ? 'PDF பதிவிறக்கம் செய்யப்பட்டது!' : 'PDF downloaded!'
        );
        if (isDraft && onConfirmSave) {
          onConfirmSave();
        }
      }
    } catch {
      setPrintStatus(billLang === 'ta' ? 'PDF பிழை ஏற்பட்டது' : 'Error generating PDF');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPrintStatus(null), 3500);
    }
  };

  const executeWhatsAppShare = async (targetPhone: string) => {
    if (!bill) return;
    setIsProcessing(true);
    setPrintStatus(
      billLang === 'ta'
        ? 'வாட்ஸ்அப் PDF உருவாக்கப்படுகிறது...'
        : 'Sharing WhatsApp PDF...'
    );
    try {
      const res = await shareBillAsPdfToWhatsApp(
        bill,
        settings,
        targetPhone,
        'printable-thermal-receipt',
        billLang,
        hotels,
        products
      );
      setPrintStatus(res.message);
      if (isDraft && onConfirmSave) {
        onConfirmSave();
      }
    } catch {
      setPrintStatus(billLang === 'ta' ? 'பகிர்வதில் பிழை' : 'Share failed');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPrintStatus(null), 4000);
    }
  };

  const handleWhatsAppShareClick = () => {
    if (!bill) return;
    const cur = (hotelPhone || bill.hotelPhone || matchedHotel?.phone || '').trim();
    const cleanDigits = cur.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      // Prompt user to enter hotel WhatsApp phone number
      setPhoneInput(cleanDigits);
      setPhoneError(null);
      setShowPhonePrompt(true);
      return;
    }
    executeWhatsAppShare(cur);
  };

  const handleSavePhoneAndShare = (skipSave = false) => {
    if (!bill) return;
    if (skipSave) {
      setShowPhonePrompt(false);
      setPhoneError(null);
      executeWhatsAppShare('');
      return;
    }

    const cleaned = phoneInput.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setPhoneError(
        billLang === 'ta'
          ? 'சரியான 10 இலக்க செல்போன் எண்ணை உள்ளிடவும்.'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    const phone10 = cleaned.slice(-10);
    // 1. Save in storage (updates hotel item in STORAGE_KEYS.HOTELS and all bills for this hotel)
    const targetIdOrName = bill.hotelId || bill.hotelName;
    const updatedHotels = saveOrUpdateHotelPhone(targetIdOrName, phone10);

    // 2. Notify parent so memory state updates everywhere (Investment Settings, Billing, Register)
    if (onUpdateHotels) {
      onUpdateHotels(updatedHotels);
    }

    // 3. Update local state
    setHotelPhone(phone10);
    bill.hotelPhone = phone10;
    setShowPhonePrompt(false);
    setPhoneError(null);

    // 4. Trigger WhatsApp Share with the new phone number
    executeWhatsAppShare(phone10);
  };

  // Auto trigger Bluetooth print if requested from quick print action
  useEffect(() => {
    if (isOpen && autoPrintBluetooth && bill) {
      handleBluetoothPrint();
    }
  }, [isOpen, autoPrintBluetooth, bill]);

  if (!isOpen || !bill) return null;

  const isTamil = billLang === 'ta';
  // Store details ALWAYS in English itself (as explicitly requested)
  const englishShopName = (settings.shopNameEn || settings.shopName || 'SSS CHICKEN AGENCY').toUpperCase();
  const englishAddress = (settings.addressEn || settings.address || 'NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110').toUpperCase();
  const englishPhone = settings.phoneNumber || '8680000003';
  const englishGst = settings.gstNumber || '34AQPN8846J2ZF';

  // Customer / Hotel Name and Bill Meta
  const displayHotelName = resolveHotelDisplayName(bill.hotelName, bill.hotelId, hotels, billLang);
  const billDateStr = formatDisplayDate(bill.date, billLang);
  const billTimeStr = formatDisplayTime(bill.createdAt, billLang);
  const billAmountInt = Math.round(bill.totalAmount);
  const currPrefix = isTamil ? 'ரூ.' : 'Rs.';

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="receipt-modal-container"
        className="bg-white rounded-2xl w-full max-w-[460px] sm:max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] border border-emerald-200 transition-all duration-200"
      >
        {/* Modal Header Bar: Normal Size with Clean Title & Language Toggle & Close */}
        <div className="bg-emerald-800 text-white px-3 py-2 flex items-center justify-between border-b border-emerald-900/30 gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Printer className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-white leading-tight truncate">
              {isDraft ? (billLang === 'ta' ? 'பில் மாதிரிக்காட்சி' : 'Bill Preview') : t.billSummary}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-700 text-emerald-100 text-[9px] font-black border border-emerald-600/50 shrink-0 font-mono">
              #{bill.billNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language Switcher in Receipt Modal */}
            <div className="flex items-center bg-emerald-950/60 p-0.5 rounded-lg border border-emerald-700/50">
              <button
                type="button"
                onClick={() => setBillLang('en')}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  billLang === 'en'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="English Bill"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setBillLang('ta')}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  billLang === 'ta'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="தமிழ் பில்"
              >
                தமிழ்
              </button>
            </div>

            <button
              id="btn-close-receipt-modal"
              type="button"
              onClick={onClose}
              className="min-h-[2.2rem] min-w-[2.2rem] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {printStatus && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-3 text-center flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{printStatus}</span>
          </div>
        )}

        {/* Bill Preview Container */}
        <div className="p-2.5 sm:p-4 overflow-y-auto overflow-x-auto flex-1 bg-slate-100 flex justify-center items-start">
          <div
            id="printable-thermal-receipt"
            className="bg-white p-3.5 sm:p-5 rounded-[22px] border-2 border-slate-900 text-slate-900 font-sans w-full max-w-[420px] min-w-[335px] mx-auto shadow-sm"
          >
            {/* STORE IDENTITY: Always in English itself */}
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-wide font-sans leading-tight">
                {englishShopName}
              </h2>
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-tight mt-1 leading-snug">
                {englishAddress}
              </div>
              <div className="text-[10.5px] sm:text-xs font-black text-slate-900 mt-1 tracking-tight">
                Phone: {englishPhone} &nbsp;|&nbsp; GSTIN: {englishGst}
              </div>
            </div>

            {/* Thin Divider Line */}
            <hr className="border-t border-slate-300 my-2.5" />

            {/* HOTEL / CUSTOMER META BOX */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-left">
              {/* Left: Customer Info */}
              <div className="min-w-0 pr-1">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  {isTamil ? 'ஹோட்டல் / வாடிக்கையாளர்:' : 'HOTEL / CUSTOMER:'}
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-950 break-words mt-0.5 leading-tight">
                  {displayHotelName}
                </h3>
                {hotelPhone ? (
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Ph: {hotelPhone}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput(hotelPhone);
                        setPhoneError(null);
                        setShowPhonePrompt(true);
                      }}
                      className="text-[10px] sm:text-[10.5px] text-emerald-700 underline font-bold hover:text-emerald-900 cursor-pointer"
                    >
                      {isTamil ? 'மாற்ற' : 'Change'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput('');
                        setPhoneError(null);
                        setShowPhonePrompt(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-amber-900 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>{isTamil ? '+ போன் எண் சேர்க்க' : '+ Add Hotel Phone'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Bill No, Date, Time */}
              <div className="text-right flex flex-col justify-between pl-1">
                <div className="text-xs sm:text-sm font-black text-slate-950 whitespace-nowrap">
                  <span className="font-extrabold">{isTamil ? 'பில் எண்' : 'Bill No'}:</span> #{bill.billNumber}
                </div>
                <div className="text-[10px] sm:text-[10.5px] font-bold text-slate-600 mt-0.5 whitespace-nowrap">
                  <span className="text-slate-500">{isTamil ? 'தேதி' : 'Date'}:</span> {billDateStr}
                </div>
                {billTimeStr && (
                  <div className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 mt-0.5 whitespace-nowrap">
                    <span className="text-slate-400">{isTamil ? 'நேரம்' : 'Time'}:</span> {billTimeStr}
                  </div>
                )}
              </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-2.5">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#0f172a] text-white text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2 px-1 text-center w-[8%] border-r border-slate-700">#</th>
                    <th className="py-2 px-1.5 text-left w-[38%] border-r border-slate-700">
                      {isTamil ? 'பொருள் பெயர்' : 'ITEM NAME'}
                    </th>
                    <th className="py-2 px-1 text-center w-[20%] border-r border-slate-700">
                      {isTamil ? 'எடை (கிலோ)' : 'WEIGHT (KG)'}
                    </th>
                    <th className="py-2 px-1 text-right w-[17%] border-r border-slate-700">
                      <span className="block leading-tight">{isTamil ? 'விலை (ரூ)' : 'RATE (RS)'}</span>
                    </th>
                    <th className="py-2 px-1.5 text-right w-[17%]">
                      <span className="block leading-tight">{isTamil ? 'தொகை (ரூ)' : 'AMOUNT (RS)'}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {bill.items.map((item, idx) => {
                    const prodName = resolveItemDisplayName(item, products, billLang);
                    return (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-2 px-1 text-center font-bold text-slate-700 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-1.5 font-black text-slate-900 border-r border-slate-200 break-words leading-tight">
                          {prodName}
                        </td>
                        <td className="py-2 px-1 text-center font-bold text-slate-800 border-r border-slate-200 font-mono whitespace-nowrap text-[11px] sm:text-xs">
                          {item.kg.toFixed(2)}
                        </td>
                        <td className="py-2 px-1 text-right font-bold text-slate-700 border-r border-slate-200 font-mono text-[10.5px] sm:text-[11px]">
                          <span className="text-[9px] text-slate-500 mr-0.5">{currPrefix}</span>
                          {Math.round(item.pricePerKg)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-black text-slate-950 font-mono text-xs sm:text-sm whitespace-nowrap">
                          <span className="text-[9px] text-slate-500 mr-0.5">{currPrefix}</span>
                          {Math.round(item.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TOTAL WEIGHT ROW */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between mt-3 text-xs">
              <span className="font-black text-slate-800 uppercase tracking-wide text-[11px] sm:text-xs">
                {isTamil ? 'மொத்த எடை:' : 'TOTAL WEIGHT:'}
              </span>
              <span className="font-black text-slate-950 font-mono text-xs sm:text-sm">
                {bill.totalKg.toFixed(2)}
              </span>
            </div>

            {/* CURRENT BILL AMOUNT ROW (ONLY Current Bill Amount) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between mt-2 text-xs">
              <span className="font-black text-slate-800 tracking-wide text-[11px] sm:text-xs">
                {isTamil ? 'பில் தொகை:' : 'Current Bill Amount:'}
              </span>
              <span className="font-black text-slate-950 font-mono text-sm sm:text-base">
                {currPrefix} {billAmountInt.toLocaleString('en-IN')}
              </span>
            </div>

            {/* GRAND TOTAL BANNER: STRICTLY ONLY BILL AMOUNT */}
            <div className="bg-[#0f172a] text-white rounded-2xl p-3 text-center mt-3 shadow-sm">
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-300 block">
                {isTamil ? 'மொத்தத் தொகை' : 'GRAND TOTAL'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 tracking-tight">
                {currPrefix} {billAmountInt.toLocaleString('en-IN')}/-
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Panel */}
        <div className="p-2.5 bg-white border-t border-slate-200 space-y-1.5">
          {/* Row 1: Print Actions */}
          <div>
            <button
              id="btn-modal-bluetooth-print"
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isProcessing}
              className="w-full min-h-[2.4rem] py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer touch-manipulation"
            >
              <Printer className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="leading-normal break-words">
                {language === 'ta' ? 'புளூடூத் பிரிண்ட்' : 'Bluetooth Print'}
              </span>
            </button>
          </div>

          {/* Row 2: Digital Share Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <button
              id="btn-modal-whatsapp-share"
              type="button"
              onClick={handleWhatsAppShareClick}
              disabled={isProcessing}
              className="min-h-[2.4rem] py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer touch-manipulation"
              title={
                hotelPhone
                  ? (language === 'ta' ? `வாட்ஸ்அப்பில் அனுப்பு (${hotelPhone})` : `Share WhatsApp PDF to ${hotelPhone}`)
                  : (language === 'ta' ? 'வாட்ஸ்அப் எண் கேட்கப்பட்டு சேமிக்கப்படும்' : 'Ask hotel phone & send WhatsApp PDF')
              }
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
              <span className="leading-normal">
                {hotelPhone ? `WhatsApp PDF (${hotelPhone})` : 'WhatsApp PDF'}
              </span>
            </button>

            <button
              id="btn-modal-download-pdf"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isProcessing}
              className="min-h-[2.4rem] py-1.5 px-2.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer touch-manipulation"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-normal">Download PDF</span>
            </button>
          </div>

          {/* Confirm Save for Draft */}
          {isDraft && onConfirmSave && (
            <button
              id="btn-confirm-save-draft-bill"
              type="button"
              onClick={() => {
                onConfirmSave();
                onClose();
              }}
              className="w-full min-h-[2.4rem] py-1.5 px-2.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer touch-manipulation"
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-normal break-words">
                {language === 'ta'
                  ? 'பில் உறுதிப்படுத்தி சேமிக்க'
                  : 'Confirm & Save to Register'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Ask for Hotel Phone Number Prompt Dialog */}
      {showPhonePrompt && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border-2 border-emerald-600 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-200" />
                <span className="text-xs sm:text-sm font-black">
                  {billLang === 'ta' ? 'ஹோட்டல் வாட்ஸ்அப் எண்' : 'Hotel WhatsApp Number'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPhonePrompt(false);
                  setPhoneError(null);
                }}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-3.5 space-y-3 text-left">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                  {billLang === 'ta' ? 'வாடிக்கையாளர் / ஹோட்டல்:' : 'Customer / Hotel:'}
                </span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  {displayHotelName}
                </span>
                <span className="text-[11px] text-emerald-900 font-semibold block mt-1 leading-snug">
                  {billLang === 'ta'
                    ? 'இந்த எண் முதலீட்டு அமைப்புகளில் (Settings) சேமிக்கப்பட்டு எதிர்கால பில்களுக்குப் பயன்படுத்தப்படும்.'
                    : 'This number will be saved in Investment Settings and used for all future bills & statements.'}
                </span>
              </div>

              {/* Phone Input with +91 Prefix */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">
                  {billLang === 'ta' ? 'மொபைல் / வாட்ஸ்அப் எண் (10 இலக்கங்கள்):' : 'Mobile / WhatsApp Number (10 digits):'}
                </label>
                <div className="flex items-center border-2 border-slate-300 focus-within:border-emerald-600 rounded-xl overflow-hidden shadow-2xs">
                  <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-2 border-r border-slate-300 select-none font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      setPhoneError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSavePhoneAndShare(false);
                      }
                    }}
                    placeholder="9876543210"
                    maxLength={10}
                    autoFocus
                    className="flex-1 px-3 py-2 text-sm font-black text-slate-900 outline-none placeholder:text-slate-400 font-mono"
                  />
                </div>
                {phoneError && (
                  <div className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{phoneError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSavePhoneAndShare(false)}
                  className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer touch-manipulation"
                >
                  <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                  <span>
                    {billLang === 'ta'
                      ? 'சேமித்து வாட்ஸ்அப்பில் அனுப்பு'
                      : 'Save & Send WhatsApp Bill'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSavePhoneAndShare(true)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                  >
                    {billLang === 'ta' ? 'எண் இல்லாமல் திற' : 'Open Without Saving'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhonePrompt(false);
                      setPhoneError(null);
                    }}
                    className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    {billLang === 'ta' ? 'ரத்து' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
