import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  Edit2,
  Save,
} from 'lucide-react';
import { Bill, ShopSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { printBillViaBluetooth, formatBillReceiptText } from '../utils/bluetoothPrinter';
import { updateBill, loadHotels } from '../utils/storage';

interface ReceiptModalProps {
  bill: Bill | null;
  settings: ShopSettings;
  language: Language;
  onClose: () => void;
  onBillUpdated?: (updatedBill: Bill) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  bill: initialBill,
  settings,
  language,
  onClose,
  onBillUpdated,
}) => {
  const [bill, setBill] = useState<Bill | null>(initialBill);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printing, setPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingHotel, setIsEditingHotel] = useState(false);
  const [editHotelName, setEditHotelName] = useState(initialBill?.hotelName || '');
  const [editHotelPhone, setEditHotelPhone] = useState(initialBill?.hotelPhone || settings.phoneNumber || '');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const hotelList = loadHotels();

  if (!bill) return null;

  const handleSaveHotelInfo = () => {
    const updated: Bill = {
      ...bill,
      hotelName: editHotelName.trim() || undefined,
      hotelPhone: editHotelPhone.trim() || undefined,
    };
    setBill(updated);
    updateBill(updated);
    if (onBillUpdated) onBillUpdated(updated);
    setIsEditingHotel(false);
    setStatusMessage('Hotel info updated');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleBluetoothPrint = async () => {
    setPrinting(true);
    setStatusMessage(null);
    try {
      const result = await printBillViaBluetooth(bill, settings, language);
      setStatusMessage(result.message);
    } catch (e: any) {
      setStatusMessage(e?.message || 'Bluetooth printing failed');
    } finally {
      setPrinting(false);
    }
  };

  const handleSystemPrint = () => {
    const style = document.createElement('style');
    style.id = 'print-page-size-style';
    style.innerHTML = '@page { size: 80mm auto; margin: 0mm !important; }';
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('print-page-size-style');
      if (el) el.remove();
    }, 1000);
  };

  const handleCopyReceipt = () => {
    const text = formatBillReceiptText(bill, settings, language);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayHotelName = (bill.hotelName || settings.shopName || 'HOTEL').toUpperCase();
  const displayPhone = bill.hotelPhone || settings.phoneNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      {/* Outer Modal Frame */}
      <div className="relative w-full max-w-2xl my-auto animate-in zoom-in-95 flex flex-col items-center">
        {/* Top Control Bar with Format Selector and Close */}
        <div className="w-full flex items-center justify-between mb-2 px-1 text-white no-print">
          <div className="flex items-center gap-1.5">
            {/* 7cm x 17cm / 17cm x 7cm Toggle */}
            <div className="inline-flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7cm × 17cm (Roll)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                17cm × 7cm (Slip)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingHotel(!isEditingHotel)}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20 cursor-pointer active:scale-95 transition-all"
            >
              <Edit2 className="w-3 h-3 text-emerald-300" />
              <span>{isEditingHotel ? 'Cancel Edit' : 'Edit Hotel / Phone'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hotel & Phone Editor Card */}
        {isEditingHotel && (
          <div className="w-full bg-slate-900 border border-emerald-500/50 p-3 sm:p-4 rounded-2xl mb-3 text-white shadow-xl no-print animate-in slide-in-from-top-2">
            <div className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
              Edit Hotel Name & Phone for this Bill
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-0.5">
                  Hotel Name:
                </label>
                <input
                  type="text"
                  value={editHotelName}
                  onChange={(e) => setEditHotelName(e.target.value)}
                  placeholder="e.g. Hotel Ananda Bhavan"
                  list="retail-hotel-modal-suggestions"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-400"
                />
                <datalist id="retail-hotel-modal-suggestions">
                  {hotelList.map((h, i) => (
                    <option key={i} value={h} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-0.5">
                  Phone Number:
                </label>
                <input
                  type="text"
                  value={editHotelPhone}
                  onChange={(e) => setEditHotelPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2.5">
              <button
                type="button"
                onClick={handleSaveHotelInfo}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Bill</span>
              </button>
            </div>
          </div>
        )}

        {/* Outer Presentation Card */}
        <div className="bg-slate-200 p-2 sm:p-4 rounded-2xl shadow-2xl flex justify-center items-center overflow-auto max-w-full no-print">
          {orientation === 'portrait' ? (
            <div
              className="bg-white border-2 border-black flex flex-col justify-between overflow-hidden text-black select-text shadow-md font-mono"
              style={{
                width: '80mm',
                maxWidth: '80mm',
                padding: '0.5mm 1mm',
                boxSizing: 'border-box',
              }}
            >
              {/* TOP: Hotel Name and Phone Number */}
              <div className="text-center pb-0.5 pt-0 border-b-2 border-black shrink-0">
                <h1 className="text-sm sm:text-base font-black uppercase tracking-tight leading-tight text-black">
                  {displayHotelName}
                </h1>
                {displayPhone && (
                  <p className="text-xs font-bold text-black mt-0.5">
                    Ph: {displayPhone}
                  </p>
                )}
              </div>

              {/* MAIN BODY */}
              <div className="flex-1 flex flex-col justify-between py-0.5 min-h-0">
                <div className="flex items-center justify-between border-b-2 border-black pb-0.5 mb-1 text-xs font-black uppercase tracking-wider">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-0.5 flex-1 overflow-y-auto">
                  {bill.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div className="text-left pr-2 flex-1">
                        <div className="text-xs font-black text-black leading-tight">
                          {idx + 1}. {item.productName}
                        </div>
                        <div className="text-[10.5px] font-semibold text-slate-800">
                          {item.variant === 'egg' || item.productName.toLowerCase().includes('egg') || item.productName.includes('முட்டை')
                            ? `${item.kg} Nos x Rs.${item.pricePerKg}`
                            : `${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}`}
                        </div>
                      </div>
                      <div className="text-right text-xs font-black text-black shrink-0">
                        Rs. {Math.round(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-1 border-t-2 border-b-2 border-black py-1 px-1 flex items-center justify-between bg-white text-black shrink-0">
                  <span className="text-sm font-black uppercase tracking-wider">
                    TOTAL:
                  </span>
                  <span className="text-base font-black">
                    Rs. {Math.round(bill.totalAmount)}
                  </span>
                </div>

                <div
                  className="w-full shrink-0"
                  style={{
                    height: `${(settings.printerFeedLines !== undefined ? settings.printerFeedLines : 8) * 5}mm`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              className="receipt-landscape bg-white border-2 border-black flex flex-col justify-between overflow-hidden text-black select-text shadow-md font-mono"
              style={{
                width: '80mm',
                maxWidth: '80mm',
                padding: '0.5mm 1mm',
                boxSizing: 'border-box',
              }}
            >
              <div className="text-center pb-1 pt-0 border-b-2 border-black shrink-0">
                <h1 className="text-sm sm:text-base font-black uppercase tracking-tight leading-tight text-black">
                  {displayHotelName}
                </h1>
                {displayPhone && (
                  <p className="text-xs font-bold text-black mt-0.5">
                    Ph: {displayPhone}
                  </p>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between pt-1.5 min-h-0">
                <div className="flex items-center justify-between border-b-2 border-black pb-0.5 mb-1 text-[11px] font-black uppercase tracking-wider">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-1 flex-1 overflow-y-auto">
                  {bill.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-xs font-black text-black">
                          {idx + 1}. {item.productName}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-800 ml-2">
                          ({item.variant === 'egg' || item.productName.toLowerCase().includes('egg') || item.productName.includes('முட்டை')
                            ? `${item.kg} Nos x Rs.${item.pricePerKg}`
                            : `${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}`})
                        </span>
                      </div>
                      <span className="text-xs font-black text-black">
                        Rs. {Math.round(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-b-2 border-black py-1 px-1 flex items-center justify-between mt-1 shrink-0">
                  <span className="text-xs font-black uppercase tracking-wider">
                    TOTAL:
                  </span>
                  <span className="text-sm font-black">
                    Rs. {Math.round(bill.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Status Feedback */}
        {statusMessage && (
          <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-1.5 w-full no-print">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Modal Action Buttons at Bottom */}
        <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 mt-3 no-print">
          <button
            type="button"
            onClick={handleBluetoothPrint}
            disabled={printing}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>{printing ? t.connecting : 'Print via Bluetooth'}</span>
          </button>
          <button
            type="button"
            onClick={handleSystemPrint}
            className="bg-white hover:bg-slate-100 text-slate-900 font-black py-3 px-3 rounded-2xl border border-slate-300 flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Print {orientation === 'portrait' ? '7cm × 17cm' : '17cm × 7cm'}</span>
          </button>
        </div>

        <div className="w-full flex items-center justify-between mt-2 px-2 no-print">
          <button
            type="button"
            onClick={handleCopyReceipt}
            className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copied ? t.copied : 'Copy Receipt Text'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
