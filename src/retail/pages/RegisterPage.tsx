import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Trash2,
  Printer,
  Calendar,
  Receipt,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Bill, ShopSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { loadBills, deleteBillById, formatDisplayDate } from '../utils/storage';
import { ReceiptModal } from '../components/ReceiptModal';

interface RegisterPageProps {
  settings: ShopSettings;
  language: Language;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  settings,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [selectedBillForReprint, setSelectedBillForReprint] = useState<Bill | null>(null);
  const [deleteConfirmBillId, setDeleteConfirmBillId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setBills(loadBills());
  }, []);

  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    bills.forEach((b) => {
      if (b.date) datesSet.add(b.date);
    });
    return Array.from(datesSet).sort().reverse();
  }, [bills]);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (selectedDateFilter !== 'all' && b.date !== selectedDateFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase().replace(/^#/, '');
        const matchBillNumber = b.billNumber.toLowerCase().includes(query);
        const matchItems = b.items?.some((it) =>
          it.productName.toLowerCase().includes(query)
        );
        return matchBillNumber || matchItems;
      }
      return true;
    });
  }, [bills, searchQuery, selectedDateFilter]);

  const groupedBills = useMemo(() => {
    const groups: { [date: string]: Bill[] } = {};
    filteredBills.forEach((bill) => {
      const d = bill.date || 'Unknown Date';
      if (!groups[d]) groups[d] = [];
      groups[d].push(bill);
    });
    return groups;
  }, [filteredBills]);

  const initiateDelete = (id: string) => {
    setDeleteConfirmBillId(id);
  };

  const handleDeleteBill = (id: string) => {
    const updated = deleteBillById(id);
    setBills(updated);
    setDeleteConfirmBillId(null);
    setToastMessage(t.billDeleted);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto min-h-screen">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-700 text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-200 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {t.billRecords}
          </div>
          <h2 className="text-lg font-extrabold text-emerald-950 mt-0.5">
            {t.register}
          </h2>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-right">
          <div className="text-[10px] text-gray-500 font-bold uppercase">
            {t.totalSaved}
          </div>
          <div className="text-sm font-extrabold text-emerald-800">
            {bills.length} {t.bills}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-emerald-200 mb-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-emerald-700 ml-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchBillPlaceholder}
          className="w-full bg-transparent text-sm py-1.5 px-1 font-semibold text-gray-900 placeholder:text-gray-400 outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-lg mr-1 font-bold cursor-pointer"
          >
            {t.cancel}
          </button>
        )}
      </div>

      {/* Date-by-Date Filter Pills */}
      {availableDates.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3">
          <button
            type="button"
            onClick={() => setSelectedDateFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedDateFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            {t.allTime} ({bills.length})
          </button>
          {availableDates.map((d) => {
            const count = bills.filter((b) => b.date === d).length;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDateFilter(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedDateFilter === d
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {d} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Bills List Grouped Date by Date */}
      {Object.keys(groupedBills).length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 shadow-xs mt-4">
          <Receipt className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
          <h3 className="font-bold text-gray-800 text-sm">
            {t.noBillsFound}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Create bills in the Billing tab to view and reprint them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBills).map(([dateStr, dateBills]: [string, Bill[]]) => (
            <div key={dateStr} className="space-y-2.5">
              {/* Date Section Header */}
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                  {formatDisplayDate(dateStr, language)}
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full ml-auto">
                  {dateBills.length} {dateBills.length === 1 ? 'bill' : 'bills'}
                </span>
              </div>

              {/* Bills Cards */}
              {dateBills.map((bill) => (
                <div
                  key={bill.id}
                  className="bg-white rounded-2xl p-3.5 shadow-xs border border-emerald-100 hover:border-emerald-300 transition-all space-y-2"
                >
                  {/* Top Row: Bill No & Total Value */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-700 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-xs">
                        #{bill.billNumber}
                      </span>
                      <div className="text-xs font-semibold text-slate-500">
                        {bill.items.length} {t.items}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-800">
                        ₹{bill.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold text-gray-500">
                        {bill.totalKg.toFixed(2)} {language === 'ta' ? 'கிலோ' : 'KG'}
                      </div>
                    </div>
                  </div>

                  {/* Items Summary Line */}
                  <div className="text-xs text-gray-600 space-y-1">
                    {bill.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs gap-2">
                        <span className="text-gray-700 truncate flex-1 min-w-0">
                          {it.productName} ({it.kg.toFixed(2)} kg)
                        </span>
                        <span className="font-semibold text-gray-900 shrink-0">
                          ₹{Math.round(it.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card Bottom Actions: Time, Reprint, Delete */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{bill.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => initiateDelete(bill.id)}
                        className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95 min-h-[2.25rem] min-w-[2.25rem] justify-center cursor-pointer"
                        title={t.deleteBill}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBillForReprint(bill)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all min-h-[2.25rem] cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{t.reprintBill}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Delete Bill Confirmation Modal */}
      {deleteConfirmBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-emerald-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              {t.deleteBill}?
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              {t.confirmDeleteBill}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBillId(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBill(deleteConfirmBillId)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reprint Modal */}
      {selectedBillForReprint && (
        <ReceiptModal
          bill={selectedBillForReprint}
          settings={settings}
          language={language}
          onClose={() => setSelectedBillForReprint(null)}
          onBillUpdated={(updated) => {
            setSelectedBillForReprint(updated);
            setBills(loadBills());
          }}
        />
      )}
    </div>
  );
};
