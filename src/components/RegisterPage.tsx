import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Trash2, Calendar, Building2, MessageCircle } from 'lucide-react';
import { Bill, LanguageCode, ShopSettings } from '../types';
import { formatDisplayDate } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RegisterPageProps {
  bills: Bill[];
  settings: ShopSettings;
  language: LanguageCode;
  onDeleteBill: (billId: string) => void;
  onReprintBill: (bill: Bill) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  bills,
  language,
  onDeleteBill,
  onReprintBill,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  // Extract all unique dates from bills
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    bills.forEach((b) => {
      if (b.date) dates.add(b.date);
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [bills]);

  // Filter bills by search query and date
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.hotelName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate =
        selectedDateFilter === 'all' || b.date === selectedDateFilter;
      return matchesSearch && matchesDate;
    });
  }, [bills, searchQuery, selectedDateFilter]);

  const confirmDelete = () => {
    if (billToDelete) {
      onDeleteBill(billToDelete.id);
      setBillToDelete(null);
    }
  };

  return (
    <div id="page-register" className="pb-8 pt-2 px-2.5 sm:px-3.5 max-w-md mx-auto animate-in fade-in">
      {/* Page Header Title */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm sm:text-base font-black text-emerald-950">{t.recentBills}</h2>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative mb-2.5">
        <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="input-search-bill"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchBillPlaceholder}
          className="w-full min-h-[2.5rem] pl-9 pr-9 py-1.5 bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-bold text-gray-900 outline-none shadow-2xs transition-all leading-normal"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-700 p-1.5 min-h-[2rem] min-w-[2rem] flex items-center justify-center cursor-pointer touch-manipulation"
          >
            ✕
          </button>
        )}
      </div>

      {/* Date Filter Chips */}
      {uniqueDates.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDateFilter('all')}
            className={`min-h-[2.4rem] px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer touch-manipulation flex items-center justify-center flex-shrink-0 ${
              selectedDateFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-950/10 text-emerald-950 border border-emerald-600/30 hover:bg-emerald-700 hover:text-white'
            }`}
          >
            <span className="leading-normal">{t.allDates} ({bills.length})</span>
          </button>
          {uniqueDates.map((d) => {
            const count = bills.filter((b) => b.date === d).length;
            const isSelected = selectedDateFilter === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDateFilter(d)}
                className={`min-h-[2.4rem] px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer touch-manipulation flex-shrink-0 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-emerald-950/10 text-emerald-950 border border-emerald-600/30 hover:bg-emerald-700 hover:text-white'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-emerald-700'}`} />
                <span className="leading-normal">{formatDisplayDate(d)}</span>
                <span className="text-[10px] opacity-80 leading-normal">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-6 text-center shadow-2xs">
          <BookOpen className="w-8 h-8 text-emerald-300 mx-auto mb-1.5" />
          <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug">{t.noBillsFound}</h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-normal break-words">
            {searchQuery
              ? language === 'ta'
                ? 'தேடலுக்குரிய பில்கள் எதுவும் இல்லை.'
                : 'No bills match your search criteria.'
              : language === 'ta'
              ? 'பில்லிங் பக்கத்தில் புதிய பில் உருவாக்கவும்.'
              : 'Create your first bill from the Billing tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBills.map((bill) => (
            <div
              key={bill.id}
              id={`register-bill-${bill.id}`}
              className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-xl p-2.5 sm:p-3 shadow-2xs transition-all"
            >
              {/* Card Header: Bill #, Date, Hotel */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-emerald-100">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-mono font-black text-[11px] leading-tight">
                      #{bill.billNumber}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-950/70 flex items-center gap-1 leading-tight">
                      <Calendar className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      {formatDisplayDate(bill.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm font-black text-emerald-950">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    <span className="break-words leading-tight">{bill.hotelName}</span>
                  </div>
                </div>

                {/* Total Value Badge */}
                <div className="text-right flex-shrink-0">
                  <span className="text-sm sm:text-base font-black text-emerald-600 leading-tight block">
                    ₹{Math.round(bill.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Previous Balance breakdown if attached to bill */}
              {bill.previousBalance !== undefined && bill.previousBalance !== 0 && (
                <div className="my-1.5 text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between font-bold flex-wrap gap-1 leading-normal">
                  <span>
                    {language === 'ta' ? 'பழைய பாக்கி:' : 'Prev Bal:'} ₹{Math.round(bill.previousBalance).toLocaleString('en-IN')}
                  </span>
                  <span className="text-emerald-900">
                    {language === 'ta' ? 'மொத்தம்:' : 'Total Due:'} ₹{Math.round(bill.netTotalWithBalance ?? (bill.totalAmount + bill.previousBalance)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Action Buttons: WhatsApp & Delete */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100">
                <button
                  id={`btn-whatsapp-bill-${bill.id}`}
                  type="button"
                  onClick={() => onReprintBill(bill)}
                  className="min-h-[2.4rem] py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-colors active:scale-95 shadow-2xs cursor-pointer touch-manipulation"
                  title={language === 'ta' ? 'வாட்ஸ்அப் PDF அனுப்பு' : 'Send WhatsApp PDF'}
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white flex-shrink-0" />
                  <span className="leading-normal break-words text-center">{language === 'ta' ? 'வாட்ஸ்அப் PDF' : 'WhatsApp PDF'}</span>
                </button>
                <button
                  id={`btn-delete-bill-${bill.id}`}
                  type="button"
                  onClick={() => setBillToDelete(bill)}
                  className="min-h-[2.4rem] py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-colors active:scale-95 shadow-2xs cursor-pointer touch-manipulation"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
                  <span className="leading-normal">{t.delete}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={!!billToDelete}
        title={language === 'ta' ? `பில் #${billToDelete?.billNumber} நீக்கவா?` : `Delete Bill #${billToDelete?.billNumber}?`}
        message={
          language === 'ta'
            ? 'இந்த பில் பதிவை பதிவேட்டிலிருந்து நீக்க விரும்புகிறீர்களா?'
            : 'Are you sure you want to delete this bill record from the register?'
        }
        itemDetails={
          billToDelete
            ? `${billToDelete.hotelName} • ₹${Math.round(billToDelete.totalAmount).toLocaleString('en-IN')} (${formatDisplayDate(billToDelete.date)})`
            : undefined
        }
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        language={language}
        onConfirm={confirmDelete}
        onCancel={() => setBillToDelete(null)}
      />
    </div>
  );
};
