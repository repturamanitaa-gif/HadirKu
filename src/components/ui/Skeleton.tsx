import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    rectangular: 'rounded-[16px]',
    circular: 'rounded-full',
    text: 'rounded-[8px] h-4',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-gradient-to-r from-slate-200/80 via-slate-100/90 to-slate-200/80 bg-[length:200%_100%] ${variantStyles[variant]} ${className}`}
    />
  );
}

// Preset composite skeletons for enterprise dashboard sections
export function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24 h-3.5" />
        <Skeleton variant="circular" className="w-9 h-9" />
      </div>
      <Skeleton variant="text" className="w-16 h-8" />
      <Skeleton variant="text" className="w-32 h-3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Skeleton variant="text" className="w-40 h-5" />
        <Skeleton variant="rectangular" className="w-28 h-9 rounded-xl" />
      </div>
      <div className="p-5 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="w-10 h-10" />
              <div className="space-y-1.5">
                <Skeleton variant="text" className="w-36 h-4" />
                <Skeleton variant="text" className="w-24 h-3" />
              </div>
            </div>
            <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
