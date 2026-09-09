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
      className="flex flex-col flex-1 w-full max-w-md mx-auto px-6 py-6 sm:py-8 justify-between"
    >
      {/* Minimal Top Bar with back link */}
      <div className="flex items-center justify-between w-full mb-6">
        <button
          id="login-back-btn"
          onClick={onBackToMain}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors py-1.5 px-2 rounded-lg hover:bg-neutral-100"
          aria-label="Return to Agency Hub"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
          Secure Portal
        </span>
      </div>

      {/* Center Essential Login Content */}
      <div className="my-auto w-full">
        {/* Top Center Chicken Logo */}
        <div className="flex justify-center mb-4">
          <ChickenLogo size="md" id="login-chicken-logo" />
        </div>

        {/* Agency Name */}
        <div className="text-center mb-8">
          <h1
            id="login-agency-title"
            style={{ fontSize: `${Math.min(storeConfig.fontSize, 32)}px`, lineHeight: 1.2 }}
            className="font-bold tracking-tight text-neutral-900 text-center break-words"
          >
            {storeConfig.name}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-medium">Sign in to your account</p>
        </div>

        {/* Essential Login Form */}
        <form
          id="agency-login-form"
          onSubmit={handleSubmit}
          className="w-full space-y-4"
        >
          {errorMessage && (
            <div
              id="login-error-alert"
              className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="login-identifier-input"
              className="block text-xs font-medium text-neutral-700 mb-1.5"
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
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-all shadow-2xs"
            />
          </div>

          <div>
            <label
              htmlFor="login-password-input"
              className="block text-xs font-medium text-neutral-700 mb-1.5"
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
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-all shadow-2xs"
            />
          </div>

          <div className="pt-2">
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-emerald-700 text-white rounded-xl text-sm font-bold hover:bg-emerald-800 active:scale-[0.99] transition-all duration-150 shadow-sm shadow-emerald-800/30 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
