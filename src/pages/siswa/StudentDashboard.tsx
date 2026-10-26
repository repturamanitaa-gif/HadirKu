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
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 12-COLUMN FIGMA ASYMMETRIC GRID (8 cols left, 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN (8 cols): Hero Banner + Metrics + Jadwal Pelajaran */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">

          {/* 1. MINT GREEN HERO CHECK-IN CARD (Exact Figma reference style with illustration) */}
          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#eef9f2] via-[#f0fbf4] to-[#f4fbf6] border border-emerald-200/60 p-7 sm:p-9 shadow-xs">
            {/* Subtle background glow */}
            <div className="absolute right-0 top-0 w-80 h-full bg-emerald-200/20 blur-3xl pointer-events-none rounded-full" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3.5 max-w-lg">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Presensi Hari ini
                </span>

                <h1 className="text-2xl sm:text-[32px] font-extrabold text-slate-900 tracking-tight leading-[1.2]">
                  {isCheckedInToday
                    ? 'Kamu sudah melakukan presensi hari ini!'
                    : 'Kamu belum melakukan presensi hari ini!'}
                </h1>

                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                  {isCheckedInToday
                    ? 'Terima kasih sudah disiplin. Tetap semangat untuk kegiatan belajar hari ini!'
                    : 'Sesi pembelajaran KBM telah dimulai. Segera pindai kode QR untuk mencatat kehadiran.'}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 border border-emerald-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Masuk tercatat:</span>
                    <strong className="font-mono text-emerald-800 font-bold">
                      {isCheckedInToday ? checkInTime : '07:12 WIB'}
                    </strong>
                  </div>

                  <button
                    onClick={() => navigate('/siswa/riwayat')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Lihat Detail</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Character Illustration & Glowing Checkmark Badge */}
              <div className="flex items-center gap-4 shrink-0 self-center md:self-auto">
                <div className="relative">
                  {/* Glowing Checkmark Badge */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 border-4 border-white">
                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
                  </div>
                </div>

                {/* Friendly Student Illustration SVG matching Figma Community character */}
                <div className="w-28 h-32 relative hidden sm:flex items-end justify-center">
                  <svg viewBox="0 0 120 130" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Backpack straps behind */}
                    <path d="M28 70C28 90 32 110 35 125" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
                    <path d="M92 70C92 90 88 110 85 125" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
                    {/* Body White Shirt */}
                    <path d="M24 75C24 62 40 55 60 55C80 55 96 62 96 75L94 130H26L24 75Z" fill="#FFFFFF" />
                    {/* Blue Tie */}
                    <polygon points="58,62 62,62 65,95 60,102 55,95" fill="#2563EB" />
                    <polygon points="56,60 64,60 62,66 58,66" fill="#1D4ED8" />
                    {/* Collar */}
                    <path d="M38 58L52 66L60 60L68 66L82 58" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    {/* Neck */}
                    <rect x="52" y="44" width="16" height="15" rx="3" fill="#FBBF24" />
                    {/* Head */}
                    <circle cx="60" cy="34" r="20" fill="#FCD34D" />
                    {/* Eyes & Friendly Smile */}
                    <circle cx="53" cy="34" r="2" fill="#1E293B" />
                    <circle cx="67" cy="34" r="2" fill="#1E293B" />
                    <path d="M56 41C58 44 62 44 64 41" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                    {/* Hair (Sleek modern side-swept) */}
                    <path d="M38 30C38 18 48 12 60 12C72 12 82 18 82 30C82 33 79 31 74 27C68 23 58 24 50 28C44 31 40 33 38 30Z" fill="#1E293B" />
                    {/* Backpack Top Handle */}
                    <path d="M48 55C48 48 72 48 72 55" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 2. THREE-PIECE METRIC ROW: CIRCULAR GAUGE + KPI MINI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6">
            {/* Metric 1 (5 cols): Circular Percentage Gauge */}
            <div className="sm:col-span-5 bg-white p-6 rounded-[22px] border border-slate-200/80 shadow-xs flex items-center gap-5">
              {/* Circular SVG Ring */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#E2E8F0"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#2563EB"
                    strokeWidth="7"
                    strokeDasharray={201}
                    strokeDashoffset={201 - (201 * stats.persentaseKehadiran) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute font-extrabold text-base text-slate-900 tracking-tight">
                  {stats.persentaseKehadiran}%
                </span>
              </div>

              <div className="leading-tight">
                <h4 className="text-xs font-bold text-slate-900">Persentase Kehadiran</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Semester Genap 2025/2026</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-2">
                  <span>↑ 4%</span>
                  <span className="text-slate-400 font-normal">dari semester lalu</span>
                </span>
              </div>
            </div>

            {/* Metric 2, 3, 4 (7 cols): Hadir, Izin/Sakit, Alpha mini cards */}
            <div className="sm:col-span-7 grid grid-cols-3 gap-3">
              {/* Hadir */}
              <div className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Hadir
                  </span>
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 block">{stats.totalHadir}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">dari 20 sesi</span>
                </div>
              </div>

              {/* Izin / Sakit */}
              <div className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Izin/Sakit
                  </span>
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 block">{stats.totalTerlambat}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">pertemuan</span>
                </div>
              </div>

              {/* Alpha */}
              <div className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Alpha
                  </span>
                  <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 block">{stats.totalAlpha}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">pertemuan</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. JADWAL PELAJARAN HARI INI (Figma Style with pill time tags) */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Jadwal Pelajaran Hari Ini</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Senin, 26 Okt 2026 • Kelas X IPA 1</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/siswa/riwayat')}
                className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {TODAY_SCHEDULE.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Time Pill Badge (Stacked Start & End time) */}
                    <div className="px-3 py-2 rounded-xl bg-blue-50/80 border border-blue-100 text-[#2563EB] font-mono text-xs font-bold text-center shrink-0 min-w-[76px] leading-tight">
                      <span className="block">{item.time.split(' - ')[0]}</span>
                      <span className="block text-[10px] text-blue-400 font-medium">{item.time.split(' - ')[1]}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.subject}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.teacher}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {item.room}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selesai
                      </span>
                    )}
                    {item.status === 'ongoing' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                        Sedang Berlangsung
                      </span>
                    )}
                    {item.status === 'upcoming' && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                        Akan Datang
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (4 cols): Aksi Cepat (Top Priority) + Riwayat Presensi Vertikal */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          
          {/* 1. AKSI CEPAT (Top Tier Action Banner) */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-1">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-slate-900">Aksi Cepat</h3>
            </div>

            {/* Primary Action Button (Blue Full Banner) */}
            <button
              onClick={() => navigate('/siswa/scan')}
              className="w-full p-4 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold flex items-center gap-3.5 shadow-sm shadow-blue-500/25 transition-all cursor-pointer active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ScanLine className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block">Pindai QR Presensi</span>
                <span className="text-[11px] text-blue-100 block font-normal">Lakukan presensi sekarang</span>
              </div>
            </button>

            {/* Secondary Action (Formulir Izin / Sakit) */}
            <button
              onClick={() => setShowLeaveModal(true)}
              className="w-full p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold flex items-center gap-3.5 shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block">Ajukan Izin / Sakit</span>
                <span className="text-[11px] text-slate-400 block font-normal">Kirim surat dokter &amp; keterangan</span>
              </div>
            </button>
          </div>

          {/* 2. RIWAYAT PRESENSI VERTIKAL (Exact Figma Feed) */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Riwayat Presensi</h3>
              </div>

              <button
                onClick={() => navigate('/siswa/riwayat')}
                className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Vertical Feed matching Figma screenshot */}
            <div className="space-y-3">
              {[
                { day: 'Sen', date: '26 Okt', type: 'Datang', time: '07:12 WIB', status: 'Hadir', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { day: 'Jum', date: '24 Okt', type: 'Pulang', time: '14:30 WIB', status: 'Hadir', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { day: 'Kam', date: '23 Okt', type: 'Datang', time: '07:08 WIB', status: 'Hadir', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { day: 'Rab', date: '22 Okt', type: 'Izin', time: '-', status: 'Izin', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
                { day: 'Sel', date: '21 Okt', type: 'Datang', time: '07:15 WIB', status: 'Hadir', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/60 hover:bg-slate-50 border border-slate-100/90 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 flex flex-col items-center justify-center text-xs font-bold text-slate-800 shrink-0 shadow-2xs">
                      <span>{item.day}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">{item.date.split(' ')[0]}</span>
                    </div>

                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Hadir' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-bold text-slate-800">{item.type}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{item.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.badge}`}>
                      {item.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
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
