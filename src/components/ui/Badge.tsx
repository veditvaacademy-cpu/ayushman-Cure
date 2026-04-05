import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'alert' | 'error' | 'info';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-success/10 text-success',
    alert: 'bg-alert/10 text-alert',
    error: 'bg-error/10 text-error',
    info: 'bg-accent/10 text-accent',
  };
  return (
    <span className={clsx("px-2 py-1 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
};
