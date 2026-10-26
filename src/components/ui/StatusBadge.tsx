import { getStatusColor, getStatusLabel } from '../../utils/helpers';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px] leading-tight',
    md: 'px-3 py-1 text-xs leading-none font-medium',
  };

  const dotColor =
    status === 'hadir' || status === 'active' || status === 'aktif'
      ? 'bg-emerald-500'
      : status === 'terlambat'
      ? 'bg-amber-500'
      : status === 'tidak_hadir' || status === 'alfa' || status === 'closed' || status === 'nonaktif'
      ? 'bg-rose-500'
      : 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${getStatusColor(
        status
      )} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotColor}`} />
      <span>{getStatusLabel(status)}</span>
    </span>
  );
}
