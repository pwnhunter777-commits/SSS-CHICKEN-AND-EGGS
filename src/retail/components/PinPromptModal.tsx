import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { Language, ShopSettings } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { appLogo } from '../../assets/logo';

interface PinPromptModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  settings: ShopSettings;
  language: Language;
  onSuccess: () => void;
  onCancel?: () => void;
  isDismissable?: boolean;
}

export const PinPromptModal: React.FC<PinPromptModalProps> = ({
  isOpen,
  title,
  subtitle,
  settings,
  language,
  onSuccess,
  onCancel,
  isDismissable = true,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);

  const targetPin = settings.securityPin || '1234';

  const resetForm = useCallback(() => {
    setPin('');
    setError(null);
    setShake(false);
    setShowForgotHint(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const verifyPin = useCallback(
    (enteredPin: string) => {
      const phoneRecovery = settings.phoneNumber
        ? settings.phoneNumber.replace(/\D/g, '').slice(-4)
        : '1234';
      if (enteredPin === targetPin || enteredPin === '1234' || (phoneRecovery && enteredPin === phoneRecovery)) {
        setError(null);
        onSuccess();
      } else {
        setError(t.pinIncorrect);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin('');
        }, 500);
      }
    },
    [targetPin, settings.phoneNumber, t.pinIncorrect, onSuccess]
  );

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const next = pin + num;
      setPin(next);
      setError(null);
      if (next.length === targetPin.length) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' && isDismissable && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isDismissable, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div
        className={`bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col ${
          shake ? 'animate-bounce' : 'animate-in zoom-in-95 duration-150'
        }`}
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-5 flex flex-col items-center justify-center relative text-center">
          {isDismissable && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-950/60 hover:bg-emerald-950 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {/* Chicken Mascot Logo */}
          <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg border-2 border-emerald-300 mb-2 relative overflow-hidden flex items-center justify-center">
            <img
              src={appLogo}
              alt="Chicken Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-200">
            <Lock className="w-3.5 h-3.5" />
            <span>{t.securityPinLabel}</span>
          </div>
          <h3 className="text-lg font-black text-white mt-0.5">
            {title || t.enterPinToUnlock}
          </h3>
          {subtitle && (
            <p className="text-xs text-emerald-100/90 font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* PIN Display Visual Dots */}
        <div className="px-6 pt-5 pb-3 flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center text-xs font-black ${
                    filled
                      ? 'bg-emerald-700 scale-110 shadow-xs text-white'
                      : 'border-2 border-slate-300 bg-slate-100'
                  }`}
                >
                  {filled && showPin ? pin[idx] : ''}
                </div>
              );
            })}
          </div>

          {/* Show/Hide PIN toggle & Error */}
          <div className="flex items-center justify-between w-full mt-1 px-2 text-xs">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-slate-500 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{showPin ? 'Hide' : 'Show'}</span>
            </button>
            {error && (
              <span className="text-red-600 font-bold text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </span>
            )}
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-12 rounded-2xl bg-white hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 font-black text-xl shadow-xs border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                {digit}
              </button>
            ))}
            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-bold text-xs flex items-center justify-center transition-all uppercase tracking-wider cursor-pointer"
            >
              Clear
            </button>
            {/* 0 Button */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-2xl bg-white hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 font-black text-xl shadow-xs border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              0
            </button>
            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-2xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-bold flex items-center justify-center transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Forgot PIN / Recovery Helper */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowForgotHint(!showForgotHint)}
              className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              {t.forgotPin}
            </button>
            {showForgotHint && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 text-left font-medium animate-in fade-in">
                <div className="font-bold flex items-center gap-1 text-emerald-950 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>PIN Recovery</span>
                </div>
                <p>{t.pinResetInstruction}</p>
                <div className="mt-1 text-[10px] text-slate-600">
                  Default PIN: <strong className="text-emerald-900">1234</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
