import React from 'react';
import { Tag, Receipt, BookOpen, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { Page, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface BottomNavProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onPageChange,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    {
      id: 'daily-price',
      label: t.dailyPrice,
      icon: <Tag className="w-5 h-5" />,
    },
    {
      id: 'billing',
      label: t.billing,
      icon: <Receipt className="w-5 h-5" />,
    },
    {
      id: 'register',
      label: t.register,
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'total',
      label: t.total,
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: t.settings,
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 min-h-[4.25rem] h-auto items-center px-1 py-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center justify-center h-full py-1 px-0.5 relative transition-all active:scale-95 cursor-pointer ${
                isActive ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-emerald-600 rounded-full" />
              )}
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-50 text-emerald-700 scale-105 shadow-xs' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-xs mt-0.5 tracking-tight text-center leading-tight truncate max-w-full font-bold">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
