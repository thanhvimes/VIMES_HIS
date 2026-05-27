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
      className={`modern-card p-4 sm:p-6 ${onClick ? 'cursor-pointer hover-lift' : ''} ${className || ''}`}
    >
      {children}
    </div>
  );
};

export default memo(Card);