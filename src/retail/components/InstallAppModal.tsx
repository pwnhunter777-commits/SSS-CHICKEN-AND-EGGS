import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share,
  MoreVertical,
  WifiOff,
  Zap,
  X,
} from 'lucide-react';
import { Language, ShopSettings } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { appLogo } from '../../assets/logo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  settings: ShopSettings;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  language,
  settings,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running in standalone / installed mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header with Mascot Logo */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-5 flex flex-col items-center justify-center relative text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-950/60 hover:bg-emerald-950 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg border-2 border-emerald-300 mb-2 relative overflow-hidden flex items-center justify-center">
            <img
              src={appLogo}
              alt="Chicken Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-200">
            <Smartphone className="w-3.5 h-3.5" />
            <span>PWA POS Terminal</span>
          </div>
          <h3 className="text-lg font-black text-white mt-0.5">
            {t.installApp}
          </h3>
          <p className="text-xs text-emerald-100/90 font-medium mt-1">
            {t.installAppDesc}
          </p>
        </div>

        {/* Benefits Badges */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="text-[11px] font-bold text-emerald-950 leading-tight">
                {language === 'ta' ? '1-தட்டல் தொடக்கம்' : '1-Tap Launch'}
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="text-[11px] font-bold text-emerald-950 leading-tight">
                {t.pwaOfflineReady}
              </div>
            </div>
          </div>

          {/* If already in standalone or installed */}
          {isStandalone || isInstalled ? (
            <div className="bg-emerald-100 border-2 border-emerald-400 rounded-2xl p-3 flex items-center gap-2.5 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <div className="text-xs font-extrabold leading-tight">
                {t.appInstalled}
                <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                  {t.standaloneActive}
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-sm py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>{t.installNow}</span>
            </button>
          ) : null}

          {/* Step-by-step Manual Guide (Chrome/Android & Safari/iOS) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
            <div className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide flex items-center gap-1">
              <span>{t.howToInstall}</span>
            </div>

            {/* Android / Chrome */}
            <div className="flex items-start gap-2 text-slate-700 pt-1 border-t border-slate-200/60">
              <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                <MoreVertical className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] font-medium leading-relaxed">
                <strong className="text-slate-900">Android / Chrome:</strong>{' '}
                {t.androidInstallStep}
              </div>
            </div>

            {/* iOS / Safari */}
            <div className="flex items-start gap-2 text-slate-700 pt-1 border-t border-slate-200/60">
              <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                <Share className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] font-medium leading-relaxed">
                <strong className="text-slate-900">iPhone / iPad (Safari):</strong>{' '}
                {t.iosInstallStep}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 text-center rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
