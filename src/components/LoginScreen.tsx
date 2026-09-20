import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ChickenLogo } from './ChickenLogo';
import { StoreConfig } from '../types';

interface LoginScreenProps {
  storeConfig: StoreConfig;
  onLoginSuccess: () => void;
  onBackToMain: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  storeConfig,
  onLoginSuccess,
  onBackToMain,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your business ID or email.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    // Simulate swift authenticating transition
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 450);
  };

  return (
    <div
      id="login-mobile-screen"
      className="flex flex-col flex-1 w-full max-w-sm mx-auto px-4 py-3 sm:py-4 justify-between"
    >
      {/* Minimal Top Bar with back link */}
      <div className="flex items-center justify-between w-full mb-3">
        <button
          id="login-back-btn"
          onClick={onBackToMain}
          className="flex items-center gap-1 text-xs font-black text-neutral-600 hover:text-neutral-900 transition-colors py-1 px-2.5 min-h-[2.4rem] rounded-lg hover:bg-neutral-100 touch-manipulation cursor-pointer"
          aria-label="Return to Agency Hub"
        >
          <ArrowLeft size={16} />
          <span className="leading-tight">Back</span>
        </button>
        <span className="text-[10px] font-black tracking-wider uppercase text-neutral-400">
          Secure Portal
        </span>
      </div>

      {/* Center Essential Login Content */}
      <div className="my-auto w-full">
        {/* Top Center Chicken Logo */}
        <div className="flex justify-center mb-2">
          <ChickenLogo size="sm" id="login-chicken-logo" />
        </div>

        {/* Agency Name */}
        <div className="text-center mb-4">
          <h1
            id="login-agency-title"
            style={{ fontSize: `${Math.min(storeConfig.fontSize, 22)}px`, lineHeight: 1.2 }}
            className="font-black tracking-tight text-neutral-900 text-center break-words"
          >
            {storeConfig.name}
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5 font-bold leading-tight">Sign in to your account</p>
        </div>

        {/* Essential Login Form */}
        <form
          id="agency-login-form"
          onSubmit={handleSubmit}
          className="w-full space-y-2.5"
        >
          {errorMessage && (
            <div
              id="login-error-alert"
              className="p-2 text-xs font-black text-red-700 bg-red-50 border border-red-200 rounded-lg leading-tight break-words"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="login-identifier-input"
              className="block text-[10px] font-black text-neutral-700 mb-1 leading-tight"
            >
              Email or Agency ID
            </label>
            <input
              id="login-identifier-input"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@agency.com"
              className="w-full min-h-[2.4rem] px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-black text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 transition-all shadow-2xs leading-normal"
            />
          </div>

          <div>
            <label
              htmlFor="login-password-input"
              className="block text-[10px] font-black text-neutral-700 mb-1 leading-tight"
            >
              Password
            </label>
            <input
              id="login-password-input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[2.4rem] px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-black text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 transition-all shadow-2xs leading-normal"
            />
          </div>

          <div className="pt-1">
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[2.4rem] py-2 px-3 bg-emerald-700 text-white rounded-lg text-xs font-black hover:bg-emerald-800 active:scale-[0.99] transition-all duration-150 shadow-2xs shadow-emerald-800/30 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="leading-tight">Sign In</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
