import React from 'react';
import { InvestmentBottomTab } from '../types';
import { Truck, TrendingUp, Boxes } from 'lucide-react';

interface InvestmentBottomNavProps {
  activeTab: InvestmentBottomTab;
  onSelectTab: (tab: InvestmentBottomTab) => void;
  language?: 'en' | 'ta';
}

export const InvestmentBottomNav: React.FC<InvestmentBottomNavProps> = ({
  activeTab,
  onSelectTab,
  language = 'en',
}) => {
  const tabs = [
    {
      id: 'load' as InvestmentBottomTab,
      label: language === 'ta' ? 'லோடு வரவு' : 'Load Inward',
      icon: Truck,
    },
    {
      id: 'sales' as InvestmentBottomTab,
      label: language === 'ta' ? 'விற்பனை & லாபம்' : 'Sales & Profit',
      icon: TrendingUp,
    },
    {
      id: 'summary' as InvestmentBottomTab,
      label: language === 'ta' ? 'கடை இருப்பு' : 'Stock',
      icon: Boxes,
    },
  ];

  return (
    <nav
      id="investment-bottom-nav"
      className="sticky bottom-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-[0_-4px_25px_rgba(5,150,105,0.08)] safe-area-pb px-3 py-2 flex items-center justify-around"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`investment-nav-tab-${tab.id}`}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-2xl transition-all duration-150 cursor-pointer ${
              isActive
                ? 'text-emerald-950 font-black'
                : 'text-slate-600 hover:text-emerald-800 font-semibold'
            }`}
          >
            <div
              className={`relative flex items-center justify-center p-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white scale-105 shadow-sm shadow-emerald-700/40 ring-2 ring-emerald-500/30'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <Icon size={19} className={isActive ? 'text-white' : 'text-slate-600'} />
            </div>
            <span
              className={`text-xs mt-1 tracking-tight truncate max-w-[100px] ${
                isActive ? 'text-emerald-950 font-black' : 'text-slate-600 font-semibold'
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <span className="absolute -bottom-0.5 w-1.5 h-1.5 bg-emerald-700 rounded-full shadow-xs" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
