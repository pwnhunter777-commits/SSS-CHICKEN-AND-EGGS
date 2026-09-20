import React, { useState, useEffect } from 'react';
import { Building2, Store, Settings as SettingsIcon, Layers, RefreshCw, CheckCircle2, ArrowDown } from 'lucide-react';
import { SettingsPage as WholesaleSettingsPage } from '../../components/SettingsPage';
import { SettingsPage as RetailSettingsPage } from '../../retail/pages/SettingsPage';
import {
  loadSettings as loadWholesaleSettings,
  saveSettings as saveWholesaleSettings,
  loadBills as loadWholesaleBills,
  loadHotels as loadWholesaleHotels,
  saveHotels as saveWholesaleHotels,
} from '../../utils/storage';
import {
  loadSettings as loadRetailSettings,
  saveSettings as saveRetailSettings,
} from '../../retail/utils/storage';
import {
  ShopSettings as WholesaleSettingsType,
  HotelItem,
  Bill,
  LanguageCode,
} from '../../types';
import { ShopSettings as RetailSettingsType } from '../../retail/types';

interface InvestmentSettingsPageProps {
  language: LanguageCode;
}

export const InvestmentSettingsPage: React.FC<InvestmentSettingsPageProps> = ({
  language,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'combined' | 'wholesale' | 'retail'>('combined');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Wholesale State
  const [wholesaleSettings, setWholesaleSettings] = useState<WholesaleSettingsType>(() =>
    loadWholesaleSettings()
  );
  const [wholesaleBills, setWholesaleBills] = useState<Bill[]>(() =>
    loadWholesaleBills()
  );
  const [wholesaleHotels, setWholesaleHotels] = useState<HotelItem[]>(() =>
    loadWholesaleHotels()
  );

  // Retail State
  const [retailSettings, setRetailSettings] = useState<RetailSettingsType>(() =>
    loadRetailSettings()
  );

  // Synchronize state when switching tabs or viewing combined to ensure latest data is shown
  useEffect(() => {
    setWholesaleHotels(loadWholesaleHotels());
    setWholesaleBills(loadWholesaleBills());
    setWholesaleSettings(loadWholesaleSettings());
    setRetailSettings(loadRetailSettings());
  }, [activeSettingsTab]);

  const handleSaveWholesale = (newSettings: WholesaleSettingsType) => {
    setWholesaleSettings(newSettings);
    saveWholesaleSettings(newSettings);
  };

  const handleSaveHotels = (newHotels: HotelItem[]) => {
    setWholesaleHotels(newHotels);
    saveWholesaleHotels(newHotels);
  };

  const handleWholesaleDataRestored = () => {
    setWholesaleSettings(loadWholesaleSettings());
    setWholesaleBills(loadWholesaleBills());
    setWholesaleHotels(loadWholesaleHotels());
  };

  const handleSyncWholesaleToRetail = () => {
    const updatedRetail: RetailSettingsType = {
      ...retailSettings,
      shopName: wholesaleSettings.shopNameEn || wholesaleSettings.shopNameTa || retailSettings.shopName,
      phoneNumber: wholesaleSettings.phoneNumber || retailSettings.phoneNumber,
      address: wholesaleSettings.address || retailSettings.address,
      upiId: wholesaleSettings.upiId || retailSettings.upiId,
    };
    setRetailSettings(updatedRetail);
    saveRetailSettings(updatedRetail);
    setSyncToast(
      language === 'ta'
        ? 'மொத்த விற்பனை விவரங்கள் சில்லறை விற்பனைக்கு வெற்றிகரமாக ஒத்திசைக்கப்பட்டது!'
        : 'Wholesale shop profile details successfully synced to Retail!'
    );
    setTimeout(() => setSyncToast(null), 3500);
  };

  return (
    <div id="investment-settings-page" className="pb-8 pt-2 px-3 sm:px-4 max-w-md mx-auto animate-in fade-in">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-800 text-white py-2.5 px-3.5 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span className="text-xs font-black">{syncToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-emerald-200 mb-3">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <SettingsIcon className="w-5 h-5 text-emerald-700" />
          <h2 className="text-sm sm:text-base font-black text-emerald-950">
            {language === 'ta' ? 'அமைப்புகள் மையம்' : 'Agency Settings Hub'}
          </h2>
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          {language === 'ta'
            ? 'மொத்த விற்பனை மற்றும் சில்லறை விற்பனை அமைப்புகளை இங்கே ஒரே பார்வையில் ஒருங்கிணைத்து நிர்வகிக்கலாம்.'
            : 'Configure and manage both Wholesale and Retail shop settings seamlessly in one combined interface.'}
        </p>

        {/* Combined Dual Settings Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            id="btn-switch-combined-settings"
            onClick={() => setActiveSettingsTab('combined')}
            className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98 ${
              activeSettingsTab === 'combined'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {language === 'ta' ? 'இரண்டும் (Combined)' : 'Combined (All)'}
            </span>
          </button>

          <button
            type="button"
            id="btn-switch-wholesale-settings"
            onClick={() => setActiveSettingsTab('wholesale')}
            className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98 ${
              activeSettingsTab === 'wholesale'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {language === 'ta' ? 'மொத்த விற்பனை' : 'Wholesale'}
            </span>
          </button>

          <button
            type="button"
            id="btn-switch-retail-settings"
            onClick={() => setActiveSettingsTab('retail')}
            className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98 ${
              activeSettingsTab === 'retail'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-white/60'
            }`}
          >
            <Store className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {language === 'ta' ? 'சில்லறை விற்பனை' : 'Retail'}
            </span>
          </button>
        </div>
      </div>

      {/* Combined View: Render Both Wholesale & Retail Together */}
      {activeSettingsTab === 'combined' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Quick Profile Sync Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 rounded-2xl p-3 border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">
                    {language === 'ta' ? 'விவரங்களை ஒத்திசை' : 'Sync Profile Info'}
                  </h4>
                  <p className="text-[10px] text-emerald-800 font-medium">
                    {language === 'ta'
                      ? 'மொத்த விற்பனை பெயர் & போன் எண்ணை சில்லறைக்கும் பயன்படுத்து'
                      : 'Copy Name, Phone & UPI from Wholesale to Retail'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncWholesaleToRetail}
                className="py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{language === 'ta' ? 'ஒத்திசை' : 'Sync to Retail'}</span>
              </button>
            </div>

            {/* Quick Navigation Anchor Links */}
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-emerald-200/70 text-[10px]">
              <span className="text-slate-500 font-bold">
                {language === 'ta' ? 'விரைவு வழிசெலுத்தல்:' : 'Quick Jump:'}
              </span>
              <a
                href="#section-combined-wholesale"
                className="inline-flex items-center gap-0.5 font-black text-emerald-800 bg-white/80 hover:bg-white px-2 py-0.5 rounded-md border border-emerald-200"
              >
                <Building2 className="w-2.5 h-2.5" />
                <span>{language === 'ta' ? 'மொத்த விற்பனை' : 'Wholesale'}</span>
                <ArrowDown className="w-2.5 h-2.5" />
              </a>
              <a
                href="#section-combined-retail"
                className="inline-flex items-center gap-0.5 font-black text-emerald-800 bg-white/80 hover:bg-white px-2 py-0.5 rounded-md border border-emerald-200"
              >
                <Store className="w-2.5 h-2.5" />
                <span>{language === 'ta' ? 'சில்லறை விற்பனை' : 'Retail'}</span>
                <ArrowDown className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Section 1: Wholesale Settings */}
          <div id="section-combined-wholesale" className="scroll-mt-16">
            <div className="bg-emerald-800 text-white px-3 py-2 rounded-2xl flex items-center justify-between mb-2 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-200" />
                <span className="text-xs font-black tracking-wide">
                  {language === 'ta' ? '1. மொத்த விற்பனை அமைப்புகள் (Agency)' : '1. Wholesale Settings (Agency)'}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                {language === 'ta' ? 'பில்கள் & ஹோட்டல்கள்' : 'Bills & Hotels'}
              </span>
            </div>

            <WholesaleSettingsPage
              settings={wholesaleSettings}
              bills={wholesaleBills}
              hotels={wholesaleHotels}
              language={language}
              onSaveSettings={handleSaveWholesale}
              onSaveHotels={handleSaveHotels}
              onDataRestored={handleWholesaleDataRestored}
            />
          </div>

          {/* Section 2: Retail Settings */}
          <div id="section-combined-retail" className="scroll-mt-16 pt-2">
            <div className="bg-emerald-900 text-white px-3 py-2 rounded-2xl flex items-center justify-between mb-2 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-black tracking-wide">
                  {language === 'ta' ? '2. சில்லறை விற்பனை அமைப்புகள் (Stall)' : '2. Retail Settings (Stall)'}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                {language === 'ta' ? 'கடை & கழிவு' : 'Stall & Offsets'}
              </span>
            </div>

            <RetailSettingsPage
              settings={retailSettings}
              setSettings={setRetailSettings}
              language={language === 'ta' ? 'ta' : 'en'}
            />
          </div>
        </div>
      )}

      {/* Wholesale Only Tab View */}
      {activeSettingsTab === 'wholesale' && (
        <div className="animate-in fade-in">
          <WholesaleSettingsPage
            settings={wholesaleSettings}
            bills={wholesaleBills}
            hotels={wholesaleHotels}
            language={language}
            onSaveSettings={handleSaveWholesale}
            onSaveHotels={handleSaveHotels}
            onDataRestored={handleWholesaleDataRestored}
          />
        </div>
      )}

      {/* Retail Only Tab View */}
      {activeSettingsTab === 'retail' && (
        <div className="animate-in fade-in">
          <RetailSettingsPage
            settings={retailSettings}
            setSettings={setRetailSettings}
            language={language === 'ta' ? 'ta' : 'en'}
          />
        </div>
      )}
    </div>
  );
};
