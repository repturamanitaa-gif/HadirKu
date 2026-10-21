interface AttendanceProgressWidgetProps {
  percentage?: number;
  attended?: number;
  total?: number;
  label?: string;
}

export default function AttendanceProgressWidget({
  percentage = 94,
  attended = 24,
  total = 26,
  label = 'Tingkat Kehadiran',
}: AttendanceProgressWidgetProps) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-xs font-bold text-emerald-700 tabular-nums">
          {percentage}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
        <span>Tercatat Tepat Waktu</span>
        <span className="font-semibold text-slate-700 tabular-nums">
          {attended} / {total} presensi
        </span>
      </div>
    </div>
  );
}
