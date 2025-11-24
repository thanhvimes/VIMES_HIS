import React, { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl p-4 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
};

export default memo(Card);