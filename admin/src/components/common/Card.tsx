import React from 'react';
import { cn } from '../../lib/utils.js';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
  glow = false,
}) => {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 border border-slate-800/80',
        glow && 'glow-border',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/60">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
