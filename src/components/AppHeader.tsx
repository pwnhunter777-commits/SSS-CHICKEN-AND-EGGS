import React, { useState } from 'react';
import { ArrowLeft, Bold, Calendar, Globe, Store, Home, Type } from 'lucide-react';
import { appLogo } from '../assets/logo';
import { AppPage, LanguageCode, ShopSettings } from '../types';
import { formatDisplayDate, getTodayDateString } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';

interface AppHeaderProps {
  settings: ShopSettings;
  language: LanguageCode;
  currentPage?: AppPage;
  onLanguageChange?: (lang: LanguageCode) => void;
  onToggleLanguage?: () => void;
  onToggleBold?: () => void;
  onIncreaseFontSize?: () => void;
  onDecreaseFontSize?: () => void;
  onSetFontSize?: (scale: number) => void;
  onBackToMain?: () => void;
  onExitToPortal?: () => void;
  onBackToPortal?: () => void;
  onNavigateToSettings?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  settings,
  language,
  currentPage = 'billing',
  onLanguageChange,
  onToggleLanguage,
  onToggleBold,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onSetFontSize,
  onBackToMain,
  onExitToPortal,
  onBackToPortal,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(true);
  const todayStr = getTodayDateString();
  const displayDate = formatDisplayDate(todayStr, language);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const currentScale = settings.fontSizeScale || 125;

  const handlePortalExit = onExitToPortal || onBackToPortal;

  const handleSelectLanguage = (langCode: LanguageCode) => {
    if (onLanguageChange) {
      onLanguageChange(langCode);
    } else if (onToggleLanguage) {
      onToggleLanguage();
    }
    setShowLangMenu(false);
  };

  const languages: { code: LanguageCode; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  ];
  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  return (
    <header id="app-header" className="relative bg-gradient-to-r from-emerald-800 via-emerald-800 to-emerald-900 text-white shadow-md shadow-emerald-950/20 rounded-b-3xl px-4 pt-3.5 pb-3.5 z-30 border-b border-emerald-700/60">
      <div className="flex items-center justify-between gap-2">
        {/* Back Button (if on subpage) / Home button to Agency Interface & Company Logo & Name */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {currentPage !== 'billing' && onBackToMain ? (
            <button
              id="btn-header-back-navigation"
              type="button"
              onClick={onBackToMain}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-xl text-xs font-black transition-all border border-white/20 active:scale-95 shadow-2xs flex-shrink-0 cursor-pointer"
              title={language === 'ta' ? 'முதன்மை பக்கத்திற்கு செல் (பில்லிங்)' : 'Back to Main Page (Billing)'}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5] text-white" />
              <span className="font-black">{language === 'ta' ? 'பின்' : 'Back'}</span>
            </button>
          ) : handlePortalExit ? (
            <button
              id="btn-header-exit-to-portal"
              type="button"
              onClick={handlePortalExit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/20 active:scale-95 shadow-2xs flex-shrink-0 cursor-pointer"
              title="Return to Agency Hub"
            >
              <Home className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-xs font-bold">Hub</span>
            </button>
          ) : null}

          <div className="w-10 h-10 rounded-2xl bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-md border border-white/90 overflow-hidden">
            {logoLoaded && appLogo ? (
              <img
                src={appLogo}
                alt="SSS Chicken Agency Logo"
                className="w-full h-full object-cover rounded-xl"
                onError={() => setLogoLoaded(false)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <Store className="w-5 h-5 text-emerald-700" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate uppercase drop-shadow-xs">
              {settings.shopName || 'SSS CHICKEN AGENCY'}
            </h1>
            <p className="text-[11px] text-emerald-100/90 font-medium truncate">
              {settings.address ? settings.address : 'Sulthanpet, Villianur, Puducherry'}
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="relative">
            <button
              id="language-selector-btn"
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md transition-all border border-white/20 shadow-2xs cursor-pointer"
              title={t.language}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-200" />
              <span>{currentLangObj.native}</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 text-slate-900 animate-in fade-in">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {t.language}
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        language === lang.code
                          ? 'bg-emerald-700 text-white font-black'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{lang.native}</span>
                      <span className={`text-[10px] ${language === lang.code ? 'text-emerald-100' : 'text-slate-400'}`}>({lang.label})</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Accessibility Bar for Elderly User: Text Size (A- / 125% / A+) and Date */}
      <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between gap-2">
        {/* Font Size Scaling Controls */}
        <div className="flex items-center gap-1 bg-white/10 border border-white/15 rounded-2xl p-1 shadow-inner backdrop-blur-md">
          <span className="text-[11px] font-bold text-emerald-100 px-1.5 flex items-center gap-1 select-none">
            <Type className="w-3.5 h-3.5 text-emerald-200" />
            <span>{language === 'ta' ? 'எழுத்து' : 'Text'}</span>
          </span>

          {/* Decrease Button A- */}
          <button
            id="btn-header-decrease-text"
            type="button"
            onClick={onDecreaseFontSize}
            disabled={currentScale <= 90}
            className="w-9 h-9 min-h-[36px] bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black flex items-center justify-center transition-all active:scale-95 shadow-2xs border border-white/20 cursor-pointer"
            title={language === 'ta' ? 'எழுத்து அளவை குறைக்க (A-)' : 'Decrease Text Size (A-)'}
          >
            A-
          </button>

          {/* Current Scale Display Pill */}
          <button
            id="header-font-scale-display"
            type="button"
            onClick={onIncreaseFontSize}
            className="px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs min-w-[50px] text-center border border-white/20 cursor-pointer"
            title={language === 'ta' ? 'தற்போதைய எழுத்து அளவு (கூட்ட கிளிக் செய்யவும்)' : 'Current font size scale (Click to increase)'}
          >
            {currentScale}%
          </button>

          {/* Increase Button A+ */}
          <button
            id="btn-header-increase-text"
            type="button"
            onClick={onIncreaseFontSize}
            disabled={currentScale >= 160}
            className="w-9 h-9 min-h-[36px] bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs font-black flex items-center justify-center transition-all active:scale-95 shadow-xs border border-amber-300 cursor-pointer"
            title={language === 'ta' ? 'முதியவருக்கு எழுத்து அளவை கூட்டவும் (A+)' : 'Increase Text Size for Readability (A+)'}
          >
            A+
          </button>
        </div>

        {/* Date Badge */}
        <div
          id="header-date-badge"
          className="flex items-center gap-1.5 bg-white/12 px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-50 border border-white/15 shadow-2xs backdrop-blur-md"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-200" />
          <span className="whitespace-nowrap">{displayDate}</span>
        </div>
      </div>
    </header>
  );
};
