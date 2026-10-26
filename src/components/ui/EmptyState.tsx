import { type ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  children?: ReactNode;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-[20px] border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs my-4 space-y-5 animate-fade-in">
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>

      {/* Text Info */}
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Custom Child Elements or Action Buttons */}
      {children}

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-4 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer active:scale-98"
            >
              {secondaryActionText}
            </button>
          )}

          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-5 h-10 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-98"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
