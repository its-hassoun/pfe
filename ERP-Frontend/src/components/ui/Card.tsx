import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  noPadding = false,
  onClick
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden ${className}
      ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}
