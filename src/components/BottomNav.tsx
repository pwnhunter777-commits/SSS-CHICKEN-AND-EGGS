import React from 'react';
import { Tag, Receipt, BookOpen, BarChart3, Building2 } from 'lucide-react';
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
      icon: <Tag className="w-3.5 h-3.5" />,
    },
    {
      id: 'billing',
      label: t.billing,
      icon: <Receipt className="w-3.5 h-3.5" />,
    },
    {
      id: 'register',
      label: t.register,
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      id: 'total',
      label: t.total,
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: 'hotel',
      label: t.hotel,
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] safe-area-pb select-none"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-1 py-1 gap-0.5 select-none">
        {navItems.map((item) => {
          const isActive = currentActive === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => handleNavigation(item.id)}
              className={`relative min-h-[2.4rem] flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-emerald-900 font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              {/* Active / Inactive Icon Pill */}
              <div
                className={`flex items-center justify-center w-8 h-5.5 rounded-full mb-0.5 transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-700 text-white scale-105 shadow-2xs shadow-emerald-700/25'
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-800'
                }`}
              >
                {item.icon}
              </div>
              {/* Clean Readable Label */}
              <span
                className={`text-[9.5px] leading-tight text-center truncate max-w-full px-0.5 tracking-tight font-black ${
                  isActive
                    ? 'text-emerald-900'
                    : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {/* Active Indicator Dot */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 bg-emerald-700 rounded-full shadow-2xs animate-in zoom-in duration-150" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
