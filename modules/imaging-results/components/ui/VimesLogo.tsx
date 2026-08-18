import React from 'react';

interface VimesLogoProps {
  className?: string;
  height?: number;
  variant?: 'full' | 'icon';
}

export const VimesIcon: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none flex-shrink-0 ${className}`}
  >
    <path d="M84 118 H170 L248 340 L296 174 H330 V220 H380 L290 436 H210 L84 118 Z" fill="#008A5E" />
    <path d="M345 77 H387 V119 H429 V161 H387 V203 H345 V161 H303 V119 H345 Z" fill="#E53935" />
  </svg>
);

export const VimesLogo: React.FC<VimesLogoProps> = ({
  className = '',
  height = 40,
  variant = 'full',
}) => {
  if (variant === 'icon') {
    return <VimesIcon size={height} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <VimesIcon size={height} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1 leading-none">
          <span className="font-black text-slate-800 dark:text-white text-lg tracking-wide">ViMES</span>
          <span className="font-black text-[#008A5E] text-base tracking-wide">RIS</span>
        </div>
        <span className="text-[8.5px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
          Diagnostic Imaging
        </span>
      </div>
    </div>
  );
};

export default VimesLogo;
