import React, { useState } from 'react';
import {
  Save,
  Printer,
  CheckCircle2,
  Sliders,
  Phone,
  Store,
} from 'lucide-react';
import { ShopSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import {
  saveSettings,
  loadWithoutSkinOffset,
  saveWithoutSkinOffset,
} from '../utils/storage';
import { testPrintBluetooth } from '../utils/bluetoothPrinter';

interface SettingsPageProps {
  settings: ShopSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  onExitToPortal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  setSettings,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [formData, setFormData] = useState<ShopSettings>({
    ...settings,
    withoutSkinOffset:
      settings.withoutSkinOffset !== undefined
        ? settings.withoutSkinOffset
        : loadWithoutSkinOffset(),
    fontSizeScale:
      settings.fontSizeScale !== undefined ? settings.fontSizeScale : 1.0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testPrinting, setTestPrinting] = useState(false);

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveSettings(formData);
    setSettings(formData);
    if (formData.withoutSkinOffset !== undefined) {
      saveWithoutSkinOffset(formData.withoutSkinOffset);
    }
    setToastMessage(t.savedSuccessfully);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTestBluetoothPrinter = async () => {
    setTestPrinting(true);
    try {
      const res = await testPrintBluetooth(formData);
      setToastMessage(res.message);
    } catch (e: any) {
      setToastMessage(e?.message || 'Bluetooth test failed');
    } finally {
      setTestPrinting(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="pb-32 pt-3 px-4 max-w-md mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-800 text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Title */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-200 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            {t.configuration}
          </div>
          <h2 className="text-lg font-black text-emerald-950 mt-0.5">
            {t.settings}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{t.saveSettings}</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        {/* Shop Profile Details */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-emerald-200 space-y-3">
          <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Store className="w-4 h-4 text-emerald-700" />
            <span>{t.shopProfile}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.shopName}
            </label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) =>
                setFormData({ ...formData, shopName: e.target.value })
              }
              placeholder="SSS CHICKEN AND EGG AGENCY"
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-gray-900 text-xs font-bold py-2 px-3 rounded-xl outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.phoneNumber}
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={formData.phoneNumber || ''}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="9876543210"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-gray-900 text-xs font-bold py-2 pl-9 pr-3 rounded-xl outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.receiptFooter}
            </label>
            <input
              type="text"
              value={formData.footerMessage || ''}
              onChange={(e) =>
                setFormData({ ...formData, footerMessage: e.target.value })
              }
              placeholder="Thank you! Visit again"
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-gray-900 text-xs font-bold py-2 px-3 rounded-xl outline-none transition-all"
            />
          </div>
        </div>

        {/* Without Skin Rate Default Offset */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-emerald-200 space-y-3">
          <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>{t.withoutSkinOffsetTitle}</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {t.withoutSkinOffsetDesc}
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-800">
              +₹
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.withoutSkinOffset ?? 50}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  withoutSkinOffset: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-gray-900 text-xs font-bold py-2 pl-9 pr-14 rounded-xl outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              / {language === 'ta' ? 'கிலோ' : 'Kg'}
            </span>
          </div>
        </div>

        {/* Thermal Printer Settings */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-emerald-200 space-y-3">
          <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>{t.bluetoothPrinterConfig}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.printerWidth}
              </label>
              <select
                value={formData.printerWidth || '80mm'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    printerWidth: e.target.value as '58mm' | '80mm',
                  })
                }
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-gray-900 text-xs font-bold py-2 px-2.5 rounded-xl outline-none cursor-pointer"
              >
                <option value="80mm">80mm (3 Inch Standard)</option>
                <option value="58mm">58mm (2 Inch Compact)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.feedLines}
              </label>
              <input
                type="number"
                min="0"
                max="15"
                value={formData.printerFeedLines ?? 8}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    printerFeedLines: parseInt(e.target.value) || 8,
                  })
                }
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-gray-900 text-xs font-bold py-2 px-3 rounded-xl outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestBluetoothPrinter}
            disabled={testPrinting}
            className="w-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {testPrinting ? t.connecting : t.testBluetoothPrinter}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
