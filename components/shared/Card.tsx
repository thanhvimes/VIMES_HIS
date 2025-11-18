import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // FIX: Added optional onClick prop to CardProps to allow passing event handlers to the underlying div. This resolves a type error in ConfirmationModal where an onClick was being passed to stop propagation.
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

export default Card;
