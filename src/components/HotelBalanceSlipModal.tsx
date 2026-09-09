import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
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
  const upiId = settings.upiId || 'NAZIRAHAMED0003@okhdfcbank';
  const balanceInt = Math.round(hotelStats.balance);
  const hotelDisplayName = language === 'ta' && hotel.nameTa ? hotel.nameTa : hotel.nameEn;

  // Calculate UPI pay URI for balance
  const upiPayUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    settings.shopName || 'SSS Chicken'
  )}&am=${Math.max(0, balanceInt)}&cu=INR&tn=${encodeURIComponent(`Balance ${hotel.nameEn}`)}`;

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
    recentBills: hotelStats.hotelBills.slice(0, 4).map((b) => ({
      billNumber: b.billNumber,
      date: b.date,
      amount: b.totalAmount,
      kg: b.totalKg,
    })),
    recentPayments: hotelStats.hotelPayments.slice(0, 3).map((p) => ({
      date: p.date,
      amount: p.amount,
      mode: p.paymentMode,
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
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="hotel-balance-slip-modal-container"
        className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-emerald-200"
      >
        {/* Top Header Controls */}
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-200" />
            <div>
              <span className="text-sm font-bold text-white block leading-tight">
                {language === 'ta' ? 'பாக்கி கணக்கு ரசீது' : 'Hotel Balance Bill Slip'}
              </span>
              <span className="text-[10px] text-emerald-200 font-medium">
                {hotelDisplayName}
              </span>
            </div>
          </div>
          <button
            id="btn-close-balance-slip-modal"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
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
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50 flex justify-center">
          <div
            id="printable-hotel-statement"
            className="w-full bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-gray-900 font-sans leading-tight text-xs max-w-[340px]"
          >
            {/* Header: Shop Name & Details */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <h2 className="text-base font-black uppercase text-gray-900 tracking-tight">
                {shopName}
              </h2>
              {shopAddress && (
                <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">
                  {shopAddress}
                </p>
              )}
              <p className="text-[11px] font-bold text-gray-800 mt-1">
                Cell: {settings.phoneNumber || '8680000003'}
              </p>
              {settings.gstNumber && (
                <p className="text-[10px] font-mono text-gray-700">
                  GST: {settings.gstNumber}
                </p>
              )}
            </div>

            {/* Statement Meta Box */}
            <div className="py-2.5 border-b border-dashed border-gray-300 text-[11px] space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-800">REF: {statementRefNumber}</span>
                <span>{formatDisplayDate(new Date().toISOString().slice(0, 10))}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="font-bold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-700" />
                  {hotelDisplayName}
                </span>
                <span className="text-[10px] text-gray-500">
                  {formatDisplayTime(new Date().toISOString())}
                </span>
              </div>
              {customPhone && (
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{customPhone}</span>
                </div>
              )}
            </div>

            {/* Statement Type Banner */}
            <div className="py-2 text-center bg-slate-100 rounded-lg my-2 border border-slate-200">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block">
                {language === 'ta' ? 'பாக்கி கணக்கு பட்டியல்' : 'HOTEL BALANCE STATEMENT'}
              </span>
            </div>

            {/* Ledger Overview Summary */}
            <div className="py-2 border-b border-dashed border-gray-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-700 font-medium">
                <span>Total Bills ({hotelStats.hotelBills.length}):</span>
                <span className="font-bold text-gray-900">
                  ₹{Math.round(hotelStats.totalBilled).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 pl-2">
                <span>Total Weight:</span>
                <span>{hotelStats.totalKg.toFixed(2)} Kg</span>
              </div>

              {hotelStats.totalBalAdded > 0 && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Balance Added (+):</span>
                  <span className="font-bold text-amber-900">
                    +₹{Math.round(hotelStats.totalBalAdded).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Total Paid ({hotelStats.hotelPayments.filter((p) => p.type !== 'balance_add').length} payments):</span>
                <span className="font-bold text-emerald-900">
                  -₹{Math.round(hotelStats.totalPaid).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Big High-Contrast Balance Banner */}
              <div className={`mt-2 p-2.5 rounded-xl border text-center ${
                balanceInt > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : balanceInt === 0
                  ? 'bg-teal-50 border-teal-300 text-teal-950'
                  : 'bg-sky-50 border-sky-300 text-sky-950'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                  {balanceInt > 0
                    ? (language === 'ta' ? 'செலுத்த வேண்டிய மீதி பாக்கி' : 'NET BALANCE TO PAY')
                    : balanceInt === 0
                    ? (language === 'ta' ? 'கணக்கு முழுவதும் தீர்க்கப்பட்டது' : 'BALANCE SETTLED')
                    : (language === 'ta' ? 'முன்பணம் உள்ளது' : 'ADVANCE BALANCE')}
                </span>
                <div className="text-xl font-black tracking-tight">
                  ₹{Math.abs(balanceInt).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Recent Transactions Snippet */}
            {hotelStats.hotelBills.length > 0 && (
              <div className="py-2 border-b border-dashed border-gray-300">
                <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                  {language === 'ta' ? 'சமீபத்திய பில்கள்' : 'Recent Transactions'}
                </div>
                <div className="space-y-1 text-[10px]">
                  {hotelStats.hotelBills.slice(0, 3).map((b) => (
                    <div key={b.id} className="flex justify-between text-gray-700">
                      <span>#{b.billNumber} • {formatDisplayDate(b.date)} ({b.totalKg.toFixed(1)}kg)</span>
                      <span className="font-bold text-gray-900">₹{Math.round(b.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UPI QR Code Canvas (Scan to Pay Balance) */}
            {balanceInt > 0 && (
              <div className="pt-3 text-center space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                  Scan to Pay Balance via UPI
                </p>
                <div className="flex justify-center p-1.5 bg-white inline-block mx-auto rounded-lg border border-gray-200 shadow-2xs">
                  <QRCodeCanvas
                    id="hotel-balance-upi-qr-canvas"
                    value={upiPayUri}
                    size={96}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[10px] font-mono text-gray-700 font-bold">
                  UPI: {upiId}
                </p>
                <p className="text-[9px] text-gray-500">
                  GPay • PhonePe • Paytm • BHIM
                </p>
              </div>
            )}

            <div className="pt-2 text-center border-t border-dashed border-gray-300 mt-3">
              <p className="text-[9px] font-semibold text-gray-500">
                Thank you for your business! • நன்றி, மீண்டும் வருக!
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Phone Number Config Strip */}
        <div className="px-3.5 py-2 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>{language === 'ta' ? 'வாட்ஸ்அப் எண்:' : 'WhatsApp:'}</span>
          </div>

          {isEditingPhone ? (
            <div className="flex items-center gap-1">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="9876543210"
                className="w-32 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsEditingPhone(false)}
                className="px-2 py-1 bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-emerald-950">
                {customPhone || (language === 'ta' ? 'எண் இல்லை' : 'Not set')}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingPhone(true)}
                className="text-[10px] text-emerald-700 underline font-semibold cursor-pointer"
              >
                {customPhone ? (language === 'ta' ? 'மாற்று' : 'Edit') : (language === 'ta' ? 'சேர்' : 'Add')}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Panel (Identical to Bill Receipt Modal) */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* WhatsApp PDF Share */}
            <button
              id="btn-modal-hotel-balance-whatsapp"
              type="button"
              onClick={handleWhatsAppShare}
              disabled={isProcessing}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>WhatsApp PDF</span>
            </button>

            {/* Bluetooth Thermal Print */}
            <button
              id="btn-modal-hotel-balance-bluetooth"
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isProcessing}
              className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>{t.bluetoothPrint}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Download PDF */}
            <button
              id="btn-modal-hotel-balance-download"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isProcessing}
              className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="truncate">PDF</span>
            </button>

            {/* System Print */}
            <button
              id="btn-modal-hotel-balance-system-print"
              type="button"
              onClick={handleSystemPrint}
              className="py-2 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="truncate">{t.systemPrint}</span>
            </button>

            {/* Copy Message */}
            <button
              id="btn-modal-hotel-balance-copy-text"
              type="button"
              onClick={handleCopyMessage}
              className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200 transition-all cursor-pointer"
              title="Copy WhatsApp text"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-700" />
              <span className="truncate">{language === 'ta' ? 'நகல்' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
