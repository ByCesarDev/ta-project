import React from 'react';
import { cn } from '../../lib/utils.js';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'emerald' | 'amber' | 'rose' | 'slate' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  className,
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-md border select-none';

  const variants = {
    primary: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    outline: 'bg-transparent text-slate-300 border-slate-700',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-semibold',
  };

  return <span className={cn(baseStyles, variants[variant], sizes[size], className)}>{children}</span>;
};
