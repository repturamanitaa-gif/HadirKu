interface AttendanceDonutProps {
  hadir?: number;
  terlambat?: number;
  tidakHadir?: number;
}

export default function AttendanceDonutChart({
  hadir = 21,
  terlambat = 3,
  tidakHadir = 1,
}: AttendanceDonutProps) {
  const total = hadir + terlambat + tidakHadir || 1;
  const pctHadir = Math.round((hadir / total) * 100);
  const pctTerlambat = Math.round((terlambat / total) * 100);
  const pctTidakHadir = Math.max(0, 100 - pctHadir - pctTerlambat);

  return (
    <div className="panel p-4 sm:p-5 flex flex-col justify-between">
      <div className="pb-3.5 mb-3 border-b border-[#E2E8F0]">
        <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
          Distribusi Status Kehadiran
        </h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Rasio kumulatif catatan presensi siswa
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Donut Ring SVG */}
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center my-1 sm:my-0">
          <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
            {/* Background ring */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="3.75"
            />
            {/* Hadir (Royal/Emerald) */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="transparent"
              stroke="#059669"
              strokeWidth="3.75"
              strokeDasharray={`${pctHadir} 100`}
              strokeDashoffset="0"
            />
            {/* Terlambat (Amber) */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="transparent"
              stroke="#D97706"
              strokeWidth="3.75"
              strokeDasharray={`${pctTerlambat} 100`}
              strokeDashoffset={`-${pctHadir}`}
            />
            {/* Tidak Hadir (Rose) */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="transparent"
              stroke="#DC2626"
              strokeWidth="3.75"
              strokeDasharray={`${pctTidakHadir} 100`}
              strokeDashoffset={`-${pctHadir + pctTerlambat}`}
            />
          </svg>

          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-lg font-bold text-[#0F172A] tabular-nums">{total}</span>
            <span className="text-[10px] font-medium text-[#64748B] mt-1">Total Catatan</span>
          </div>
        </div>

        {/* Legend Rows */}
        <div className="w-full sm:flex-1 space-y-2 text-xs min-w-0">
          <div className="flex items-center justify-between p-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
              <span className="text-[#0F172A] font-medium truncate">Hadir Tepat Waktu</span>
            </div>
            <span className="font-bold text-[#0F172A] tabular-nums flex-shrink-0">
              {hadir} <span className="text-[#64748B] font-normal text-[10px]">({pctHadir}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 flex-shrink-0" />
              <span className="text-[#0F172A] font-medium truncate">Terlambat</span>
            </div>
            <span className="font-bold text-[#0F172A] tabular-nums flex-shrink-0">
              {terlambat} <span className="text-[#64748B] font-normal text-[10px]">({pctTerlambat}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0" />
              <span className="text-[#0F172A] font-medium truncate">Alfa / Tanpa Ket.</span>
            </div>
            <span className="font-bold text-[#0F172A] tabular-nums flex-shrink-0">
              {tidakHadir} <span className="text-[#64748B] font-normal text-[10px]">({pctTidakHadir}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
