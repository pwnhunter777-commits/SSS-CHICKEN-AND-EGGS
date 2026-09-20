import React, { useState } from 'react';
import { Pencil, Check, ArrowRight, SlidersHorizontal, RotateCcw, X, Info, ChevronRight, TrendingUp, Truck, Store } from 'lucide-react';
import { ChickenLogo } from './ChickenLogo';
import { SECTORS } from '../data/sectors';
import { StoreConfig } from '../types';

interface MainScreenProps {
  storeConfig: StoreConfig;
  onUpdateStoreConfig: (config: StoreConfig) => void;
  onSelectSector?: (sectorId: 'investment' | 'wholesale' | 'retail') => void;
  onNavigateToLogin?: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  storeConfig,
  onUpdateStoreConfig,
  onSelectSector,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(storeConfig.name);
  const [tempFontSize, setTempFontSize] = useState(storeConfig.fontSize);
  const [infoSector, setInfoSector] = useState<'investment' | 'retail' | null>(null);

  const handleOpenEdit = () => {
    setTempName(storeConfig.name);
    setTempFontSize(storeConfig.fontSize);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const cleanName = tempName.trim() || 'SSS CHICKEN AND EGG AGENCY';
    onUpdateStoreConfig({
      name: cleanName,
      fontSize: tempFontSize,
    });
    setIsEditing(false);
  };

  const handleResetName = () => {
    setTempName('SSS CHICKEN AND EGG AGENCY');
    setTempFontSize(26);
  };

  const handleCardClick = (sectorId: 'investment' | 'wholesale' | 'retail') => {
    if (sectorId === 'wholesale') {
      if (onSelectSector) {
        onSelectSector('wholesale');
      }
    } else if (sectorId === 'retail') {
      if (onSelectSector) {
        onSelectSector('retail');
      }
    } else if (sectorId === 'investment') {
      if (onSelectSector) {
        onSelectSector('investment');
      }
    } else {
      setInfoSector(sectorId);
    }
  };

  return (
    <div id="main-mobile-screen" className="flex flex-col flex-1 w-full max-w-md mx-auto px-6 py-6 sm:py-8 justify-between overflow-y-auto">
      {/* Center Branding Section */}
      <div className="flex flex-col items-center text-center mb-6 pt-1">
        {/* Rooster Medallion Emblem Logo */}
        <div className="mb-3.5 relative group">
          <ChickenLogo size="xl" id="top-chicken-logo" className="ring-4 ring-amber-600/30 shadow-xl" />
        </div>

        {/* Store/Agency Name with responsive typography and minimal Edit button/icon */}
        <div className="relative flex items-center justify-center gap-2 w-full max-w-full px-2">
          <h1
            id="store-agency-name"
            style={{
              fontSize: `clamp(18px, ${storeConfig.fontSize || 22}px, 24px)`,
              lineHeight: 1.25,
            }}
            className="font-black tracking-tight text-neutral-950 text-center transition-all duration-150 drop-shadow-xs max-w-full text-balance"
          >
            {storeConfig.name}
          </h1>

          <button
            id="edit-store-name-btn"
            onClick={handleOpenEdit}
            className={`p-2 min-h-[2.5rem] min-w-[2.5rem] flex items-center justify-center rounded-full transition-all touch-manipulation cursor-pointer shrink-0 ${
              isEditing
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-neutral-400 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
            aria-label="Edit store name and typography"
            title="Edit store name and font size"
          >
            <Pencil size={17} />
          </button>
        </div>

        {/* Unobtrusive Clean Edit Panel */}
        {isEditing && (
          <div
            id="edit-store-controls-panel"
            className="w-full mt-4 p-4 rounded-2xl bg-neutral-100/90 border border-neutral-200 shadow-xs text-left animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal size={14} />
                Store Branding Controls
              </span>
              <button
                id="reset-store-defaults-btn"
                onClick={handleResetName}
                className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1 min-h-[2.5rem] px-2 py-1 rounded-lg touch-manipulation cursor-pointer"
                title="Reset to default"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Store Name Input */}
              <div>
                <label htmlFor="store-name-input" className="block text-xs font-bold text-neutral-700 mb-1">
                  Store / Agency Name
                </label>
                <input
                  id="store-name-input"
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={40}
                  placeholder="Enter store name..."
                  className="w-full min-h-[3rem] px-3.5 py-2 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800 text-neutral-900 placeholder:text-neutral-400 transition-all leading-normal"
                />
              </div>

              {/* Font Size Adjustment Slider & Presets */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-neutral-700 mb-1">
                  <span>Store Name Font Size</span>
                  <span className="font-semibold text-neutral-800 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                    {tempFontSize}px
                  </span>
                </div>
                <input
                  id="store-font-size-slider"
                  type="range"
                  min={20}
                  max={42}
                  step={1}
                  value={tempFontSize}
                  onChange={(e) => setTempFontSize(Number(e.target.value))}
                  className="w-full accent-neutral-900 cursor-pointer h-2 bg-neutral-300 rounded-lg appearance-none"
                  aria-label="Adjust store name font size"
                />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[22, 26, 30, 36].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTempFontSize(size)}
                      className={`min-h-[3rem] text-xs py-2 px-2.5 rounded-xl border transition-all flex items-center justify-center font-bold touch-manipulation cursor-pointer ${
                        tempFontSize === size
                          ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/70">
                <button
                  id="cancel-edit-btn"
                  onClick={() => setIsEditing(false)}
                  className="min-h-[3rem] px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 rounded-xl transition-colors touch-manipulation cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  id="save-edit-btn"
                  onClick={handleSaveEdit}
                  className="min-h-[3rem] flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors shadow-xs touch-manipulation cursor-pointer"
                >
                  <Check size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Three Large Rounded Rectangular Navigation Cards Arranged Vertically with Equal Spacing */}
      <div id="navigation-cards-container" className="flex flex-col space-y-3.5 my-auto w-full">
        {SECTORS.map((sector) => {
          const isWholesale = sector.id === 'wholesale';
          return (
            <button
              key={sector.id}
              id={`nav-card-${sector.id}`}
              type="button"
              onClick={() => handleCardClick(sector.id as 'investment' | 'wholesale' | 'retail')}
              className={`group w-full min-h-[4.5rem] text-left px-5 py-4 sm:py-4.5 rounded-2xl bg-white shadow-xs active:scale-[0.985] transition-all duration-200 flex items-center justify-between gap-4 select-none cursor-pointer border-2 touch-manipulation ${
                isWholesale
                  ? 'border-emerald-600/60 hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-900/10'
                  : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md hover:shadow-slate-300/40'
              }`}
              aria-label={`Open ${sector.title} division`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xs flex-shrink-0 ${
                    isWholesale
                      ? 'bg-emerald-700 text-white group-hover:bg-emerald-800'
                      : 'bg-emerald-50 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white'
                  }`}
                >
                  {sector.id === 'investment' && <TrendingUp size={24} className="transition-transform group-hover:scale-110" />}
                  {sector.id === 'wholesale' && <Truck size={24} className="transition-transform group-hover:scale-110" />}
                  {sector.id === 'retail' && <Store size={24} className="transition-transform group-hover:scale-110" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-950 transition-colors tracking-tight leading-snug truncate">
                    {sector.title}
                  </h2>
                  {isWholesale && (
                    <span className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider block leading-normal mt-0.5 truncate">
                      Active POS & Invoicing
                    </span>
                  )}
                </div>
              </div>

              {/* Right-facing arrow */}
              <div
                className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs ${
                  isWholesale
                    ? 'bg-emerald-50 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-700 group-hover:text-white'
                }`}
              >
                <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Informative Division Modal for Investment / Retail */}
      {infoSector && (
        <div
          id="sector-info-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            id="sector-info-modal"
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 text-left animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                  <Info size={16} />
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  {infoSector === 'investment' ? 'Investment Division' : 'Retail Division'}
                </h3>
              </div>
              <button
                id="close-sector-info-btn"
                type="button"
                onClick={() => setInfoSector(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-neutral-600 text-xs sm:text-sm leading-relaxed mb-6">
              {infoSector === 'investment' ? (
                <>
                  <p>
                    The <strong>Investment Division</strong> manages capital allocation, commercial poultry farm partnerships, hatcheries, and feed supply agreements.
                  </p>
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1.5 text-neutral-700 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Active Farms:</span>
                      <span className="font-bold">12 Partner Farms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Capacity:</span>
                      <span className="font-bold">85,000 birds/cycle</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Status:</span>
                      <span className="font-bold text-emerald-700">Fully Funded</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    The <strong>Retail Division</strong> handles direct consumer walk-in sales, counter point-of-sale operations, and fresh daily cuts for household customers.
                  </p>
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1.5 text-neutral-700 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Store Front:</span>
                      <span className="font-bold">Main Counter</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Timings:</span>
                      <span className="font-bold">6:00 AM – 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Cuts Available:</span>
                      <span className="font-bold text-emerald-700">Fresh Whole & Dressed</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="goto-wholesale-from-modal-btn"
                type="button"
                onClick={() => {
                  setInfoSector(null);
                  if (onSelectSector) onSelectSector('wholesale');
                }}
                className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
              >
                <span>Go to Wholesale Billing</span>
                <ChevronRight size={14} />
              </button>
              <button
                id="dismiss-sector-modal-btn"
                type="button"
                onClick={() => setInfoSector(null)}
                className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
