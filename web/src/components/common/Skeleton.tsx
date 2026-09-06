import React from 'react';
import { cn } from '../../lib/utils.js';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('shimmer rounded-xl bg-slate-800/60', className)} />;
};

export const AnimeCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-[#0c101c]/60 border border-slate-800/60">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
};
