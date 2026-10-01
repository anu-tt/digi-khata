import React from 'react';

interface TytanLogoProps {
  variant?: 'full' | 'icon' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  lightBackground?: boolean;
}

export const TytanDoorLogo: React.FC<TytanLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  lightBackground = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  }[size];

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  }[size];

  // Minimal modern "T" icon inside a crisp rounded red square
  const SimpleIcon = (
    <div
      className={`${iconSizes} rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-black shadow-sm shrink-0 border border-red-500/20`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-3/5 h-3/5 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V7C21 7.55228 20.5523 8 20 8H14.5V19.5C14.5 20.3284 13.8284 21 11 21C10.1716 21 9.5 20.3284 9.5 19.5V8H4C3.44772 8 3 7.55228 3 7V4Z" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{SimpleIcon}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        {SimpleIcon}
        <div className="flex items-center gap-1.5 font-extrabold tracking-tight text-xl sm:text-2xl">
          <span className="text-red-600">TYTAN</span>
          <span className={lightBackground ? 'text-slate-900' : 'text-white'}>KHATABOOK</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {SimpleIcon}
      <div className={`font-extrabold tracking-tight ${textSizes} leading-none flex items-center gap-1.5`}>
        <span className="text-red-600">TYTAN</span>
        <span className={lightBackground ? 'text-slate-900' : 'text-white'}>KHATABOOK</span>
      </div>
    </div>
  );
};
