import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  className?: string;
}

export const Card = ({ children, title, action, className }: CardProps) => (
  <div className={clsx("bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden", className)}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center">
        {title && <h3 className="font-semibold text-text">{title}</h3>}
        {action}
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);
