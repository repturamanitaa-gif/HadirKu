import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedDay = currentDate.getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push({
      day: d,
      isCurrentMonth: true,
      isSelected: d === selectedDay,
    });
  }

  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      day: d,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="panel p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E2E8F0]">
        <div>
          <span className="text-xs font-bold text-[#0F172A] block">
            {monthNames[month]} {year}
          </span>
          <span className="text-[10px] text-[#64748B]">Kalender Akademik</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {daysOfWeek.map((d) => (
          <span key={d} className="text-[10px] font-semibold text-[#64748B] py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Date Cells */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((item, idx) => (
          <div key={idx} className="h-7 flex items-center justify-center">
            <span
              className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors ${
                item.isSelected
                  ? 'bg-[#172554] text-white font-semibold shadow-xs'
                  : item.isCurrentMonth
                  ? 'text-[#0F172A] hover:bg-slate-100 cursor-pointer'
                  : 'text-slate-300'
              }`}
            >
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
