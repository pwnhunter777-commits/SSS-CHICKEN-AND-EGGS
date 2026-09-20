import React from 'react';
import appLogo from '../assets/logo';

interface ChickenLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
  className?: string;
}

export const ChickenLogo: React.FC<ChickenLogoProps> = ({ size = 'md', id = 'agency-logo', className = '' }) => {
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  return (
    <div
      id={id}
      className={`relative inline-flex items-center justify-center ${dimensions} rounded-full overflow-hidden bg-amber-50 shadow-md ring-2 ring-amber-700/20 active:scale-95 transition-transform flex-shrink-0 ${className}`}
      aria-label="SSS Chicken and Egg Agency Logo"
    >
      <img
        src={appLogo}
        alt="SSS Chicken and Egg Agency Logo"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
};

