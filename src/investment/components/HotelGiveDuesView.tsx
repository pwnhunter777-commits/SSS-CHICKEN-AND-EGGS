import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Search,
  Share2,
  Receipt,
  Phone,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Bill, HotelItem, HotelPayment, LanguageCode, ShopSettings } from '../../types';
import {
  loadBills as loadWholesaleBills,
  loadHotels as loadWholesaleHotels,
  loadHotelPayments as loadWholesalePayments,
  loadSettings as loadWholesaleSettings,
  formatDisplayDate,
} from '../../utils/storage';
import { HotelBalanceSlipModal } from '../../components/HotelBalanceSlipModal';
import {
  generateHotelBalanceWhatsAppText,
  openWhatsAppChatWithText,
  HotelBalanceShareData,
} from '../../utils/whatsapp';

interface HotelGiveDuesViewProps {
  language?: LanguageCode;
}

interface HotelStatsItem {
  hotel: HotelItem;
  totalBilled: number;
  totalKg: number;
  totalPaid: number;
  totalBalAdded: number;
  balance: number;
  hotelBills: Bill[];
  hotelPayments: HotelPayment[];
}

export const HotelGiveDuesView: React.FC<HotelGiveDuesViewProps> = ({
  language = 'en',
}) => {
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<HotelPayment[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(() => loadWholesaleSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'settled'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected hotel for slip modal
  const [activeModalHotel, setActiveModalHotel] = useState<HotelStatsItem | null>(null);

  const loadAllData = () => {
    setHotels(loadWholesaleHotels());
    setBills(loadWholesaleBills());
    setPayments(loadWholesalePayments());
    setSettings(loadWholesaleSettings());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const isBillForHotel = (bill: Bill, hotel: { nameEn: string; nameTa: string }) => {
    const bName = (bill.hotelName || '').trim().toLowerCase();
    const en = (hotel.nameEn || '').trim().toLowerCase();
    const ta = (hotel.nameTa || '').trim().toLowerCase();
    return bName === en || bName === ta;
  };

  const isPaymentForHotel = (
    payment: HotelPayment,
    hotel: { nameEn: string; nameTa: string; id: string }
  ) => {
    if (payment.hotelId && payment.hotelId === hotel.id) {
      return true;
    }
    const pName = (payment.hotelName || '').trim().toLowerCase();
    const en = (hotel.nameEn || '').trim().toLowerCase();
    const ta = (hotel.nameTa || '').trim().toLowerCase();
    return pName === en || pName === ta;
  };

  // Compile all hotels (configured list + any unique names from bills)
  const allHotelsWithStats: HotelStatsItem[] = useMemo(() => {
    const list: HotelItem[] = hotels.map((h) => ({
      id: h.id,
      nameEn: h.nameEn,
      nameTa: h.nameTa,
      phone: h.phone || '',
    }));

    bills.forEach((b) => {
      const bName = b.hotelName?.trim();
      if (!bName) return;
      const matched = list.some(
        (h) =>
          h.nameEn.toLowerCase() === bName.toLowerCase() ||
          h.nameTa.toLowerCase() === bName.toLowerCase()
      );
      if (!matched) {
        list.push({
          id: 'custom_' + bName,
          nameEn: bName,
          nameTa: bName,
          phone: '',
        });
      }
    });

    return list.map((hotel) => {
      const hotelBills = bills.filter((b) => isBillForHotel(b, hotel));
      const hotelPayments = payments.filter((p) => isPaymentForHotel(p, hotel));
      const totalBilled = hotelBills.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalKg = hotelBills.reduce((sum, b) => sum + b.totalKg, 0);
      const totalPaid = hotelPayments
        .filter((p) => p.type !== 'balance_add')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalBalAdded = hotelPayments
        .filter((p) => p.type === 'balance_add')
        .reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.round((totalBilled + totalBalAdded - totalPaid) * 100) / 100;

      return {
        hotel,
        totalBilled,
        totalKg,
        totalPaid,
        totalBalAdded,
        balance,
        hotelBills,
        hotelPayments,
      };
    });
  }, [hotels, bills, payments]);

  // Overall totals across all hotels
  const overallPendingBalance = useMemo(() => {
    return allHotelsWithStats.reduce((sum, item) => (item.balance > 0 ? sum + item.balance : sum), 0);
  }, [allHotelsWithStats]);

  const pendingHotelsCount = useMemo(() => {
    return allHotelsWithStats.filter((item) => item.balance > 0).length;
  }, [allHotelsWithStats]);

  // Filter and search
  const filteredHotels = useMemo(() => {
    return allHotelsWithStats
      .filter((item) => {
        if (filterMode === 'pending') return item.balance > 0;
        if (filterMode === 'settled') return item.balance <= 0;
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const en = (item.hotel.nameEn || '').toLowerCase();
        const ta = (item.hotel.nameTa || '').toLowerCase();
        const phone = (item.hotel.phone || '').toLowerCase();
        return en.includes(q) || ta.includes(q) || phone.includes(q);
      })
      .sort((a, b) => b.balance - a.balance); // High dues first
  }, [allHotelsWithStats, filterMode, searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Share handler
  const handleShareHotel = async (item: HotelStatsItem) => {
    const shareData: HotelBalanceShareData = {
      hotelName: item.hotel.nameEn || item.hotel.nameTa,
      hotelNameTa: item.hotel.nameTa,
      hotelPhone: item.hotel.phone,
      totalBilled: item.totalBilled,
      totalPaid: item.totalPaid,
      totalBalAdded: item.totalBalAdded,
      balance: item.balance,
      totalKg: item.totalKg,
      billCount: item.hotelBills.length,
      paymentCount: item.hotelPayments.filter((p) => p.type !== 'balance_add').length,
      recentBills: item.hotelBills.slice(0, 3).map((b) => ({
        billNumber: parseInt(b.billNumber, 10) || 0,
        date: formatDisplayDate(b.date),
        amount: b.totalAmount,
        kg: b.totalKg,
      })),
      recentPayments: item.hotelPayments.slice(0, 3).map((p) => ({
        date: formatDisplayDate(p.date),
        amount: p.amount,
        mode: p.paymentMode,
      })),
    };

    const text = generateHotelBalanceWhatsAppText(shareData, settings, language as LanguageCode);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Balance - ${item.hotel.nameEn || item.hotel.nameTa}`,
          text: text,
        });
        showToast(language === 'ta' ? 'பகிர்வு முடிந்தது' : 'Shared successfully');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Direct WhatsApp fallback
    let cleanNumber = '';
    if (item.hotel.phone && item.hotel.phone.trim().length > 0) {
      cleanNumber = item.hotel.phone.replace(/\D/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
      }
    }
    openWhatsAppChatWithText(text, cleanNumber);
    showToast(language === 'ta' ? 'வாட்ஸ்அப் திறக்கப்பட்டது' : 'Opened WhatsApp');
  };

  return (
    <div id="hotel-give-dues-container" className="space-y-4 pb-8 animate-in fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Top Banner: Total Bal Amount & Count */}
      <div className="bg-gradient-to-br from-rose-800 via-rose-900 to-neutral-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-rose-700/50">
        <div className="flex items-center justify-between pb-1.5 border-b border-rose-700/40">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-300" />
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-200">
              {language === 'ta' ? 'ஹோட்டல் பாக்கி மொத்தம் (Give)' : 'Total Hotel Balance (Give)'}
            </span>
          </div>
          <button
            type="button"
            onClick={loadAllData}
            title="Refresh"
            className="p-1 rounded-lg bg-rose-800/60 hover:bg-rose-700/80 text-rose-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-2 text-center sm:text-left">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            ₹{Math.round(overallPendingBalance).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ta' ? 'ஹோட்டல் பெயர் / போன் எண் தேட...' : 'Search hotel name / phone...'}
            className="w-full bg-white border border-neutral-300 focus:border-emerald-700 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-neutral-900 outline-hidden transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-neutral-700 p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {language === 'ta' ? 'அனைத்தும்' : 'All'} ({allHotelsWithStats.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            {language === 'ta' ? 'பாக்கி மட்டும்' : 'Pending Only'} ({pendingHotelsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('settled')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterMode === 'settled'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {language === 'ta' ? 'முடிந்தது' : 'Settled'} ({allHotelsWithStats.length - pendingHotelsCount})
          </button>
        </div>
      </div>

      {/* Hotel Cards List */}
      <div className="space-y-2">
        {filteredHotels.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-neutral-200 shadow-2xs">
            <Building2 className="w-6 h-6 text-neutral-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-neutral-500">
              {language === 'ta' ? 'ஹோட்டல்கள் எதுவும் கிடைக்கவில்லை' : 'No hotels match the filter'}
            </p>
          </div>
        ) : (
          filteredHotels.map((item) => {
            const displayName =
              language === 'ta'
                ? item.hotel.nameTa || item.hotel.nameEn
                : item.hotel.nameEn || item.hotel.nameTa;
            const isDue = item.balance > 0;
            const isSettled = item.balance === 0;

            return (
              <div
                key={item.hotel.id}
                id={`hotel-give-card-${item.hotel.id}`}
                className="bg-white rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-3.5 sm:py-3 border border-neutral-200 hover:border-emerald-300 shadow-2xs transition-all flex items-center justify-between gap-2.5"
              >
                {/* Hotel Name */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-black text-neutral-900 truncate uppercase tracking-tight">
                    {displayName}
                  </h3>
                </div>

                {/* Big Balance Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-base sm:text-lg font-black tracking-tight ${
                      isDue
                        ? 'text-rose-600'
                        : isSettled
                        ? 'text-emerald-700'
                        : 'text-sky-700'
                    }`}
                  >
                    ₹{Math.round(Math.abs(item.balance)).toLocaleString('en-IN')}
                  </div>
                  {item.balance < 0 && (
                    <span className="text-[9px] font-bold text-sky-700 block leading-none text-right">
                      ({language === 'ta' ? 'முன்பணம்' : 'Advance'})
                    </span>
                  )}
                </div>

                {/* Share Button (in the same line) */}
                <button
                  type="button"
                  id={`btn-share-hotel-${item.hotel.id}`}
                  onClick={() => handleShareHotel(item)}
                  title={language === 'ta' ? 'வாட்ஸ்அப் பகிர்' : 'Share on WhatsApp'}
                  className="shrink-0 h-8 px-2.5 sm:px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'பகிர்' : 'Share'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Statement Slip Modal */}
      {activeModalHotel && (
        <HotelBalanceSlipModal
          isOpen={true}
          hotel={activeModalHotel.hotel}
          hotelStats={{
            totalBilled: activeModalHotel.totalBilled,
            totalPaid: activeModalHotel.totalPaid,
            totalBalAdded: activeModalHotel.totalBalAdded,
            balance: activeModalHotel.balance,
            totalKg: activeModalHotel.totalKg,
            hotelBills: activeModalHotel.hotelBills,
            hotelPayments: activeModalHotel.hotelPayments,
          }}
          settings={settings}
          language={language}
          onClose={() => setActiveModalHotel(null)}
        />
      )}
    </div>
  );
};
