import React, { useState } from 'react';
import { ArrowLeft, Bold, Calendar, Globe, Store, Home } from 'lucide-react';
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
    <header id="app-header" className="relative flex-shrink-0 w-full bg-gradient-to-r from-emerald-800 via-emerald-800 to-emerald-900 text-white shadow-sm shadow-emerald-950/20 rounded-b-xl px-2.5 py-1.5 z-30 border-b border-emerald-700/60">
      <div className="flex items-center justify-between gap-1.5">
        {/* Back Button (if on subpage) / Home button to Agency Interface & Company Logo & Name */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {currentPage !== 'billing' && onBackToMain ? (
            <button
              id="btn-header-back-navigation"
              type="button"
              onClick={onBackToMain}
              className="flex items-center gap-1 px-2 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg text-[11px] font-black transition-all border border-white/20 active:scale-95 shadow-2xs flex-shrink-0 cursor-pointer touch-manipulation"
              title={language === 'ta' ? 'முதன்மை பக்கத்திற்கு செல் (பில்லிங்)' : 'Back to Main Page (Billing)'}
            >
              <ArrowLeft className="w-3 h-3 stroke-[2.5] text-white" />
              <span className="font-black leading-none">{language === 'ta' ? 'பின்' : 'Back'}</span>
            </button>
          ) : handlePortalExit ? (
            <button
              id="btn-header-exit-to-portal"
              type="button"
              onClick={handlePortalExit}
              className="flex items-center gap-1 px-2 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg text-[11px] font-black transition-all border border-white/20 active:scale-95 shadow-2xs flex-shrink-0 cursor-pointer touch-manipulation"
              title="Return to Agency Hub"
            >
              <Home className="w-3 h-3 text-emerald-200" />
              <span className="text-[11px] font-black leading-none">Hub</span>
            </button>
          ) : null}

          <div className="w-7 h-7 rounded-md bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs border border-white/90 overflow-hidden">
            {logoLoaded && appLogo ? (
              <img
                src={appLogo}
                alt="SSS Chicken and Egg Agency Logo"
                className="w-full h-full object-cover rounded-xs"
                onError={() => setLogoLoaded(false)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <Store className="w-4 h-4 text-emerald-700" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-[11px] sm:text-xs font-black tracking-tight text-white uppercase drop-shadow-xs truncate leading-tight">
              {settings.shopName || 'SSS CHICKEN AND EGG AGENCY'}
            </h1>
            <p className="text-[9px] text-emerald-100/90 font-bold truncate leading-none mt-0.5">
              {settings.address ? settings.address : 'Sulthanpet, Villianur, Puducherry'}
            </p>
          </div>
        </div>

        {/* Right Controls: Date Badge & Language Selector */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Date Badge */}
          <div
            id="header-date-badge"
            className="flex items-center gap-1 bg-white/12 px-1.5 py-1 rounded-lg text-[9.5px] font-black text-emerald-50 border border-white/15 shadow-2xs backdrop-blur-md whitespace-nowrap"
          >
            <Calendar className="w-3 h-3 text-emerald-200 flex-shrink-0" />
            <span className="leading-none">{displayDate}</span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              id="language-selector-btn"
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white px-2 py-1 rounded-lg text-[11px] font-black backdrop-blur-md transition-all border border-white/20 shadow-2xs cursor-pointer touch-manipulation"
              title={t.language}
            >
              <Globe className="w-3 h-3 text-emerald-200" />
              <span className="leading-none">{currentLangObj.native}</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1 z-50 text-slate-900 animate-in fade-in">
                  <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {t.language}
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full min-h-[2.2rem] text-left px-2.5 py-1.5 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer touch-manipulation ${
                        language === lang.code
                          ? 'bg-emerald-700 text-white font-black'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="leading-normal">{lang.native}</span>
                      <span className={`text-[9px] ${language === lang.code ? 'text-emerald-100' : 'text-slate-400'}`}>({lang.label})</span>
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
