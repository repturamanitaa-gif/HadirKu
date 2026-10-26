import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  where,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  CalendarDays,
  FileText,
  LogIn,
  LogOut,
  Calendar,
  CheckCircle2,
  X,
  ArrowRight,
  Clock,
  BookOpen,
  MapPin,
  User,
  ShieldCheck,
  AlertCircle,
  ScanLine,
  ChevronRight,
  Sparkles,
  School,
  AlertTriangle,
} from 'lucide-react';
import { formatTime, formatDate } from '../../utils/helpers';
import { getStoredClasses, getStoredStudentAttendance } from '../../utils/initialData';
import type { ClassData, AttendanceRecord } from '../../types';

interface StudentClassInfo extends ClassData {
  joinedAt?: Date;
}

interface RecentAttendanceItem extends AttendanceRecord {
  className?: string;
}

interface ScheduleItem {
  time: string;
  subject: string;
  teacher: string;
  room: string;
  status: 'ongoing' | 'upcoming' | 'completed';
}

const TODAY_SCHEDULE: ScheduleItem[] = [
  {
    time: '07.00 - 08.30',
    subject: 'Matematika Wajib',
    teacher: 'Drs. Ahmad Fauzi, M.Pd',
    room: 'Ruang X IPA 1',
    status: 'completed',
  },
  {
    time: '08.30 - 10.00',
    subject: 'Fisika Dasar',
    teacher: 'Dra. Hj. Ratna Sari, M.Pd',
    room: 'Lab Fisika Lt. 2',
    status: 'ongoing',
  },
  {
    time: '10.30 - 12.00',
    subject: 'Bahasa Indonesia',
    teacher: 'Budi Santoso, S.Pd',
    room: 'Ruang X IPA 1',
    status: 'upcoming',
  },
  {
    time: '13.00 - 14.30',
    subject: 'Kimia Organik',
    teacher: 'Siti Rahmawati, S.Si',
    room: 'Lab Kimia Lt. 1',
    status: 'upcoming',
  },
];

const UPCOMING_EVENTS = [
  {
    date: '24 Okt 2026',
    title: 'Penilaian Tengah Semester (PTS) Genap',
    category: 'Akademik',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    date: '28 Okt 2026',
    title: 'Upacara Peringatan Hari Sumpah Pemuda',
    category: 'Kegiatan',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    date: '02 Nov 2026',
    title: 'Praktikum Lapangan Biologi Lingkungan',
    category: 'Praktikum',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<StudentClassInfo[]>([]);
  const [recentAttendances, setRecentAttendances] = useState<RecentAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave Modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<'sakit' | 'izin' | 'dispensasi'>('sakit');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalHadir: 18,
    totalTerlambat: 2,
    totalAlpha: 0,
    persentaseKehadiran: 96,
  });

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Today's date formatted
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    if (!user) return;

    const initialClasses = getStoredClasses().filter((c) => c.name === 'X IPA 1');
    const initialHistory = getStoredStudentAttendance();
    const hadir = initialHistory.filter((h) => h.status === 'hadir').length || 18;
    const terlambat = initialHistory.filter((h) => h.status === 'terlambat').length || 2;
    const tidakHadir = initialHistory.filter((h) => h.status === 'tidak_hadir').length || 0;
    const total = hadir + terlambat + tidakHadir;
    const pct = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 96;

    setClasses(initialClasses.length > 0 ? initialClasses : getStoredClasses().slice(0, 2));
    setRecentAttendances(initialHistory);
    setStats({
      totalHadir: hadir,
      totalTerlambat: terlambat,
      totalAlpha: tidakHadir,
      persentaseKehadiran: pct,
    });
    setLoading(false);

    if (user && !user.uid.startsWith('demo-')) {
      const fetchStudentData = async () => {
        try {
          const classesSnap = await getDocs(
            query(collection(db, 'classes'), where('active', '==', true))
          );
          const enrolledClasses: StudentClassInfo[] = [];

          for (const cDoc of classesSnap.docs) {
            const memberDoc = await getDocs(
              query(
                collection(db, 'classes', cDoc.id, 'members'),
                where('__name__', '==', user.uid),
                where('active', '==', true)
              )
            );
            if (!memberDoc.empty) {
              enrolledClasses.push({
                classId: cDoc.id,
                ...cDoc.data(),
              } as StudentClassInfo);
            }
          }
          if (enrolledClasses.length > 0) {
            setClasses(enrolledClasses);
          }

          const attQ = query(
            collectionGroup(db, 'attendance'),
            where('__name__', '==', user.uid)
          );
          const attSnap = await getDocs(attQ);

          if (!attSnap.empty) {
            let hCount = 0;
            let tCount = 0;
            let aCount = 0;

            const items: RecentAttendanceItem[] = [];
            for (const d of attSnap.docs) {
              const data = d.data();
              let className = 'Kelas';

              if (enrolledClasses.length > 0) {
                className = enrolledClasses[0].name;
              }

              const status = data.status || 'hadir';
              if (status === 'hadir') hCount++;
              else if (status === 'terlambat') tCount++;
              else aCount++;

              items.push({
                studentId: d.id,
                studentName: profile?.name || 'Siswa',
                status,
                checkedAt: data.checkedAt?.toDate() || new Date(),
                source: data.source || 'qr_scan',
                className,
              });
            }

            items.sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime());
            setRecentAttendances(items);

            const tot = hCount + tCount + aCount;
            const p = tot > 0 ? Math.round(((hCount + tCount) / tot) * 100) : 100;

            setStats({
              totalHadir: hCount,
              totalTerlambat: tCount,
              totalAlpha: aCount,
              persentaseKehadiran: p,
            });
          }
        } catch (err) {
          console.warn('Student sync note:', err);
        }
      };

      fetchStudentData();
    }
  }, [user, profile]);

  const handleSendLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveSuccess(true);
    setTimeout(() => {
      setLeaveSuccess(false);
      setShowLeaveModal(false);
      setLeaveReason('');
    }, 1500);
  };

  // Determine today's attendance record
  const todayRecord = recentAttendances.length > 0 ? recentAttendances[0] : null;
  const isCheckedInToday = Boolean(
    todayRecord && (todayRecord.status === 'hadir' || todayRecord.status === 'terlambat')
  );
  const checkInStatus = todayRecord?.status || 'hadir';
  const checkInTime = todayRecord ? formatTime(todayRecord.checkedAt) : '07:12 WIB';

  return (
    <div className="space-y-7 sm:space-y-9 animate-fade-in pb-20 max-w-full overflow-hidden">
      {/* 12-COLUMN FIGMA ASYMMETRIC GRID: Desktop 8:4, Mobile 1-Column Native App */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Desktop 8-cols, Mobile full width native feed */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">

          {/* 1. COMPACT NATIVE MOBILE HERO BANNER (360-430px optimized, 24px-28px font scale) */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#EEF9F2] via-[#F2FAF5] to-[#F8FDF9] border border-emerald-200/70 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-bold border border-emerald-300/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Presensi Hari Ini
                  </span>
                </div>

                <h1 className="text-xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  {isCheckedInToday
                    ? 'Presensi Berhasil!'
                    : 'Belum Presensi Hari Ini'}
                </h1>

                <p className="text-[13px] sm:text-[14px] text-slate-600 font-normal leading-relaxed">
                  {isCheckedInToday
                    ? 'Kehadiranmu sudah tercatat tepat waktu.'
                    : 'Pindai kode QR kelas untuk mencatat kehadiran.'}
                </p>

                <div className="pt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 border border-emerald-200 text-xs font-semibold text-slate-700 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Masuk:</span>
                    <strong className="font-mono text-emerald-800 font-bold">
                      {isCheckedInToday ? checkInTime : '07:12 WIB'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Character Illustration SVG with Big Emerald Ring */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 border-4 border-white">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. MOBILE QUICK ACTIONS: 2x2 TOUCH-OPTIMIZED GRID (HIG / Material 3 Guidelines) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Action 1: Pindai QR (Primary Royal Blue) */}
            <button
              onClick={() => navigate('/siswa/scan')}
              className="p-4 sm:p-5 rounded-[20px] bg-[#2563EB] hover:bg-blue-700 text-white flex flex-col justify-between h-[105px] sm:h-[115px] shadow-sm shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ScanLine className="w-5 h-5 text-white" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[14px] sm:text-[15px] font-bold block">Pindai QR</span>
                <span className="text-[11px] text-blue-100 font-normal">Absen Sekarang</span>
              </div>
            </button>

            {/* Action 2: Ajukan Izin */}
            <button
              onClick={() => setShowLeaveModal(true)}
              className="p-4 sm:p-5 rounded-[20px] bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-900 flex flex-col justify-between h-[105px] sm:h-[115px] shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[14px] sm:text-[15px] font-bold block">Ajukan Izin</span>
                <span className="text-[11px] text-slate-400 font-normal">Surat Dokter / Ket.</span>
              </div>
            </button>

            {/* Action 3: Riwayat Kehadiran */}
            <button
              onClick={() => navigate('/siswa/riwayat')}
              className="p-4 sm:p-5 rounded-[20px] bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-900 flex flex-col justify-between h-[105px] sm:h-[115px] shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[14px] sm:text-[15px] font-bold block">Riwayat Absen</span>
                <span className="text-[11px] text-slate-400 font-normal">Semua Rekap</span>
              </div>
            </button>

            {/* Action 4: Agenda KBM */}
            <button
              onClick={() => {
                const el = document.getElementById('jadwal-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 sm:p-5 rounded-[20px] bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-900 flex flex-col justify-between h-[105px] sm:h-[115px] shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[14px] sm:text-[15px] font-bold block">Jadwal Kelas</span>
                <span className="text-[11px] text-slate-400 font-normal">4 Mapel Hari Ini</span>
              </div>
            </button>
          </div>

          {/* 3. ATTENDANCE ANALYTICS: CIRCULAR GAUGE + METRICS PILLS */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[15px] font-bold text-slate-900">Performa Kehadiran</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Semester Genap
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
              {/* Circular Gauge */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                  <svg className="w-18 h-18 transform -rotate-90">
                    <circle cx="36" cy="36" r="28" stroke="#E2E8F0" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="36"
                      cy="36"
                      r="28"
                      stroke="#2563EB"
                      strokeWidth="6"
                      strokeDasharray={175}
                      strokeDashoffset={175 - (175 * stats.persentaseKehadiran) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute font-extrabold text-[15px] text-slate-900">
                    {stats.persentaseKehadiran}%
                  </span>
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900">Tingkat Kehadiran</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Disiplin dan tepat waktu</p>
                  <span className="inline-block text-[11px] text-emerald-600 font-bold mt-1">↑ 4% peningkatan</span>
                </div>
              </div>

              {/* 3 Metrics Pills */}
              <div className="grid grid-cols-3 gap-2.5 w-full flex-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Hadir</span>
                  <span className="text-[18px] font-extrabold text-slate-900 block leading-tight mt-0.5">{stats.totalHadir}</span>
                  <span className="text-[9px] text-emerald-600 font-medium">sesi</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Izin</span>
                  <span className="text-[18px] font-extrabold text-amber-600 block leading-tight mt-0.5">{stats.totalTerlambat}</span>
                  <span className="text-[9px] text-slate-400 font-medium">sesi</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Alpha</span>
                  <span className="text-[18px] font-extrabold text-slate-400 block leading-tight mt-0.5">{stats.totalAlpha}</span>
                  <span className="text-[9px] text-slate-400 font-medium">sesi</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. JADWAL PELAJARAN: VERTICAL NATIVE MOBILE CARDS */}
          <div id="jadwal-section" className="bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-900">Jadwal KBM Hari Ini</h2>
                <p className="text-[11px] text-slate-400">Senin, 26 Okt 2026 • Kelas X IPA 1</p>
              </div>

              <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                4 Mapel
              </span>
            </div>

            <div className="space-y-3">
              {TODAY_SCHEDULE.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-[20px] bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-all flex items-center justify-between gap-3.5"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Time Pill */}
                    <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-[#2563EB] font-mono text-[11px] font-bold text-center shrink-0 min-w-[70px] shadow-2xs">
                      <span>{item.time.split(' - ')[0]}</span>
                    </div>

                    <div className="min-w-0 leading-tight">
                      <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-900 truncate">{item.subject}</h3>
                      <p className="text-[12px] text-slate-500 truncate mt-1 flex items-center gap-1.5">
                        <span>{item.teacher}</span>
                        <span className="text-slate-300">•</span>
                        <span>{item.room}</span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                      </span>
                    )}
                    {item.status === 'ongoing' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                        Aktif
                      </span>
                    )}
                    {item.status === 'upcoming' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-400 border border-slate-200">
                        Nanti
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Desktop 4-cols, Mobile continuation */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-7">
          
          {/* 5. RIWAYAT PRESENSI TIMELINE (Native Mobile Activity Feed) */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-900">Riwayat Terakhir</h2>
              <button
                onClick={() => navigate('/siswa/riwayat')}
                className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { day: 'Sen', date: '26 Okt', type: 'Datang', time: '07:12 WIB', status: 'Hadir', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { day: 'Jum', date: '24 Okt', type: 'Pulang', time: '14:30 WIB', status: 'Hadir', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { day: 'Kam', date: '23 Okt', type: 'Datang', time: '07:08 WIB', status: 'Hadir', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { day: 'Rab', date: '22 Okt', type: 'Izin', time: '-', status: 'Izin', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
                { day: 'Sel', date: '21 Okt', type: 'Datang', time: '07:15 WIB', status: 'Hadir', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50/60 hover:bg-slate-50 border border-slate-100/90 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex flex-col items-center justify-center text-[11px] font-bold text-slate-800 shrink-0 shadow-2xs">
                      <span>{item.day}</span>
                      <span className="text-[8px] text-slate-400 font-semibold">{item.date.split(' ')[0]}</span>
                    </div>

                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Hadir' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-[13px] font-bold text-slate-800">{item.type}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{item.time}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badge}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL AJUKAN IZIN KBM */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-7 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ajukan Surat Izin KBM</h3>
                <p className="text-xs text-slate-400">Pemberitahuan resmi ke Wali Kelas</p>
              </div>
            </div>

            {leaveSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Pengajuan Berhasil Dikirim</h4>
                <p className="text-xs text-slate-500">
                  Surat izin Anda telah tercatat dan diteruskan ke Wali Kelas untuk verifikasi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendLeave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Jenis Keterangan
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['sakit', 'izin', 'dispensasi'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLeaveType(t)}
                        className={`py-2.5 text-xs font-bold rounded-xl capitalize border cursor-pointer transition-all ${
                          leaveType === t
                            ? 'bg-blue-50 border-blue-600 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Alasan / Keterangan Singkat
                  </label>
                  <textarea
                    rows={3}
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Contoh: Sakit demam berobat ke klinik, surat dokter terlampir..."
                    className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                    required
                  />
                </div>

                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Kirim Pengajuan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
