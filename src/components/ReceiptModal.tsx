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
import { formatDisplayDate, formatDisplayTime, getHotelPhone } from '../utils/storage';
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

  // Bill instance enriched with up-to-date previousBalance & netTotalWithBalance
  const billWithBal = useMemo(() => {
    if (!bill) return null;
    const prev = Math.round(hotelBal);
    return {
      ...bill,
      previousBalance: prev !== 0 ? prev : undefined,
      netTotalWithBalance: prev !== 0 ? Math.round(bill.totalAmount + prev) : Math.round(bill.totalAmount),
    };
  }, [bill, hotelBal]);

  const handleBluetoothPrint = async () => {
    if (!bill) return;
    const activeBill = billWithBal || bill;
    setIsProcessing(true);
    setPrintStatus(
      billLang === 'ta'
        ? 'புளூடூத் பிரிண்டருடன் இணைகிறது...'
        : 'Connecting to Bluetooth Printer...'
    );
    try {
      const result = await printViaBluetooth(
        activeBill,
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
    const activeBill = billWithBal || bill;
    setIsProcessing(true);
    setPrintStatus(billLang === 'ta' ? 'PDF தயாராகிறது...' : 'Generating PDF...');
    try {
      const ok = await downloadBillPdf(
        activeBill,
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
    const activeBill = billWithBal || bill;
    setIsProcessing(true);
    setPrintStatus(
      billLang === 'ta'
        ? 'வாட்ஸ்அப் PDF உருவாக்கப்படுகிறது...'
        : 'Sharing WhatsApp PDF...'
    );
    try {
      const res = await shareBillAsPdfToWhatsApp(
        activeBill,
        settings,
        targetPhone,
        'printable-thermal-receipt',
        billLang,
        hotels,
        products
      );
      setPrintStatus(res.message);
      if (res.success && isDraft && onConfirmSave) {
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
    executeWhatsAppShare(cur);
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

  // Customer / Hotel Name: ALWAYS in Tamil in both English and Tamil modes as requested
  const displayHotelName = resolveHotelDisplayName(bill.hotelName, bill.hotelId, hotels, 'ta');
  const billDateStr = formatDisplayDate(bill.date, 'en');
  const billTimeStr = formatDisplayTime(bill.createdAt, 'en');
  const billAmountInt = Math.round(bill.totalAmount);
  const prevBalanceInt = Math.round(hotelBal);
  const hasPrevBalance = prevBalanceInt !== 0;
  const netTotalInt = billAmountInt + prevBalanceInt;
  const currPrefix = 'Rs.';

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
            className="bg-white p-2.5 sm:p-3.5 text-slate-900 font-sans w-full max-w-[420px] min-w-[335px] mx-auto"
          >
            {/* STORE IDENTITY: Always in English itself */}
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-wide font-sans leading-tight">
                {englishShopName}
              </h2>
              <div className="text-xs sm:text-[11px] font-black text-slate-900 uppercase tracking-tight mt-0.5 leading-snug">
                {englishAddress}
              </div>
              <div className="text-xs font-black text-slate-950 mt-0.5 tracking-tight">
                Phone: {englishPhone} &nbsp;|&nbsp; GSTIN: {englishGst}
              </div>
            </div>

            {/* Thin Divider Line */}
            <hr className="border-t-2 border-slate-950 my-1.5" />

            {/* HOTEL / CUSTOMER META (Crisp bold text, dark borders) */}
            <div className="bg-white py-1.5 px-0.5 border-t-2 border-b-2 border-slate-950 text-left">
              <div className="grid grid-cols-2 gap-1.5">
                {/* Left: Customer Info */}
                <div className="min-w-0 pr-1">
                  <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-900 block">
                    HOTEL / CUSTOMER:
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-950 break-words mt-0.5 leading-tight">
                    {displayHotelName}
                  </h3>
                </div>

                {/* Right: Bill No, Date, Time */}
                <div className="text-right flex flex-col justify-start pl-1">
                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-950 whitespace-nowrap">
                      <span className="font-black">Bill No:</span> #{bill.billNumber}
                    </div>
                    <div className="text-[10.5px] sm:text-[11px] font-black text-slate-900 mt-0.5 whitespace-nowrap">
                      <span className="text-slate-800">Date:</span> {billDateStr}
                    </div>
                    {billTimeStr && (
                      <div className="text-[10px] sm:text-[10.5px] font-black text-slate-800 mt-0.5 whitespace-nowrap">
                        <span className="text-slate-700">Time:</span> {billTimeStr}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TOP OLD BALANCE: Big & Prominent */}
              {hasPrevBalance && (
                <div className="mt-2 pt-1.5 pb-1 px-2.5 rounded-lg bg-rose-50 border-2 border-rose-600 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-950">
                    OLD BALANCE:
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-rose-700 tracking-tight">
                    Rs. {prevBalanceInt.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* ITEMS TABLE - Clear Visible Table with Dark Black Borders and Bold Text */}
            <div className="mt-1.5">
              <table className="w-full text-left border-collapse table-fixed border-2 border-slate-950">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider border-b-2 border-slate-950">
                    <th className="py-1 px-1 text-center w-[7%] border border-slate-950 font-black">#</th>
                    <th className="py-1 px-1.5 text-left w-[33%] border border-slate-950 font-black">
                      ITEM NAME
                    </th>
                    <th className="py-1 px-1 text-center w-[18%] border border-slate-950 font-black">
                      WEIGHT (KG)
                    </th>
                    <th className="py-1 px-1 text-right w-[18%] border border-slate-950 font-black">
                      <span className="block leading-tight">RATE (RS)</span>
                    </th>
                    <th className="py-1 px-1.5 text-right w-[24%] border border-slate-950 font-black">
                      <span className="block leading-tight">AMOUNT (RS)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {bill.items.map((item, idx) => {
                    const prodName = resolveItemDisplayName(item, products, 'ta');
                    return (
                      <tr key={idx} className="bg-white">
                        <td className="py-1 px-1 text-center font-black text-slate-950 border border-slate-950 text-xs sm:text-sm">
                          {idx + 1}
                        </td>
                        <td className="py-1 px-1.5 font-black text-slate-950 border border-slate-950 break-words leading-tight text-xs sm:text-sm">
                          {prodName}
                        </td>
                        <td className="py-1 px-1 text-center font-black text-slate-950 border border-slate-950 font-mono whitespace-nowrap text-sm sm:text-base">
                          {item.kg.toFixed(2)}
                        </td>
                        <td className="py-1 px-1 text-right font-black text-slate-950 border border-slate-950 font-mono text-sm sm:text-base">
                          {Math.round(item.pricePerKg)}
                        </td>
                        <td className="py-1 px-1.5 text-right font-black text-slate-950 border border-slate-950 font-mono text-base sm:text-lg whitespace-nowrap">
                          {Math.round(item.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* BILL AMOUNT & PREVIOUS BALANCE SUMMARY (White Background, No Box, Big Amounts & Bold) */}
            <div className="bg-white px-1 py-1 mt-1 divide-y divide-slate-300 text-xs">
              <div className="flex items-center justify-between py-1.5">
                <span className="font-black text-slate-950 tracking-wide text-xs sm:text-sm">
                  Current Bill Amount:
                </span>
                <span className="font-black text-slate-950 font-mono text-base sm:text-lg">
                  Rs. {billAmountInt.toLocaleString('en-IN')}
                </span>
              </div>
              {hasPrevBalance && (
                <div className="flex items-center justify-between py-1.5 text-rose-900">
                  <span className="font-black tracking-wide text-xs sm:text-sm">
                    Previous Balance:
                  </span>
                  <span className="font-black font-mono text-base sm:text-lg text-rose-800">
                    Rs. {prevBalanceInt.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* GRAND TOTAL: Clean White Background with Crisp Double Dark Border, Extra Big Amount */}
            <div className="bg-white py-2 px-2 text-center mt-1 border-t-2 border-b-2 border-slate-950">
              <span className="text-xs font-black tracking-widest uppercase text-slate-900 block leading-tight">
                {hasPrevBalance ? 'TOTAL PAYABLE DUE' : 'GRAND TOTAL'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono mt-0.5 tracking-tight leading-tight">
                Rs. {netTotalInt.toLocaleString('en-IN')}/-
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
                Bluetooth Print
              </span>
            </button>
          </div>

          {/* Row 2: Digital Share Actions */}
          <div>
            <button
              id="btn-modal-whatsapp-share"
              type="button"
              onClick={handleWhatsAppShareClick}
              disabled={isProcessing}
              className="w-full min-h-[2.4rem] py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer touch-manipulation"
              title={
                hotelPhone
                  ? `Share WhatsApp PDF to ${hotelPhone}`
                  : (language === 'ta' ? 'வாட்ஸ்அப் PDF அனுப்பு' : 'Share WhatsApp PDF')
              }
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
              <span className="leading-normal">
                {language === 'ta' ? 'வாட்ஸ்அப் PDF' : 'WhatsApp PDF'}
              </span>
            </button>
          </div>

          {/* Row 3: Optional Direct Save to History when Draft */}
          {isDraft && onConfirmSave && (
            <div>
              <button
                id="btn-modal-save-draft"
                type="button"
                onClick={onConfirmSave}
                disabled={isProcessing}
                className="w-full min-h-[2.4rem] py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer touch-manipulation"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />
                <span className="leading-normal">
                  {language === 'ta' ? 'பதிவேட்டில் சேமி' : 'Save to History'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
