import React, { useState } from 'react';
import {
  Save,
  Printer,
  Lock,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Type,
  Phone,
  Store,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ShopSettings, Language } from '../types';
import { TRANSLATIONS, LANGUAGES } from '../utils/translations';
import {
  saveSettings,
  clearAllBills,
  clearAllRetailData,
  loadWithoutSkinOffset,
  saveWithoutSkinOffset,
} from '../utils/storage';
import { testPrintBluetooth } from '../utils/bluetoothPrinter';
import { PinPromptModal } from '../components/PinPromptModal';

interface SettingsPageProps {
  settings: ShopSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onExitToPortal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  setSettings,
  language,
  onLanguageChange,
  onExitToPortal,
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
  const [showClearBillsConfirm, setShowClearBillsConfirm] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);

  // Security PIN state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // PIN prompt modal for sensitive actions
  const [pendingAction, setPendingAction] = useState<
    'clearBills' | 'resetAll' | 'changePin' | null
  >(null);

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

  const executeClearBills = () => {
    clearAllBills();
    setShowClearBillsConfirm(false);
    setToastMessage(t.billsClearedSuccessfully);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const executeResetAll = () => {
    clearAllRetailData();
    setShowResetAllConfirm(false);
    setToastMessage(t.dataResetComplete);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handlePinPromptSuccess = () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'clearBills') {
      setShowClearBillsConfirm(true);
    } else if (action === 'resetAll') {
      setShowResetAllConfirm(true);
    } else if (action === 'changePin') {
      setIsChangingPin(true);
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    const updated = { ...formData, securityPin: newPin };
    setFormData(updated);
    setSettings(updated);
    saveSettings(updated);
    setIsChangingPin(false);
    setNewPin('');
    setConfirmPin('');
    setPinError(null);
    setToastMessage(t.pinUpdatedSuccess);
    setTimeout(() => setToastMessage(null), 3000);
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
              placeholder="SSS CHICKEN AGENCY"
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

        {/* Text Size Scale */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-emerald-200 space-y-2.5">
          <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
            <Type className="w-4 h-4 text-emerald-700" />
            <span>{t.textSize}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Current Zoom:{' '}
              <strong className="text-emerald-900">
                {Math.round((formData.fontSizeScale || 1.0) * 100)}%
              </strong>
            </span>
            <div className="flex items-center gap-1.5">
              {[0.9, 1.0, 1.15, 1.3].map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, fontSizeScale: sc })
                  }
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    (formData.fontSizeScale || 1.0) === sc
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  {Math.round(sc * 100)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security PIN Section */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>{t.securityPinLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setPendingAction('changePin')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              <span>{t.changePin}</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            PIN protects sensitive operations like resetting sales data or clearing register records.
          </div>

          {/* Inline Change PIN Form */}
          {isChangingPin && (
            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2.5 animate-in fade-in">
              <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Set New 4-Digit PIN</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {t.newPin}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {t.confirmPin}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>
              {pinError && (
                <div className="text-[10px] font-bold text-red-600">
                  {pinError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewPin}
                  className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Exit to Main Portal */}
        {onExitToPortal && (
          <div className="bg-emerald-50 rounded-3xl p-4 border border-emerald-300 flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-emerald-950">
                Agency Hub
              </div>
              <div className="text-[11px] text-emerald-800 font-medium">
                Switch to Wholesale, Investment, or Master Hub
              </div>
            </div>
            <button
              type="button"
              onClick={onExitToPortal}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <span>Back to Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-red-50/50 rounded-3xl p-4 border border-red-200 space-y-2.5">
          <div className="text-xs font-black text-red-950 uppercase tracking-wider pb-1 border-b border-red-100">
            {t.dangerZone}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPendingAction('clearBills')}
              className="bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="truncate">{t.clearBillRecords}</span>
            </button>
            <button
              type="button"
              onClick={() => setPendingAction('resetAll')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="truncate">{t.resetAllData}</span>
            </button>
          </div>
        </div>
      </form>

      {/* PIN Prompt Modal */}
      <PinPromptModal
        isOpen={pendingAction !== null}
        settings={settings}
        language={language}
        onSuccess={handlePinPromptSuccess}
        onCancel={() => setPendingAction(null)}
      />

      {/* Clear Bills Confirmation Modal */}
      {showClearBillsConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-red-100 text-center">
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              {t.clearBillRecords}?
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              All saved bill receipts in the register will be permanently removed.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowClearBillsConfirm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={executeClearBills}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Confirmation Modal */}
      {showResetAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-red-100 text-center">
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              {t.resetAllData}?
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              This will erase all custom products, saved prices, bills, and settings.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowResetAllConfirm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={executeResetAll}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {t.resetAllData}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
