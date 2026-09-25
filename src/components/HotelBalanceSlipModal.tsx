import React, { useState } from 'react';
import {
  X,
  Printer,
  Bluetooth,
  MessageCircle,
  Download,
  Check,
  Building2,
  Calendar,
  IndianRupee,
  Share2,
  Copy,
  Phone,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
} from 'lucide-react';
import { Bill, getShopDisplayAddress, getShopDisplayName, HotelItem, HotelPayment, LanguageCode, ShopSettings } from '../types';
import { printThermalReceiptViaBluetooth } from '../utils/bluetoothPrinter';
import { formatDisplayDate, formatDisplayTime } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import {
  downloadHotelStatementPdf,
  generateHotelBalanceWhatsAppText,
  HotelBalanceShareData,
  openWhatsAppChatWithText,
  shareHotelStatementAsPdfToWhatsApp,
} from '../utils/whatsapp';

export interface HotelBalanceSlipModalProps {
  isOpen: boolean;
  hotel: HotelItem;
  hotelStats: {
    totalBilled: number;
    totalPaid: number;
    totalBalAdded: number;
    balance: number;
    totalKg: number;
    hotelBills: Bill[];
    hotelPayments: HotelPayment[];
  };
  settings: ShopSettings;
  language: LanguageCode;
  onClose: () => void;
}

export const HotelBalanceSlipModal: React.FC<HotelBalanceSlipModalProps> = ({
  isOpen,
  hotel,
  hotelStats,
  settings,
  language,
  onClose,
}) => {
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPhone, setCustomPhone] = useState(hotel.phone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!isOpen) return null;

  const shopName = getShopDisplayName(settings, language);
  const shopAddress = getShopDisplayAddress(settings, language);
  const balanceInt = Math.round(hotelStats.balance);
  const hotelDisplayName = language === 'ta' && hotel.nameTa ? hotel.nameTa : hotel.nameEn;

  const sortedPayments = [...hotelStats.hotelPayments]
    .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  const actualPayments = sortedPayments.filter((p) => p.type !== 'balance_add');
  const lastTwoPayments = (actualPayments.length > 0 ? actualPayments : sortedPayments).slice(0, 2);

  const now = new Date();
  const statementTime = formatDisplayTime(now.toISOString(), language);

  const statementData: HotelBalanceShareData = {
    hotelName: hotel.nameEn,
    hotelNameTa: hotel.nameTa,
    hotelPhone: customPhone || hotel.phone,
    totalBilled: hotelStats.totalBilled,
    totalPaid: hotelStats.totalPaid,
    totalBalAdded: hotelStats.totalBalAdded,
    balance: hotelStats.balance,
    totalKg: hotelStats.totalKg,
    billCount: hotelStats.hotelBills.length,
    paymentCount: hotelStats.hotelPayments.filter((p) => p.type !== 'balance_add').length,
    statementTime,
    recentBills: hotelStats.hotelBills.slice(0, 4).map((b) => ({
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

  const handleBluetoothPrint = async () => {
    setIsProcessing(true);
    setPrintStatus(language === 'ta' ? 'புளூடூத் பிரிண்டருடன் இணைக்கிறது...' : 'Connecting to Bluetooth printer...');
    try {
      // Dummy bill object to satisfy the signature; rasterizer uses elementId 'printable-hotel-statement'
      const dummyBill = hotelStats.hotelBills[0] || ({
        id: 'stmt',
        billNumber: 1,
        date: new Date().toISOString().slice(0, 10),
        items: [],
        totalKg: hotelStats.totalKg,
        totalAmount: hotelStats.balance,
        hotelName: hotel.nameEn,
        createdAt: new Date().toISOString(),
      } as any);

      const result = await printThermalReceiptViaBluetooth(dummyBill, settings, 'printable-hotel-statement');
      if (result.success) {
        setPrintStatus(language === 'ta' ? 'வெற்றிகரமாக அச்சிடப்பட்டது!' : 'Statement printed successfully!');
      } else {
        setPrintStatus(result.message || (language === 'ta' ? 'அச்சிட முடியவில்லை' : 'Print failed'));
      }
    } catch (err: any) {
      setPrintStatus(err?.message || 'Print error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPrintStatus(null), 4000);
    }
  };

  const handleSystemPrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    setPrintStatus(language === 'ta' ? 'PDF தயாராகிறது...' : 'Generating Statement PDF...');
    try {
      const ok = await downloadHotelStatementPdf(
        statementData,
        settings,
        'printable-hotel-statement',
        language
      );
      if (ok) {
        setPrintStatus(language === 'ta' ? 'PDF பதிவிறக்கம் செய்யப்பட்டது!' : 'Statement PDF downloaded!');
      }
    } catch {
      setPrintStatus(language === 'ta' ? 'PDF பிழை ஏற்பட்டது' : 'Error generating PDF');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPrintStatus(null), 3500);
    }
  };

  const handleWhatsAppShare = async () => {
    setIsProcessing(true);
    setPrintStatus(language === 'ta' ? 'வாட்ஸ்அப் PDF உருவாக்கப்படுகிறது...' : 'Sharing Statement to WhatsApp...');
    try {
      const res = await shareHotelStatementAsPdfToWhatsApp(
        statementData,
        settings,
        'printable-hotel-statement',
        language
      );
      setPrintStatus(res.message);
    } catch {
      setPrintStatus(language === 'ta' ? 'பகிர்வதில் பிழை' : 'Share failed');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPrintStatus(null), 4000);
    }
  };

  const handleCopyMessage = () => {
    const text = generateHotelBalanceWhatsAppText(statementData, settings, language);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  const statementRefNumber = `STMT-${hotel.id.slice(0, 5).toUpperCase()}-${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;

  return (
    <div
      id="hotel-balance-slip-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="hotel-balance-slip-modal-container"
        className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] border border-emerald-200"
      >
        {/* Top Header Controls */}
        <div className="bg-emerald-800 text-white p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Receipt className="w-4 h-4 text-emerald-200 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-black text-white block leading-tight break-words">
                {language === 'ta' ? 'பாக்கி கணக்கு ரசீது' : 'Hotel Balance Bill Slip'}
              </span>
              <span className="text-[10px] text-emerald-200 font-bold block break-words leading-tight">
                {hotelDisplayName}
              </span>
            </div>
          </div>
          <button
            id="btn-close-balance-slip-modal"
            type="button"
            onClick={onClose}
            className="min-h-[2.2rem] min-w-[2.2rem] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Toast */}
        {printStatus && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-3 text-center flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{printStatus}</span>
          </div>
        )}

        {copiedToast && (
          <div className="bg-slate-800 text-white text-xs font-bold py-2 px-3 text-center flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ta' ? 'வாட்ஸ்அப் செய்தி நகலெடுக்கப்பட்டது!' : 'WhatsApp text copied to clipboard!'}</span>
          </div>
        )}

        {/* Printable Receipt Paper Container (Same styling like thermal bill) */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-start">
          <div
            id="printable-hotel-statement"
            className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-slate-300 shadow-sm text-gray-900 font-sans leading-tight text-xs max-w-[320px] select-none space-y-3"
          >
            {/* Header: Shop Name & Subtitle */}
            <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
              <h2 className="text-sm sm:text-base font-black uppercase text-gray-900 tracking-wide">
                {shopName}
              </h2>
              {(settings.addressEn || settings.address) && (
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                  {settings.addressEn || settings.address}
                </p>
              )}
              {settings.phoneNumber && (
                <p className="text-[10.5px] font-bold text-gray-700 mt-0.5">
                  Ph: {settings.phoneNumber}
                  {settings.gstNumber && ` | GST: ${settings.gstNumber}`}
                </p>
              )}
            </div>

            {/* Statement Pill Badge */}
            <div className="bg-slate-100 py-1 px-2 rounded-lg text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                {language === 'ta' ? 'பாக்கி கணக்கு விவரம்' : 'BALANCE STATEMENT'}
              </span>
            </div>

            {/* Hotel Name, Date & Time */}
            <div className="py-2 border-b border-dashed border-slate-300 flex justify-between items-center text-xs font-bold text-gray-800 gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-black text-gray-900 block truncate">
                  {hotelDisplayName}
                </span>
                {statementData.hotelPhone && (
                  <span className="text-[10px] text-gray-500 font-medium block">
                    Ph: {statementData.hotelPhone}
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-gray-800 font-bold block">
                  {formatDisplayDate(new Date().toISOString().slice(0, 10), language)}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold block">
                  {statementTime}
                </span>
              </div>
            </div>

            {/* Balance Amount Box */}
            <div>
              <div
                className={`p-3.5 rounded-xl border text-center ${
                  balanceInt > 0
                    ? 'bg-rose-50/80 border-rose-300'
                    : balanceInt === 0
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-sky-50/80 border-sky-300'
                }`}
              >
                <span
                  className={`text-[10.5px] font-black uppercase tracking-wider block mb-1 ${
                    balanceInt > 0
                      ? 'text-rose-700'
                      : balanceInt === 0
                      ? 'text-emerald-700'
                      : 'text-sky-700'
                  }`}
                >
                  {balanceInt > 0
                    ? (language === 'ta' ? 'மீதி செலுத்த வேண்டிய பாக்கி' : 'NET BALANCE DUE')
                    : balanceInt === 0
                    ? (language === 'ta' ? 'கணக்கு முடிந்தது' : 'ACCOUNT FULLY SETTLED')
                    : (language === 'ta' ? 'முன்பணம்' : 'ADVANCE CREDIT')}
                </span>
                <div className="text-2xl font-black text-gray-950 flex items-center justify-center gap-0.5">
                  <span className="text-xl">₹</span>
                  <span>{Math.abs(balanceInt).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Last 2 Payments History */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-700 pb-1 border-b border-slate-200">
                <span>{language === 'ta' ? 'கடைசி 2 வரவுகள்' : 'LAST 2 PAYMENTS'}</span>
                <span className="text-[9px] font-bold text-emerald-700">{language === 'ta' ? 'வரவு வரலாறு' : 'History'}</span>
              </div>
              {statementData.recentPayments && statementData.recentPayments.length > 0 ? (
                <div className="divide-y divide-slate-200/70 text-xs">
                  {statementData.recentPayments.slice(0, 2).map((p, idx) => (
                    <div key={idx} className="py-1 flex items-center justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10.5px] font-bold text-slate-800">
                            {formatDisplayDate(p.date, language)}
                          </span>
                          {p.time && (
                            <span className="text-[9px] font-medium text-slate-500">
                              {p.time}
                            </span>
                          )}
                          {p.mode && (
                            <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase">
                              {p.mode}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-mono font-black text-emerald-800 text-right text-xs">
                        ₹{Math.round(p.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 py-1 text-center font-medium">
                  {language === 'ta' ? 'முந்தைய வரவு எதுவும் இல்லை' : 'No previous payments recorded'}
                </div>
              )}
            </div>

            {/* UPI Payment strip if due */}
            {balanceInt > 0 && (settings.phoneNumber || settings.upiId) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg py-1.5 px-2 text-center">
                <span className="text-[10px] font-bold text-amber-900 block">
                  UPI / GPay / PhonePe: <span className="font-mono font-black">{settings.phoneNumber || settings.upiId}</span>
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="pt-1 text-center border-t border-dashed border-slate-200">
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'ta' ? 'நன்றி! மீண்டும் வருக!' : 'Thank you for your business!'}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Phone Number Config Strip */}
        <div className="px-3.5 py-2.5 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between text-xs gap-2 flex-wrap min-h-[3rem]">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold leading-normal">
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600 flex-shrink-0" />
            <span>{language === 'ta' ? 'வாட்ஸ்அப் எண்:' : 'WhatsApp:'}</span>
          </div>

          {isEditingPhone ? (
            <div className="flex items-center gap-1.5">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="9876543210"
                className="w-32 min-h-[3rem] px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsEditingPhone(false)}
                className="min-h-[3rem] px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer touch-manipulation flex items-center justify-center"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-emerald-950 leading-none">
                {customPhone || (language === 'ta' ? 'எண் இல்லை' : 'Not set')}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingPhone(true)}
                className="min-h-[2.2rem] px-1.5 text-xs text-emerald-700 underline font-bold cursor-pointer touch-manipulation flex items-center"
              >
                {customPhone ? (language === 'ta' ? 'மாற்று' : 'Edit') : (language === 'ta' ? 'சேர்' : 'Add')}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Panel (Identical to Bill Receipt Modal) */}
        <div className="p-2.5 bg-white border-t border-slate-200 space-y-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {/* WhatsApp PDF Share */}
            <button
              id="btn-modal-hotel-balance-whatsapp"
              type="button"
              onClick={handleWhatsAppShare}
              disabled={isProcessing}
              className="min-h-[2.4rem] py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer touch-manipulation"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white flex-shrink-0" />
              <span className="leading-normal">WhatsApp PDF</span>
            </button>

            {/* Bluetooth Thermal Print */}
            <button
              id="btn-modal-hotel-balance-bluetooth"
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isProcessing}
              className="min-h-[2.4rem] py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer touch-manipulation"
            >
              <Bluetooth className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="leading-normal">{t.bluetoothPrint}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Download PDF */}
            <button
              id="btn-modal-hotel-balance-download"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isProcessing}
              className="min-h-[2.4rem] py-1.5 px-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation"
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="leading-normal">PDF</span>
            </button>

            {/* System Print */}
            <button
              id="btn-modal-hotel-balance-system-print"
              type="button"
              onClick={handleSystemPrint}
              className="min-h-[2.4rem] py-1.5 px-1.5 bg-slate-800 hover:bg-slate-900 active:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation"
            >
              <Printer className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="leading-normal">{t.systemPrint}</span>
            </button>

            {/* Copy Message */}
            <button
              id="btn-modal-hotel-balance-copy-text"
              type="button"
              onClick={handleCopyMessage}
              className="min-h-[2.4rem] py-1.5 px-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200 transition-all cursor-pointer touch-manipulation"
              title="Copy WhatsApp text"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
              <span className="leading-normal">{language === 'ta' ? 'நகல்' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
