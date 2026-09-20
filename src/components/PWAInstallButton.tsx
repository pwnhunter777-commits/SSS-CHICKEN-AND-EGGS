import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  language?: 'en' | 'ta';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language = 'en', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidManualTip, setShowAndroidManualTip] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow (native prompt available)
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        type="button"
        onClick={install}
        className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-slate-950 px-3.5 py-2 text-xs sm:text-sm font-black shadow-md active:scale-95 transition-all cursor-pointer border border-amber-300/60 ${className}`}
        title={language === 'ta' ? 'செயலியை போனில் நிறுவ (PWA Install)' : 'Install App on Phone'}
      >
        <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        <span>{language === 'ta' ? 'செயலி நிறுவு' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-2xl bg-white/95 hover:bg-white text-emerald-950 px-3 py-1.5 text-xs font-black shadow-xs border border-emerald-300 active:scale-95 transition-all cursor-pointer ${className}`}
          title="Install on iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>{language === 'ta' ? 'நிறுவ (iOS)' : 'Install (iOS)'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-emerald-100 text-gray-900 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                    <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-xl object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">SSS CHICKEN AND EGG AGENCY</h3>
                    <p className="text-xs text-gray-500 font-bold">Progressive Web App</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3.5 text-xs sm:text-sm text-gray-700 font-semibold">
                <p className="text-emerald-900 font-bold">
                  {language === 'ta' 
                    ? 'உங்கள் ஐபோனில் செயலியை நிறுவ பின்வரும் 2 படிகளை செய்யவும்:' 
                    : 'To install SSS Chicken & Egg Agency on your iPhone or iPad:'}
                </p>
                <div className="flex items-start gap-3 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 font-black text-xs">
                    1
                  </div>
                  <div>
                    <span className="font-black text-emerald-950 block">
                      {language === 'ta' ? 'பகிர் (Share) பொத்தானை தட்டவும்' : 'Tap the Share Button'}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      {language === 'ta' ? 'சஃபாரி கீழே உள்ள பகிர்வு சின்னம்' : 'In the bottom Safari toolbar'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 font-black text-xs">
                    2
                  </div>
                  <div>
                    <span className="font-black text-emerald-950 block">
                      {language === 'ta' ? '"முகப்புத் திரையில் சேர்" தேர்ந்தெடுக்கவும்' : 'Tap "Add to Home Screen"'}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'ta' ? 'மெனுவில் கீழே உருட்டவும்' : 'Scroll down the share sheet'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-2 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                {language === 'ta' ? 'புரிந்தது / மூடு' : 'Got it / Close'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button for Android / Chrome if event hasn't fired yet or inside iframe preview
  return (
    <>
      <button
        id="btn-pwa-install-fallback"
        type="button"
        onClick={() => setShowAndroidManualTip(true)}
        className={`flex items-center gap-1.5 rounded-2xl bg-emerald-950/80 hover:bg-black text-emerald-100 px-3 py-1.5 text-xs font-black shadow-xs border border-emerald-600/60 active:scale-95 transition-all cursor-pointer ${className}`}
        title="Add to Home Screen (PWA)"
      >
        <Download className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
        <span>{language === 'ta' ? 'PWA செயலி' : 'Install PWA'}</span>
      </button>

      {showAndroidManualTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-emerald-100 text-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                  <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-xl object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-950">SSS CHICKEN AND EGG AGENCY</h3>
                  <p className="text-xs text-gray-500 font-bold">Progressive Web App (PWA)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidManualTip(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm text-gray-700 font-medium">
              <p className="font-black text-emerald-950">
                {language === 'ta' 
                  ? 'இந்த செயலியை உங்கள் போனில் ஆப் போல நிறுவலாம்:' 
                  : 'Install this application directly on your phone or desktop:'}
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Chrome / Android:</strong> {language === 'ta' ? 'மேல் வலது மூலையில் உள்ள 3 புள்ளிகளைத் தட்டி "Add to Home screen" அல்லது "Install app" தேர்ந்தெடுக்கவும்.' : 'Tap the 3 dots in the top right corner and tap "Add to Home screen" or "Install app".'}
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Safari / iOS:</strong> {language === 'ta' ? 'பகிர் (Share) சின்னத்தை தட்டி "Add to Home Screen" தேர்ந்தெடுக்கவும்.' : 'Tap Share and select "Add to Home Screen".'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidManualTip(false)}
              className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
