import React, { useState } from 'react';
import {
  Settings,
  Save,
  Check,
  Phone,
  FileText,
  MapPin,
  QrCode,
  Building2,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  Printer,
  Minus,
  Type,
  Bold,
  Store,
  Smartphone,
  Database,
  Calendar,
  Download,
  Upload,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { appLogo } from '../assets/logo';
import { Bill, DEFAULT_HOTELS, getHotelName, HotelItem, LanguageCode, ShopSettings } from '../types';
import {
  saveOrUpdateHotelPhone,
  execute31DayDataCleanup,
  getStorageStats,
  RETENTION_DAYS,
  exportAllDataToFile,
  importDataFromFile,
} from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface SettingsPageProps {
  settings: ShopSettings;
  bills: Bill[];
  hotels: HotelItem[];
  language: LanguageCode;
  onSaveSettings: (newSettings: ShopSettings) => void;
  onSaveHotels?: (hotels: HotelItem[]) => void;
  onDataRestored?: () => void;
  onNavigateToMain?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  bills,
  hotels,
  language,
  onSaveSettings,
  onSaveHotels,
  onDataRestored,
  onNavigateToMain,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [formData, setFormData] = useState<ShopSettings>({
    shopName: settings.shopName || '',
    shopNameTa: settings.shopNameTa || 'எஸ்.எஸ்.எஸ். சிக்கன் ஏஜென்சி',
    phoneNumber: settings.phoneNumber || '',
    gstNumber: settings.gstNumber || '',
    address: settings.address || '',
    addressTa: settings.addressTa || 'எண் 6, பாண்டி மெயின் ரோடு, சுல்தான்பேட்டை, வில்லியனூர், புதுச்சேரி - 605 110',
    upiId: settings.upiId || '',
    billWidthCm: settings.billWidthCm || 17,
    fontSizeScale: settings.fontSizeScale || 100,
    isBoldText: settings.isBoldText || false,
  });

  const [newHotelNameEn, setNewHotelNameEn] = useState('');
  const [newHotelNameTa, setNewHotelNameTa] = useState('');
  const [newHotelPhone, setNewHotelPhone] = useState('');
  const [hotelPhoneEdits, setHotelPhoneEdits] = useState<Record<string, string>>({});
  const [phoneToDelete, setPhoneToDelete] = useState<HotelItem | null>(null);
  const [resetHotelsConfirm, setResetHotelsConfirm] = useState(false);
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [fileStatus, setFileStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [storageStats, setStorageStats] = useState(() => getStorageStats());
  const [isCleaning, setIsCleaning] = useState(false);

  const handleManualCleanup = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const res = execute31DayDataCleanup();
      setStorageStats(getStorageStats());
      setIsCleaning(false);
      if (res.totalRemoved > 0) {
        setFileStatus({
          type: 'success',
          text:
            language === 'ta'
              ? `31 நாட்களுக்கு முந்தைய ${res.totalRemoved} பழைய பதிவுகள் வெற்றிகரமாக நீக்கப்பட்டன.`
              : `Cleaned ${res.totalRemoved} records older than 31 days from phone storage!`,
        });
      } else {
        setFileStatus({
          type: 'success',
          text:
            language === 'ta'
              ? '31 நாட்களுக்கு முந்தைய பழைய பதிவுகள் எதுவும் இல்லை. அனைத்து செயலில் உள்ள தரவுகளும் போனில் பாதுகாப்பாக உள்ளன!'
              : 'No records older than 31 days found. All active transactions are safely stored on this phone!',
        });
      }
      if (onDataRestored) {
        onDataRestored();
      }
    }, 400);
  };

  const handleExportBackup = () => {
    exportAllDataToFile();
    setFileStatus({
      type: 'success',
      text:
        language === 'ta'
          ? 'காப்பு கோப்பு (JSON) உங்கள் போன் பதிவிறக்கங்கள் (Downloads) கோப்புறையில் சேமிக்கப்பட்டது!'
          : 'Backup file (JSON) saved directly into your phone Downloads folder!',
    });
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await importDataFromFile(file);
    if (res.success) {
      setStorageStats(getStorageStats());
      setFileStatus({
        type: 'success',
        text:
          language === 'ta'
            ? 'போன் கோப்பிலிருந்து தரவு வெற்றிகரமாக மீட்டமைக்கப்பட்டது!'
            : 'Data restored successfully from phone file!',
      });
      if (onDataRestored) {
        onDataRestored();
      }
    } else {
      setFileStatus({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handleChange = (field: keyof ShopSettings, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const currentFontSizeScale = formData.fontSizeScale || 100;

  const handleDecreaseFontSize = () => {
    const nextScale = Math.max(75, currentFontSizeScale - 10);
    handleChange('fontSizeScale', nextScale);
    onSaveSettings({ ...formData, fontSizeScale: nextScale });
    document.documentElement.style.fontSize = `${nextScale}%`;
  };

  const handleIncreaseFontSize = () => {
    const nextScale = Math.min(165, currentFontSizeScale + 10);
    handleChange('fontSizeScale', nextScale);
    onSaveSettings({ ...formData, fontSizeScale: nextScale });
    document.documentElement.style.fontSize = `${nextScale}%`;
  };

  const isBoldActive = Boolean(formData.isBoldText);
  const handleToggleBold = () => {
    const nextBold = !isBoldActive;
    handleChange('isBoldText', nextBold);
    onSaveSettings({ ...formData, isBoldText: nextBold });
    if (nextBold) {
      document.body.classList.add('app-bold-mode');
    } else {
      document.body.classList.remove('app-bold-mode');
    }
  };

  const getScaleLabel = (scale: number) => {
    if (scale <= 85) return language === 'ta' ? 'சிறியது (Small)' : 'Small';
    if (scale <= 95) return language === 'ta' ? 'சற்று சிறியது' : 'Slightly Small';
    if (scale === 100) return language === 'ta' ? 'சாதாரண (Normal)' : 'Normal (100%)';
    if (scale <= 115) return language === 'ta' ? 'நடுத்தர (Medium)' : 'Medium';
    if (scale <= 135) return language === 'ta' ? 'பெரியது (Large)' : 'Large';
    return language === 'ta' ? 'மிகப்பெரியது (Extra Large)' : 'Extra Large';
  };

  const handleAddHotel = (e: React.FormEvent) => {
    e.preventDefault();
    const enTrimmed = newHotelNameEn.trim();
    const taTrimmed = newHotelNameTa.trim();
    const phoneTrimmed = newHotelPhone.trim();

    if (!enTrimmed && !taTrimmed) {
      setFileStatus({ type: 'error', text: t.addErrorHotelName });
      setTimeout(() => setFileStatus(null), 3000);
      return;
    }

    const newHotel: HotelItem = {
      id: 'h_' + Date.now(),
      nameEn: enTrimmed || taTrimmed,
      nameTa: taTrimmed || enTrimmed,
      phone: phoneTrimmed || undefined,
    };

    const updated = [...hotels, newHotel];
    if (onSaveHotels) onSaveHotels(updated);
    if (phoneTrimmed) {
      saveOrUpdateHotelPhone(newHotel.id, phoneTrimmed);
    }
    setNewHotelNameEn('');
    setNewHotelNameTa('');
    setNewHotelPhone('');
    const displayName = getHotelName(newHotel, language);
    setFileStatus({
      type: 'success',
      text: language === 'ta' ? `"${displayName}" சேர்க்கப்பட்டது!` : `Added "${displayName}" to hotels!`,
    });
    setTimeout(() => setFileStatus(null), 3000);
  };

  const handleSaveHotelPhone = (hotelId: string) => {
    const phoneToSave = (hotelPhoneEdits[hotelId] ?? '').trim();
    const targetHotel = hotels.find((h) => h.id === hotelId);
    if (!targetHotel) return;

    const updated = hotels.map((h) => (h.id === hotelId ? { ...h, phone: phoneToSave || undefined } : h));
    if (onSaveHotels) onSaveHotels(updated);
    saveOrUpdateHotelPhone(hotelId, phoneToSave);
    const displayName = getHotelName(targetHotel, language);
    setFileStatus({
      type: 'success',
      text: language === 'ta'
        ? `"${displayName}" போன் எண் சேமிக்கப்பட்டது!`
        : `Phone number for "${displayName}" saved!`,
    });
    setTimeout(() => setFileStatus(null), 3000);
  };

  const handleDeleteHotelPhone = (hotelId: string) => {
    const targetHotel = hotels.find((h) => h.id === hotelId);
    if (!targetHotel) return;

    const updated = hotels.map((h) => (h.id === hotelId ? { ...h, phone: undefined } : h));
    if (onSaveHotels) onSaveHotels(updated);
    saveOrUpdateHotelPhone(hotelId, '');
    setHotelPhoneEdits((prev) => ({
      ...prev,
      [hotelId]: '',
    }));
    const displayName = getHotelName(targetHotel, language);
    setFileStatus({
      type: 'success',
      text: language === 'ta'
        ? `"${displayName}" போன் எண் நீக்கப்பட்டது!`
        : `Phone number removed for "${displayName}"!`,
    });
    setTimeout(() => setFileStatus(null), 3000);
  };

  const handleResetDefaultHotels = () => {
    if (onSaveHotels) onSaveHotels(DEFAULT_HOTELS);
    setFileStatus({
      type: 'success',
      text: language === 'ta' ? '14 ஆரம்ப ஹோட்டல்கள் மீட்டமைக்கப்பட்டது!' : 'Reset to standard 14 hotel names!',
    });
    setTimeout(() => setFileStatus(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    if (onNavigateToMain) {
      onNavigateToMain();
    }
  };

  return (
    <div id="page-settings" className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4 animate-in fade-in">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-emerald-700" />
        <h2 className="text-base font-bold text-emerald-950">{t.settings}</h2>
      </div>

      {/* Official Business Branding Badge Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-3xl p-4 shadow-md flex items-center gap-3.5 border border-emerald-700/60">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white p-0.5 flex-shrink-0 shadow-md border-2 border-amber-300">
          <img
            src={appLogo}
            alt="SSS Chicken Agency Logo"
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-sm sm:text-base tracking-wide uppercase text-white truncate">
              {formData.shopName || 'SSS CHICKEN AGENCY'}
            </h3>
          </div>
          <p className="text-[11px] text-emerald-100 font-semibold truncate">
            {formData.phoneNumber || '8680000003'}
          </p>
          <p className="text-[10px] text-amber-200 font-medium truncate">
            GST: {formData.gstNumber || '34AQPN8846J2ZF'}
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{t.saveSettingsSuccess}</span>
        </div>
      )}

      {fileStatus && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-2 ${
            fileStatus.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{fileStatus.text}</span>
        </div>
      )}

      {/* Settings Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* 1. Shop Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-emerald-700" />
            <span>1. {t.shopName}</span>
          </label>
          <input
            id="setting-input-shop-name"
            type="text"
            value={formData.shopName}
            onChange={(e) => handleChange('shopName', e.target.value)}
            placeholder="SSS CHICKEN AGENCY"
            required
            className="w-full px-3.5 py-2.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-bold text-gray-900 outline-none transition-all"
          />
        </div>

        {/* 2. Phone Number */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-700" />
            <span>2. {t.phoneNumber}</span>
          </label>
          <input
            id="setting-input-phone"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="8680000003"
            className="w-full px-3.5 py-2.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 outline-none transition-all"
          />
        </div>

        {/* 3. GST Number */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>3. {t.gstNumber}</span>
          </label>
          <input
            id="setting-input-gst"
            type="text"
            value={formData.gstNumber}
            onChange={(e) => handleChange('gstNumber', e.target.value)}
            placeholder="34AQPN8846J2ZF"
            className="w-full px-3.5 py-2.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 outline-none transition-all uppercase"
          />
        </div>

        {/* 4. Address */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>4. {t.address}</span>
          </label>
          <textarea
            id="setting-input-address"
            rows={2}
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110"
            className="w-full px-3.5 py-2 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none transition-all resize-none"
          />
        </div>

        {/* 5. UPI ID */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-emerald-700" />
            <span>5. {t.upiId}</span>
          </label>
          <input
            id="setting-input-upi"
            type="text"
            value={formData.upiId}
            onChange={(e) => handleChange('upiId', e.target.value)}
            placeholder="NAZIRAHAMED0003@okhdfcbank"
            className="w-full px-3.5 py-2.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 outline-none transition-all"
          />
        </div>

        {/* 6. Default Bill Print Width */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>6. {language === 'ta' ? 'பில் அகலம் (Bill Width)' : 'Bill Print Width'}</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="setting-input-bill-width"
              type="number"
              min="5"
              max="30"
              step="1"
              value={formData.billWidthCm || 17}
              onChange={(e) => handleChange('billWidthCm', Number(e.target.value) || 17)}
              className="w-28 px-3.5 py-2.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-black text-gray-900 outline-none"
            />
            <span className="text-xs font-extrabold text-emerald-950">cm</span>
            <span className="text-[11px] text-gray-500 ml-auto font-medium">
              {language === 'ta' ? 'இயல்புநிலை: 17 செ.மீ' : 'Default: 17 cm'}
            </span>
          </div>
        </div>

        {/* 7. Font Size Controller */}
        <div className="bg-emerald-50/60 border border-emerald-300/80 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-emerald-700" />
              <span>7. {language === 'ta' ? 'எழுத்து அளவு (Font Size)' : 'Bill & App Font Size'}</span>
            </label>
            <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {getScaleLabel(currentFontSizeScale)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              id="btn-decrease-font-size"
              type="button"
              onClick={handleDecreaseFontSize}
              disabled={currentFontSizeScale <= 75}
              className="flex-1 py-3 px-3 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/20 transition-all active:scale-95 touch-manipulation cursor-pointer"
              title={language === 'ta' ? 'அளவை குறைக்கவும்' : 'Decrease font size'}
            >
              <Minus className="w-4 h-4 text-white" />
              <span>{language === 'ta' ? 'குறை (-)' : 'Decrease (-)'}</span>
            </button>

            <div className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-mono font-black text-base shadow-xs min-w-[72px] text-center">
              {currentFontSizeScale}%
            </div>

            <button
              id="btn-increase-font-size"
              type="button"
              onClick={handleIncreaseFontSize}
              disabled={currentFontSizeScale >= 165}
              className="flex-1 py-3 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all active:scale-95 touch-manipulation cursor-pointer"
              title={language === 'ta' ? 'அளவை கூட்டவும்' : 'Increase font size'}
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{language === 'ta' ? 'கூட்டு (+)' : 'Increase (+)'}</span>
            </button>
          </div>

          {/* Bold Text Toggle Button */}
          <button
            id="btn-toggle-bold-text"
            type="button"
            onClick={handleToggleBold}
            className={`w-full py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 touch-manipulation text-white cursor-pointer ${
              isBoldActive
                ? 'bg-slate-950 ring-2 ring-emerald-400 shadow-emerald-950/20'
                : 'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 shadow-slate-900/20'
            }`}
          >
            <Bold className={`w-4 h-4 ${isBoldActive ? 'text-amber-300 stroke-[3]' : 'text-white'}`} />
            <span>
              {language === 'ta'
                ? isBoldActive
                  ? 'தடித்த எழுத்து (Bold ON)'
                  : 'எழுத்துகளை தடிமனாக்கு (Make Text Bold)'
                : isBoldActive
                ? 'Bold Text is ON'
                : 'Make Text Bold (B)'}
            </span>
          </button>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            id="btn-save-settings"
            type="submit"
            className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <Save className="w-5 h-5 text-white" />
            <span>{t.save}</span>
          </button>
        </div>
      </form>

      {/* Hotel & Customer Names Management Card with Phone Number Setup */}
      <div className="bg-white border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide">
              {t.hotelsAndCustomers} ({hotels.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setResetHotelsConfirm(true)}
            title="Reset to 14 standard hotels"
            className="text-[11px] font-black text-white flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 px-2.5 py-1 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-white" />
            <span>{t.resetHotels}</span>
          </button>
        </div>

        {/* Add New Hotel Form */}
        <form onSubmit={handleAddHotel} className="space-y-2 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200">
          <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.addHotel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newHotelNameEn}
              onChange={(e) => setNewHotelNameEn(e.target.value)}
              placeholder={t.hotelNameEn + ' (e.g. Star Biriyani)'}
              className="w-full px-3 py-2 bg-white border border-emerald-300 focus:border-emerald-600 rounded-xl text-xs font-semibold text-gray-900 outline-none"
            />
            <input
              type="text"
              value={newHotelNameTa}
              onChange={(e) => setNewHotelNameTa(e.target.value)}
              placeholder={t.hotelNameTa + ' (உ.ம். ஸ்டார் பிரியாணி)'}
              className="w-full px-3 py-2 bg-white border border-emerald-300 focus:border-emerald-600 rounded-xl text-xs font-semibold text-gray-900 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                value={newHotelPhone}
                onChange={(e) => setNewHotelPhone(e.target.value)}
                placeholder={language === 'ta' ? 'வாட்ஸ்அப் எண் (உ.ம்: 9876543210)' : 'WhatsApp Phone (Optional - e.g. 9876543210)'}
                className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-300 focus:border-emerald-600 rounded-xl text-xs font-semibold text-gray-900 outline-none"
              />
              <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addHotel}</span>
            </button>
          </div>
        </form>

        {/* Hotel Search & Filter */}
        <div className="relative">
          <input
            type="text"
            value={hotelSearchQuery}
            onChange={(e) => setHotelSearchQuery(e.target.value)}
            placeholder={language === 'ta' ? 'ஹோட்டல் பெயர் அல்லது போன் எண் தேட...' : 'Search hotel name or phone number...'}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-gray-800 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
        </div>

        {/* Hotel list with phone setup */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {hotels
            .filter((hotel) => {
              if (!hotelSearchQuery.trim()) return true;
              const q = hotelSearchQuery.toLowerCase();
              return (
                hotel.nameEn.toLowerCase().includes(q) ||
                hotel.nameTa.toLowerCase().includes(q) ||
                (hotel.phone && hotel.phone.includes(q))
              );
            })
            .map((hotel) => {
              const displayName = getHotelName(hotel, language);
              const secondaryName = language === 'ta' ? hotel.nameEn : hotel.nameTa;
              const currentEditPhone = hotelPhoneEdits[hotel.id] !== undefined ? hotelPhoneEdits[hotel.id] : (hotel.phone || '');
              return (
                <div
                  key={hotel.id}
                  className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 p-2.5 rounded-2xl transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-950 block truncate">
                        {displayName}
                      </span>
                      {secondaryName && secondaryName !== displayName && (
                        <span className="text-[10px] text-gray-500 font-medium block truncate">{secondaryName}</span>
                      )}
                    </div>
                    {hotel.phone && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{hotel.phone}</span>
                      </span>
                    )}
                  </div>

                  {/* Hotel Phone Input + Save + Delete */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={currentEditPhone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHotelPhoneEdits((prev) => ({
                            ...prev,
                            [hotel.id]: val,
                          }));
                        }}
                        placeholder={language === 'ta' ? 'வாட்ஸ்அப் எண் (உ.ம்: 9876543210)' : 'WhatsApp phone (e.g. 9876543210)'}
                        className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-gray-900 outline-none"
                      />
                      <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-2 top-2" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveHotelPhone(hotel.id)}
                      title="Save Phone Number"
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 flex-shrink-0 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'சேமி' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneToDelete(hotel)}
                      title={language === 'ta' ? `போன் எண் நீக்கு (${displayName})` : `Delete Phone Number for ${displayName}`}
                      className="p-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-black flex items-center justify-center transition-colors active:scale-95 flex-shrink-0 shadow-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 5. Phone Local Storage & 31-Day Retention Engine Card */}
      <div className="bg-white border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm sm:text-base font-bold text-emerald-950">
              {language === 'ta' ? 'போன் சேமிப்பகம் & 31 நாட்கள் தானியங்கி நீக்கம்' : 'Phone Local Storage & 31-Day Retention'}
            </h3>
          </div>
          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-300/60">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            <span>{language === 'ta' ? 'இந்த போனில் மட்டுமே' : '100% On-Device'}</span>
          </span>
        </div>

        {/* Security & Offline Guarantee Pill */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Database className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>
              {language === 'ta'
                ? 'அனைத்து தரவுகளும் இந்த போனின் உள்ளமைந்த நினைவகத்தில் பாதுகாப்பாக உள்ளன.'
                : 'All bills, hotel ledgers, and prices are saved inside this phone.'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
            {language === 'ta'
              ? 'வெளிப்புற சர்வர்கள் தேவையில்லை. போனில் இடம் நிரம்புவதை தடுக்கவும், வேகம் குறையாமல் இருக்கவும் 31 நாட்களுக்கு முந்தைய பழைய பதிவுகள் தானாகவே நீக்கப்படும்.'
              : 'Zero external cloud tracking. To protect phone storage and keep billing blazing fast, records older than 31 days are automatically pruned.'}
          </p>
        </div>

        {/* Live Storage & Retention Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="bg-emerald-50/60 border border-emerald-200/80 p-2.5 rounded-xl">
            <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
              {language === 'ta' ? 'தானியங்கி நீக்கம்' : 'Retention Window'}
            </span>
            <span className="text-sm font-black text-emerald-950 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>31 {language === 'ta' ? 'நாட்கள்' : 'Days'}</span>
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 p-2.5 rounded-xl">
            <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
              {language === 'ta' ? 'நீக்கப்படும் எல்லை' : 'Cutoff Date'}
            </span>
            <span className="text-xs font-black text-emerald-950 mt-0.5 block truncate">
              {storageStats.cutoffDate}
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 p-2.5 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
              {language === 'ta' ? 'போன் சேமிப்பக அளவு' : 'Phone Storage'}
            </span>
            <span className="text-xs font-black text-emerald-950 mt-0.5 block">
              {storageStats.totalStorageKb} KB
            </span>
          </div>
        </div>

        {/* Active Records Counters */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 divide-y divide-slate-200 text-xs">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-600 font-medium">
              {language === 'ta' ? 'மொத்த பில் பதிவுகள் (கடந்த 31 நாட்கள்)' : 'Active Wholesale Bills (≤31 days)'}
            </span>
            <span className="font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
              {storageStats.wholesaleBillsCount}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-600 font-medium">
              {language === 'ta' ? 'ஹோட்டல் வரவு/செலவு பதிவுகள்' : 'Active Hotel Payments (≤31 days)'}
            </span>
            <span className="font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
              {storageStats.wholesalePaymentsCount}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-600 font-medium">
              {language === 'ta' ? 'சில்லறை விற்பனை பில்கள்' : 'Active Retail Bills (≤31 days)'}
            </span>
            <span className="font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
              {storageStats.retailBillsCount}
            </span>
          </div>
        </div>

        {/* Manual 31-day Cleanup Action */}
        <button
          type="button"
          onClick={handleManualCleanup}
          disabled={isCleaning}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 disabled:opacity-60 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>
            {isCleaning
              ? language === 'ta'
                ? 'சரிபார்க்கிறது...'
                : 'Cleaning...'
              : language === 'ta'
              ? '31 நாட்களுக்கு முந்தைய பதிவுகளை உடனே நீக்கு'
              : 'Run 31-Day Cleanup Now'}
          </span>
        </button>

        {/* Download Backup & Restore from Phone */}
        <div className="pt-2 border-t border-emerald-100 space-y-2">
          <span className="text-xs font-bold text-gray-800 block">
            {language === 'ta' ? 'போன் காப்பு நகல் (Backup & Restore)' : 'Phone Backup & Restore'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'ta' ? 'போனில் சேமி (JSON)' : 'Save to Phone'}</span>
            </button>

            <label className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5 text-slate-700" />
              <span>{language === 'ta' ? 'கோப்பிலிருந்து ஏற்று' : 'Restore File'}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={!!phoneToDelete}
        title={language === 'ta' ? 'போன் எண்ணை நீக்கவா?' : 'Delete phone number?'}
        message={
          language === 'ta'
            ? `"${phoneToDelete ? getHotelName(phoneToDelete, language) : ''}" வாடிக்கையாளரின் பதிவுசெய்த போன் எண்ணை நீக்க விரும்புகிறீர்களா?`
            : `Do you want to remove the saved phone number for "${phoneToDelete ? getHotelName(phoneToDelete, language) : ''}"?`
        }
        itemDetails={phoneToDelete?.phone ? `Phone: ${phoneToDelete.phone}` : undefined}
        confirmLabel={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete'}
        cancelLabel={language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
        language={language}
        onConfirm={() => {
          if (phoneToDelete) {
            handleDeleteHotelPhone(phoneToDelete.id);
            setPhoneToDelete(null);
          }
        }}
        onCancel={() => setPhoneToDelete(null)}
      />

      {/* Reset Standard Hotels Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={resetHotelsConfirm}
        title={language === 'ta' ? '14 ஆரம்ப ஹோட்டல்களை மீட்டமைக்கவா?' : 'Reset standard hotels?'}
        message={
          language === 'ta'
            ? 'அசல் 14 ஹோட்டல் பெயர்களை மீண்டும் ஏற்ற விரும்புகிறீர்களா?'
            : 'Are you sure you want to reset the hotel list to the 14 standard hotels?'
        }
        confirmLabel={language === 'ta' ? 'ஆம், மீட்டமை' : 'Yes, Reset'}
        cancelLabel={language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
        language={language}
        onConfirm={() => {
          handleResetDefaultHotels();
          setResetHotelsConfirm(false);
        }}
        onCancel={() => setResetHotelsConfirm(false)}
      />
    </div>
  );
};
