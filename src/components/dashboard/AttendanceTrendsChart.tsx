export default function AttendanceTrendsChart() {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const dataPoints = [
    { day: 'Sen', rate: 91, x: 35, y: 80 },
    { day: 'Sel', rate: 94, x: 105, y: 60 },
    { day: 'Rab', rate: 92, x: 175, y: 72 },
    { day: 'Kam', rate: 98, x: 245, y: 36 },
    { day: 'Jum', rate: 93, x: 315, y: 66 },
    { day: 'Sab', rate: 89, x: 385, y: 92 },
    { day: 'Min', rate: 95, x: 455, y: 54 },
  ];

  return (
    <div className="panel p-4 sm:p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3 border-b border-[#E2E8F0] gap-2">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
            Tren Kehadiran Siswa Mingguan
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Persentase kehadiran tepat waktu per hari dalam 7 hari kalender terakhir
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E8EDFF] text-[#2563EB] border border-[#DBE4FF]">
            Rata-rata 93.1% <span className="mx-1.5 text-slate-300">|</span> <span className="text-[#64748B] font-normal">T.A. 2026/2027</span>
          </span>
        </div>
      </div>

      {/* SVG Chart with Grid & Guides */}
      <div className="relative pt-2 pb-1">
        <svg viewBox="0 0 490 155" className="w-full h-40 overflow-visible">
          <defs>
            <linearGradient id="trendRoyalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="80%" stopColor="#2563EB" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Guidelines */}
          <line x1="20" y1="30" x2="470" y2="30" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="20" y1="65" x2="470" y2="65" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="20" y1="100" x2="470" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="20" y1="135" x2="470" y2="135" stroke="#E2E8F0" strokeWidth="1" />

          {/* Area fill */}
          <path
            d="M 35 80 Q 70 82, 105 60 T 175 72 T 245 36 T 315 66 T 385 92 T 455 54 L 455 135 L 35 135 Z"
            fill="url(#trendRoyalGradient)"
          />

          {/* Smooth line */}
          <path
            d="M 35 80 Q 70 82, 105 60 T 175 72 T 245 36 T 315 66 T 385 92 T 455 54"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Data Points */}
          {dataPoints.map((pt) => (
            <g key={pt.day}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={pt.day === 'Kam' ? 5 : 4}
                fill={pt.day === 'Kam' ? '#2563EB' : '#FFFFFF'}
                stroke={pt.day === 'Kam' ? '#1D4ED8' : '#2563EB'}
                strokeWidth={pt.day === 'Kam' ? 2.5 : 2}
              />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-[#64748B]"
              >
                {pt.rate}%
              </text>
            </g>
          ))}
        </svg>

        {/* Days label */}
        <div className="flex justify-between text-xs font-medium text-[#64748B] mt-3 px-3">
          {days.map((d) => (
            <span key={d} className="w-8 text-center">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
