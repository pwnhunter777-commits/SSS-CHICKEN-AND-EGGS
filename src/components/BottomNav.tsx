import React from 'react';
import { Tag, Receipt, BookOpen, BarChart3, Building2, Settings } from 'lucide-react';
import { AppPage, LanguageCode } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface BottomNavProps {
  currentPage?: AppPage;
  activePage?: AppPage;
  onPageChange?: (page: AppPage) => void;
  onSelectPage?: (page: AppPage) => void;
  language: LanguageCode;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  activePage,
  onPageChange,
  onSelectPage,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const currentActive = activePage || currentPage || 'billing';

  const handleNavigation = (pageId: AppPage) => {
    if (onSelectPage) {
      onSelectPage(pageId);
    } else if (onPageChange) {
      onPageChange(pageId);
    }
  };

  const navItems: { id: AppPage; label: string; icon: React.ReactNode }[] = [
    {
      id: 'daily-price',
      label: t.dailyPrice,
      icon: <Tag className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'billing',
      label: t.billing,
      icon: <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'register',
      label: t.register,
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'total',
      label: t.total,
      icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'hotel',
      label: t.hotel,
      icon: <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'settings',
      label: t.settings,
      icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="sticky bottom-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] safe-area-pb"
    >
      <div className="max-w-md mx-auto grid grid-cols-6 items-center px-1.5 py-2 gap-1 select-none">
        {navItems.map((item) => {
          const isActive = currentActive === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => handleNavigation(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-emerald-900 font-black'
                  : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              {/* Active / Inactive Icon Pill */}
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full mb-0.5 transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-700 text-white scale-105 shadow-sm shadow-emerald-700/25'
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-800'
                }`}
              >
                {item.icon}
              </div>
              {/* Clean Readable Label */}
              <span
                className={`text-[9px] sm:text-[10px] leading-tight text-center truncate max-w-full px-0.5 tracking-tight ${
                  isActive
                    ? 'text-emerald-900 font-black'
                    : 'text-slate-500 font-bold'
                }`}
              >
                {item.label}
              </span>
              {/* Active Indicator Dot */}
              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 bg-emerald-700 rounded-full shadow-xs animate-in zoom-in duration-150" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
