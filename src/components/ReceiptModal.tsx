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
} from 'lucide-react';
import { Bill, getShopDisplayAddress, getShopDisplayName, HotelItem, LanguageCode, ProductItem, ShopSettings } from '../types';
import { printThermalReceiptViaBluetooth } from '../utils/bluetoothPrinter';
import { formatDisplayDate, formatDisplayTime } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { downloadBillPdf, shareBillAsPdfToWhatsApp } from '../utils/whatsapp';

interface ReceiptModalProps {
  isOpen: boolean;
  bill: Bill | null;
  isDraft?: boolean;
  settings: ShopSettings;
  language: LanguageCode;
  hotels?: HotelItem[];
  products?: ProductItem[];
  onConfirmSave?: () => void;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  bill,
  isDraft = false,
  settings,
  language,
  hotels = [],
  products = [],
  onConfirmSave,
  onClose,
}) => {
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!isOpen || !bill) return null;

  const shopName = getShopDisplayName(settings, language);
  const shopAddress = getShopDisplayAddress(settings, language);
  const upiId = settings.upiId || 'NAZIRAHAMED0003@okhdfcbank';

  // Calculate UPI pay URI
  const finalPayable = Math.round(
    bill.previousBalance !== undefined && bill.previousBalance !== 0
      ? (bill.netTotalWithBalance ?? (bill.totalAmount + bill.previousBalance))
      : bill.totalAmount
  );
  const upiPayUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    settings.shopName || 'SSS Chicken'
  )}&am=${finalPayable}&cu=INR&tn=${encodeURIComponent(`Bill #${bill.billNumber}`)}`;

  // Find customer phone if registered
  const matchedHotel = hotels.find(
    (h) =>
      h.nameEn.toLowerCase() === bill.hotelName.toLowerCase() ||
      h.nameTa.toLowerCase() === bill.hotelName.toLowerCase() ||
      (bill.hotelId && h.id === bill.hotelId)
  );
  const recipientPhone = matchedHotel?.phone || '';

  const handleBluetoothPrint = async () => {
    setIsProcessing(true);
    setPrintStatus(language === 'ta' ? 'புளூடூத் பிரிண்டருடன் இணைக்கிறது...' : 'Connecting to Bluetooth printer...');
    try {
      const result = await printThermalReceiptViaBluetooth(bill, settings, 'printable-thermal-receipt');
      if (result.success) {
        setPrintStatus(language === 'ta' ? 'வெற்றிகரமாக அச்சிடப்பட்டது!' : 'Printed successfully!');
        if (isDraft && onConfirmSave) {
          onConfirmSave();
        }
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
    if (isDraft && onConfirmSave) {
      onConfirmSave();
    }
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    setPrintStatus(language === 'ta' ? 'PDF தயாராகிறது...' : 'Generating PDF...');
    try {
      const ok = await downloadBillPdf(
        bill,
        settings,
        recipientPhone,
        'printable-thermal-receipt',
        language,
        hotels,
        products
      );
      if (ok) {
        setPrintStatus(language === 'ta' ? 'PDF பதிவிறக்கம் செய்யப்பட்டது!' : 'PDF downloaded!');
        if (isDraft && onConfirmSave) {
          onConfirmSave();
        }
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
    setPrintStatus(language === 'ta' ? 'வாட்ஸ்அப் PDF உருவாக்கப்படுகிறது...' : 'Sharing WhatsApp PDF...');
    try {
      const res = await shareBillAsPdfToWhatsApp(
        bill,
        settings,
        recipientPhone,
        'printable-thermal-receipt',
        language,
        hotels,
        products
      );
      setPrintStatus(res.message);
      if (isDraft && onConfirmSave) {
        onConfirmSave();
      }
    } catch {
      setPrintStatus(language === 'ta' ? 'பகிர்வதில் பிழை' : 'Share failed');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPrintStatus(null), 4000);
    }
  };

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="receipt-modal-container"
        className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-emerald-200"
      >
        {/* Top Header Controls */}
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-200" />
            <span className="text-sm font-bold text-white">
              {isDraft ? (language === 'ta' ? 'பில் மாதிரிக்காட்சி' : 'Bill Preview') : t.billSummary}
            </span>
          </div>
          <button
            id="btn-close-receipt-modal"
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

        {/* Printable Receipt Paper Container */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50 flex justify-center">
          <div
            id="printable-thermal-receipt"
            className="w-full bg-white p-4 rounded-xl shadow-xs border border-gray-200 text-gray-900 font-sans leading-tight text-xs max-w-[340px]"
          >
            {/* Header: Shop Name & Details */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <h2 className="text-base font-black uppercase text-gray-900 tracking-tight">
                {shopName}
              </h2>
              <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">
                {shopAddress}
              </p>
              <p className="text-[11px] font-bold text-gray-800 mt-1">
                Cell: {settings.phoneNumber || '8680000003'}
              </p>
              {settings.gstNumber && (
                <p className="text-[10px] font-mono text-gray-700">
                  GST: {settings.gstNumber}
                </p>
              )}
            </div>

            {/* Bill Meta: Bill #, Date, Time, Hotel */}
            <div className="py-2.5 border-b border-dashed border-gray-300 text-[11px] space-y-1">
              <div className="flex justify-between font-bold">
                <span>Bill No: #{bill.billNumber}</span>
                <span>{formatDisplayDate(bill.date)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="font-bold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-700" />
                  {bill.hotelName}
                </span>
                <span className="text-[10px] text-gray-500">
                  {formatDisplayTime(bill.createdAt)}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-2 border-b border-dashed border-gray-300">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 font-bold text-gray-700">
                    <th className="pb-1 text-left">Item</th>
                    <th className="pb-1 text-right">Rate</th>
                    <th className="pb-1 text-right">Kg</th>
                    <th className="pb-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {bill.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1 text-left max-w-[120px] truncate">
                        {item.productName}
                      </td>
                      <td className="py-1 text-right text-gray-600">
                        {Math.round(item.pricePerKg)}
                      </td>
                      <td className="py-1 text-right font-bold text-gray-800">
                        {item.kg.toFixed(2)}
                      </td>
                      <td className="py-1 text-right font-black text-gray-900">
                        ₹{Math.round(item.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary: Total KG & Total Amount */}
            <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-gray-700">
                <span>Total Weight:</span>
                <span>{bill.totalKg.toFixed(2)} Kg</span>
              </div>
              <div className="flex justify-between font-black text-sm text-emerald-950 pt-0.5">
                <span>Bill Amount:</span>
                <span>₹{Math.round(bill.totalAmount).toLocaleString('en-IN')}</span>
              </div>

              {/* Previous Balance if applicable */}
              {bill.previousBalance !== undefined && bill.previousBalance !== 0 && (
                <>
                  <div className="flex justify-between text-[11px] font-bold text-amber-800 pt-1">
                    <span>Previous Balance:</span>
                    <span>₹{Math.round(bill.previousBalance).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-black text-base text-gray-950 pt-1 border-t border-gray-200">
                    <span>Net Payable:</span>
                    <span>₹{finalPayable.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
            </div>

            {/* UPI QR Code Canvas */}
            <div className="pt-3 text-center space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                Scan to Pay via UPI
              </p>
              <div className="flex justify-center p-1 bg-white inline-block mx-auto rounded-lg border border-gray-200">
                <QRCodeCanvas
                  id="bill-upi-qr-canvas"
                  value={upiPayUri}
                  size={100}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[10px] font-mono text-gray-600">
                UPI: {upiId}
              </p>
              <p className="text-[9px] font-semibold text-gray-500 pt-1">
                Thank you, visit again! • நன்றி, மீண்டும் வருக!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Panel */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Bluetooth Thermal Print */}
            <button
              id="btn-modal-bluetooth-print"
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isProcessing}
              className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>{t.bluetoothPrint}</span>
            </button>

            {/* WhatsApp PDF */}
            <button
              id="btn-modal-whatsapp-share"
              type="button"
              onClick={handleWhatsAppShare}
              disabled={isProcessing}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>WhatsApp PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* System Print */}
            <button
              id="btn-modal-system-print"
              type="button"
              onClick={handleSystemPrint}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.systemPrint}</span>
            </button>

            {/* Download PDF */}
            <button
              id="btn-modal-download-pdf"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isProcessing}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
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
              className="w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'ta' ? 'பில் உறுதிப்படுத்தி சேமிக்க' : 'Confirm & Save to Register'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
