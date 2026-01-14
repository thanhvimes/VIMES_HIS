
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded shadow-lg whitespace-nowrap animate-fade-in ${getPositionClasses()}`}>
          {content}
          {/* Arrow */}
          <div 
            className={`absolute w-2 h-2 bg-slate-800 transform rotate-45 
              ${position === 'top' ? 'bottom-[-3px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? 'top-[-3px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'left' ? 'right-[-3px] top-1/2 -translate-y-1/2' : ''}
              ${position === 'right' ? 'left-[-3px] top-1/2 -translate-y-1/2' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
