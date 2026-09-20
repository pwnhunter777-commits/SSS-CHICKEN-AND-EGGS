import React, { useState } from 'react';
import { Globe, Calendar, Store, Home, ArrowLeft } from 'lucide-react';
import { Language, ShopSettings } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../utils/translations';
import { formatDisplayDate } from '../utils/storage';
import { appLogo } from '../../assets/logo';

interface HeaderProps {
  settings: ShopSettings;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onInstallClick?: () => void;
  onFontSizeChange?: (newScale: number) => void;
  onExitToPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentLanguage,
  onLanguageChange,
  onInstallClick,
  onFontSizeChange,
  onExitToPortal,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [fontToast, setFontToast] = useState<string | null>(null);
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const todayFormatted = formatDisplayDate(undefined, currentLanguage);
  const currentScale = settings.fontSizeScale !== undefined ? settings.fontSizeScale : 1.0;

  const handleIncreaseScale = () => {
    let nextScale: number;
    if (currentScale >= 1.4) {
      nextScale = 1.0;
    } else {
      nextScale = Number((currentScale + 0.15).toFixed(2));
    }
    if (onFontSizeChange) {
      onFontSizeChange(nextScale);
    }
    setFontToast(`${Math.round(nextScale * 100)}%`);
    setTimeout(() => setFontToast(null), 1800);
  };

  const handleDecreaseScale = () => {
    const nextScale = Math.max(0.85, Number((currentScale - 0.15).toFixed(2)));
    if (onFontSizeChange) {
      onFontSizeChange(nextScale);
    }
    setFontToast(`${Math.round(nextScale * 100)}%`);
    setTimeout(() => setFontToast(null), 1800);
  };

  return (
    <header className="bg-emerald-800 text-white rounded-b-3xl shadow-lg px-4 pt-3 pb-4 sticky top-0 z-30 transition-all relative">
      {/* Quick Font Size Toast */}
      {fontToast && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white border border-emerald-500/80 px-3 py-1 rounded-full text-xs font-black shadow-xl animate-in fade-in zoom-in-95 flex items-center gap-1.5 pointer-events-none">
          <span>{currentLanguage === 'ta' ? 'எழுத்து அளவு:' : 'Text Size:'}</span>
          <span className="text-emerald-300 font-black">{fontToast}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Hub Return Button + Company Name & Logo */}
        <div className="flex items-center gap-2 min-w-0">
          {onExitToPortal && (
            <button
              type="button"
              onClick={onExitToPortal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-950 active:bg-black text-emerald-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-600/60 active:scale-95 shadow-xs shrink-0 cursor-pointer"
              title="Return to Agency Hub"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Hub</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-full bg-white border-2 border-emerald-300 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            <img
              src={appLogo}
              alt="Chicken Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="truncate">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight truncate">
              {settings.shopName || 'SSS CHICKEN AND EGG AGENCY'}
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-emerald-100 font-medium">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Language Selector */}
        <div className="relative shrink-0 flex items-center gap-1.5">
          {/* Direct Tamil / English 2-way toggle pills */}
          <div className="flex items-center bg-emerald-950/60 p-0.5 rounded-full border border-emerald-600/60">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-white text-emerald-900 shadow'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('ta')}
              className={`px-2 py-0.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentLanguage === 'ta'
                  ? 'bg-white text-emerald-900 shadow'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-1.5 rounded-full bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40 active:scale-95 transition-all cursor-pointer"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-emerald-100 py-1.5 z-50 text-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-100">
                    {t.selectLanguage}
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currentLanguage === lang.code
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-semibold">{lang.native}</span>
                      <span className="text-[11px] text-gray-400 font-normal">
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
