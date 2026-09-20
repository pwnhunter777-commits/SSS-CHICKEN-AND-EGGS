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
  Archive,
} from 'lucide-react';
import { appLogo } from '../assets/logo';
import { Bill, DEFAULT_HOTELS, getHotelName, HotelItem, LanguageCode, ShopSettings } from '../types';
import { saveOrUpdateHotelPhone } from '../utils/storage';
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
    shopNameTa: settings.shopNameTa || 'எஸ்.எஸ்.எஸ். சிக்கன் & முட்டை ஏஜென்சி',
    phoneNumber: settings.phoneNumber || '',
    gstNumber: settings.gstNumber || '',
    address: settings.address || '',
    addressTa: settings.addressTa || 'எண் 6, பாண்டி மெயின் ரோடு, சுல்தான்பேட்டை, வில்லியனூர், புதுச்சேரி - 605 110',
    upiId: settings.upiId || '',
    billWidthCm: settings.billWidthCm || 19,
    fontSizeScale: settings.fontSizeScale || 100,
    isBoldText: settings.isBoldText || false,
    retentionDays: settings.retentionDays !== undefined ? settings.retentionDays : 31,
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
    <div id="page-settings" className="pb-6 pt-2 px-2.5 max-w-md mx-auto space-y-2 animate-in fade-in">
      {/* Page Title */}
      <div className="flex items-center gap-1.5">
        <Settings className="w-4 h-4 text-emerald-700" />
        <h2 className="text-xs sm:text-sm font-black text-emerald-950">{t.settings}</h2>
      </div>

      {/* Official Business Branding Badge Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-2xl p-2.5 shadow-md flex items-center gap-2.5 border border-emerald-700/60">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 flex-shrink-0 shadow-2xs border-2 border-amber-300">
          <img
            src={appLogo}
            alt="SSS Chicken and Egg Agency Logo"
            className="w-full h-full object-cover rounded-lg"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="font-black text-xs sm:text-sm tracking-wide uppercase text-white break-words leading-tight">
              {formData.shopName || 'SSS CHICKEN AND EGG AGENCY'}
            </h3>
          </div>
          <p className="text-[10px] text-emerald-100 font-bold break-words leading-tight mt-0.5">
            {formData.phoneNumber || '8680000003'}
          </p>
          <p className="text-[9px] text-amber-200 font-bold break-words leading-tight">
            GST: {formData.gstNumber || '34AQPN8846J2ZF'}
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="bg-emerald-600 text-white p-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{t.saveSettingsSuccess}</span>
        </div>
      )}

      {fileStatus && (
        <div
          className={`p-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs animate-in fade-in slide-in-from-top-2 ${
            fileStatus.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{fileStatus.text}</span>
        </div>
      )}

      {/* Settings Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-emerald-200 rounded-2xl p-3 shadow-2xs space-y-2">
        {/* 1. Shop Name */}
        <div>
          <label className="block text-[10px] font-black text-gray-700 mb-1 flex items-center gap-1 leading-tight">
            <Store className="w-3 h-3 text-emerald-700" />
            <span>1. {t.shopName}</span>
          </label>
          <input
            id="setting-input-shop-name"
            type="text"
            value={formData.shopName}
            onChange={(e) => handleChange('shopName', e.target.value)}
            placeholder="SSS CHICKEN AND EGG AGENCY"
            required
            className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none transition-all leading-normal"
          />
        </div>

        {/* 2. Phone Number */}
        <div>
          <label className="block text-[10px] font-black text-gray-700 mb-1 flex items-center gap-1 leading-tight">
            <Phone className="w-3 h-3 text-emerald-700" />
            <span>2. {t.phoneNumber}</span>
          </label>
          <input
            id="setting-input-phone"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="8680000003"
            className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none transition-all leading-normal"
          />
        </div>

        {/* 3. GST Number */}
        <div>
          <label className="block text-[10px] font-black text-gray-700 mb-1 flex items-center gap-1 leading-tight">
            <FileText className="w-3 h-3 text-emerald-700" />
            <span>3. {t.gstNumber}</span>
          </label>
          <input
            id="setting-input-gst"
            type="text"
            value={formData.gstNumber}
            onChange={(e) => handleChange('gstNumber', e.target.value)}
            placeholder="34AQPN8846J2ZF"
            className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none transition-all uppercase leading-normal"
          />
        </div>

        {/* 4. Address */}
        <div>
          <label className="block text-[10px] font-black text-gray-700 mb-1 flex items-center gap-1 leading-tight">
            <MapPin className="w-3 h-3 text-emerald-700" />
            <span>4. {t.address}</span>
          </label>
          <textarea
            id="setting-input-address"
            rows={2}
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110"
            className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none transition-all resize-none leading-normal"
          />
        </div>

        {/* 5. UPI ID */}
        <div>
          <label className="block text-[10px] font-black text-gray-700 mb-1 flex items-center gap-1 leading-tight">
            <QrCode className="w-3 h-3 text-emerald-700" />
            <span>5. {t.upiId}</span>
          </label>
          <input
            id="setting-input-upi"
            type="text"
            value={formData.upiId}
            onChange={(e) => handleChange('upiId', e.target.value)}
            placeholder="NAZIRAHAMED0003@okhdfcbank"
            className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none transition-all leading-normal"
          />
        </div>

        {/* 6. Default Bill Print Width */}
        <div>
          <label className="block text-[10px] font-black text-gray-700 mb-1 flex items-center gap-1 leading-tight">
            <Printer className="w-3 h-3 text-emerald-700" />
            <span>6. {language === 'ta' ? 'பில் அகலம் (Bill Width)' : 'Bill Print Width'}</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="setting-input-bill-width"
              type="number"
              min="5"
              max="30"
              step="1"
              value={formData.billWidthCm || 19}
              onChange={(e) => handleChange('billWidthCm', Number(e.target.value) || 19)}
              className="w-24 min-h-[2.4rem] px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-xs font-black text-gray-900 outline-none leading-normal"
            />
            <span className="text-xs font-black text-emerald-950">cm</span>
          </div>
        </div>

        {/* 7. Font Size Controller */}
        <div className="bg-emerald-50/60 border border-emerald-300/80 rounded-xl p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-gray-800 flex items-center gap-1 leading-tight">
              <Type className="w-3.5 h-3.5 text-emerald-700" />
              <span>7. {language === 'ta' ? 'எழுத்து அளவு (Font Size)' : 'Bill & App Font Size'}</span>
            </label>
            <span className="text-[10px] font-black text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
              {getScaleLabel(currentFontSizeScale)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <button
              id="btn-decrease-font-size"
              type="button"
              onClick={handleDecreaseFontSize}
              disabled={currentFontSizeScale <= 75}
              className="flex-1 min-h-[2.4rem] py-1.5 px-2 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-black text-xs flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95 touch-manipulation cursor-pointer"
              title={language === 'ta' ? 'அளவை குறைக்கவும்' : 'Decrease font size'}
            >
              <Minus className="w-3.5 h-3.5 text-white" />
              <span>{language === 'ta' ? 'குறை (-)' : 'Decrease (-)'}</span>
            </button>

            <div className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-mono font-black text-xs sm:text-sm shadow-2xs min-w-[56px] text-center">
              {currentFontSizeScale}%
            </div>

            <button
              id="btn-increase-font-size"
              type="button"
              onClick={handleIncreaseFontSize}
              disabled={currentFontSizeScale >= 165}
              className="flex-1 min-h-[2.4rem] py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-black text-xs flex items-center justify-center gap-1 shadow-2xs shadow-emerald-700/20 transition-all active:scale-95 touch-manipulation cursor-pointer"
              title={language === 'ta' ? 'அளவை கூட்டவும்' : 'Increase font size'}
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>{language === 'ta' ? 'கூட்டு (+)' : 'Increase (+)'}</span>
            </button>
          </div>

          {/* Bold Text Toggle Button */}
          <button
            id="btn-toggle-bold-text"
            type="button"
            onClick={handleToggleBold}
            className={`w-full min-h-[2.4rem] py-1.5 px-2.5 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 touch-manipulation text-white cursor-pointer ${
              isBoldActive
                ? 'bg-slate-950 ring-2 ring-emerald-400 shadow-emerald-950/20'
                : 'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 shadow-slate-900/20'
            }`}
          >
            <Bold className={`w-3.5 h-3.5 ${isBoldActive ? 'text-amber-300 stroke-[3]' : 'text-white'}`} />
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

        {/* Data Retention & Archival Setting Card */}
        <div className="bg-white border border-emerald-200 rounded-xl p-2.5 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1.5 pb-1 border-b border-emerald-100">
            <Archive className="w-3.5 h-3.5 text-emerald-700" />
            <div className="min-w-0 flex-1">
              <label htmlFor="retention-days-select" className="text-[10px] font-black text-emerald-950 uppercase tracking-wide block leading-tight">
                {t.dataRetention}
              </label>
              <p className="text-[9px] text-emerald-700 font-bold leading-tight">
                {t.dataRetentionDesc}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <select
              id="retention-days-select"
              value={formData.retentionDays !== undefined ? formData.retentionDays : 31}
              onChange={(e) => handleChange('retentionDays', Number(e.target.value))}
              className="w-full min-h-[2.4rem] px-2.5 py-1.5 rounded-lg border border-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-xs bg-emerald-50/50 font-black text-emerald-950 cursor-pointer"
            >
              <option value={31}>{t.retention31}</option>
              <option value={60}>{t.retention60}</option>
              <option value={90}>{t.retention90}</option>
              <option value={180}>{t.retention180}</option>
              <option value={365}>{t.retention365}</option>
              <option value={0}>{t.retentionForever}</option>
            </select>
            <p className="text-[9px] text-slate-500 font-bold leading-tight">
              {language === 'ta'
                ? 'பழைய பில்கள் காப்பகப்படுத்தப்பட்டாலும் ஹோட்டல் மீதி பாக்கி எப்போதும் ஆரம்ப இருப்பாகப் பாதுகாக்கப்படும்.'
                : 'When old bills are archived, all hotel dues are safely preserved as opening balances.'}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-1">
          <button
            id="btn-save-settings"
            type="submit"
            className="w-full min-h-[2.6rem] py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl shadow-2xs shadow-emerald-700/25 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{t.save}</span>
          </button>
        </div>
      </form>

      {/* Hotel & Customer Names Management Card with Phone Number Setup */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-3 shadow-2xs space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100 flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wide leading-tight">
              {t.hotelsAndCustomers} ({hotels.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setResetHotelsConfirm(true)}
            title="Reset to 14 standard hotels"
            className="text-[10px] font-black text-white flex items-center gap-1 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 px-2 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-white" />
            <span>{t.resetHotels}</span>
          </button>
        </div>

        {/* Add New Hotel Form */}
        <form onSubmit={handleAddHotel} className="space-y-1.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
          <div className="text-[10px] font-black text-emerald-950 flex items-center gap-1 leading-tight">
            <Plus className="w-3 h-3 text-emerald-700" />
            <span>{t.addHotel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <input
              type="text"
              value={newHotelNameEn}
              onChange={(e) => setNewHotelNameEn(e.target.value)}
              placeholder={t.hotelNameEn + ' (e.g. Star Biriyani)'}
              className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg text-xs font-black text-gray-900 outline-none leading-normal"
            />
            <input
              type="text"
              value={newHotelNameTa}
              onChange={(e) => setNewHotelNameTa(e.target.value)}
              placeholder={t.hotelNameTa + ' (உ.ம். ஸ்டார் பிரியாணி)'}
              className="w-full min-h-[2.4rem] px-2.5 py-1.5 bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg text-xs font-black text-gray-900 outline-none leading-normal"
            />
          </div>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="tel"
                value={newHotelPhone}
                onChange={(e) => setNewHotelPhone(e.target.value)}
                placeholder={language === 'ta' ? 'வாட்ஸ்அப் எண் (உ.ம்: 9876543210)' : 'WhatsApp Phone (Optional - e.g. 9876543210)'}
                className="w-full min-h-[2.4rem] pl-7 pr-2.5 py-1.5 bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg text-xs font-black text-gray-900 outline-none leading-normal"
              />
              <Phone className="w-3 h-3 text-emerald-600 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="min-h-[2.4rem] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all active:scale-95 shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3 h-3" />
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
            className="w-full min-h-[2.4rem] pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs font-black text-gray-800 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
        </div>

        {/* Hotel list with phone setup */}
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
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
                  className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 p-2 rounded-xl transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-emerald-950 block truncate leading-tight">
                        {displayName}
                      </span>
                      {secondaryName && secondaryName !== displayName && (
                        <span className="text-[9px] text-gray-500 font-bold block truncate leading-tight">{secondaryName}</span>
                      )}
                    </div>
                    {hotel.phone && (
                      <span className="text-[9px] text-emerald-800 bg-emerald-100 font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{hotel.phone}</span>
                      </span>
                    )}
                  </div>

                  {/* Hotel Phone Input + Save + Delete */}
                  <div className="flex items-center gap-1">
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
                        className="w-full min-h-[2.2rem] pl-6 pr-2 py-1 bg-white border border-slate-300 focus:border-emerald-600 rounded-lg text-xs font-black text-gray-900 outline-none"
                      />
                      <Phone className="w-3 h-3 text-emerald-600 absolute left-1.5 top-1.5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveHotelPhone(hotel.id)}
                      title="Save Phone Number"
                      className="min-h-[2.2rem] px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs transition-all active:scale-95 flex-shrink-0 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>{language === 'ta' ? 'சேமி' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneToDelete(hotel)}
                      title={language === 'ta' ? `போன் எண் நீக்கு (${displayName})` : `Delete Phone Number for ${displayName}`}
                      className="min-h-[2.2rem] p-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-black flex items-center justify-center transition-colors active:scale-95 flex-shrink-0 shadow-2xs cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
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
