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
    <div className="space-y-8 animate-fade-in pb-20">
      {/* 1. HERO HEADER: WELCOME & STUDENT IDENTITY (Linear / Vercel Header) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-7 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {todayFormatted}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                Semester Genap 2026/2027
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              {getGreeting()}, {profile?.name || 'Rizky Pratama'}
            </h1>

            {/* Student Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200/70">
                <School className="w-3.5 h-3.5 text-blue-600" />
                Kelas X IPA 1
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-medium border border-slate-200/70">
                NIS: {profile?.nis || '20241001'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-medium border border-slate-200/70">
                SMA Negeri 1 Maju Bersama
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/70 text-blue-700 font-medium border border-blue-200/60">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Wali: Drs. Ahmad Fauzi, M.Pd
              </span>
            </div>
          </div>

          {/* Minimalist Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/siswa/scan')}
              className="inline-flex items-center gap-2 px-5 h-11 bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
            >
              <ScanLine className="w-4 h-4" />
              <span>Pindai QR Presensi</span>
            </button>

            <button
              onClick={() => setShowLeaveModal(true)}
              className="inline-flex items-center gap-2 px-4 h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Ajukan Izin</span>
            </button>

            <button
              onClick={() => navigate('/siswa/riwayat')}
              className="inline-flex items-center gap-2 px-4 h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-xs"
            >
              <span>Riwayat Absensi</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Status Callout (Tremor Callout style - Standalone airy banner) */}
      <div>
        {isCheckedInToday ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-emerald-50/80 text-emerald-950 border border-emerald-200/90 shadow-xs text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="leading-relaxed">
                <span className="text-slate-700">Presensi Masuk telah tercatat hari ini pukul </span>
                <strong className="font-bold text-emerald-950 font-mono text-sm sm:text-base">{checkInTime}</strong>{' '}
                <span className="inline-block ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {checkInStatus === 'hadir' ? 'Tepat Waktu' : 'Terlambat'}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/siswa/scan')}
              className="h-9 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors duration-200 inline-flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pindai Ulang Kamera</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-amber-50/80 text-amber-950 border border-amber-200/90 shadow-xs text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="leading-relaxed">
                Sesi presensi KBM hari ini sedang berlangsung. Silakan lakukan pemindaian QR code guru kelas.
              </span>
            </div>

            <button
              onClick={() => navigate('/siswa/scan')}
              className="h-9 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors duration-200 inline-flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Pindai Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. STATISTIC METRIC CARDS (Tremor / shadcn Card Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Tingkat Kehadiran */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Tingkat Kehadiran</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                {stats.persentaseKehadiran >= 90 ? 'Sangat Baik' : 'Cukup'}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1 mb-1">
              {stats.persentaseKehadiran}%
            </div>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.persentaseKehadiran}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-normal">
              Akumulasi dari total pertemuan semester aktif
            </p>
          </div>
        </div>

        {/* Metric 2: Hadir Tepat Waktu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Hadir Tepat Waktu</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold text-xs border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1 mb-1 tabular-nums">
              {stats.totalHadir} <span className="text-sm font-normal text-slate-400">Sesi</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-normal">
            Tercatat sebelum jam batas toleransi masuk
          </p>
        </div>

        {/* Metric 3: Terlambat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Terlambat</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-semibold text-xs border border-amber-100">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1 mb-1 tabular-nums">
              {stats.totalTerlambat} <span className="text-sm font-normal text-slate-400">Sesi</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-normal">
            Toleransi keterlambatan 15 menit pembelajaran
          </p>
        </div>

        {/* Metric 4: Izin / Dispensasi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Izin / Dispensasi</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-xs border border-blue-100">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1 mb-1 tabular-nums">
              {stats.totalAlpha} <span className="text-sm font-normal text-slate-400">Hari</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-normal">
            Surat dokter atau izin dinas tersimpan di sistem
          </p>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT (2 Balanced Columns with generous gap) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* KOLOM KIRI (7 cols): Presensi Hari Ini & Jadwal Pelajaran */}
        <div className="lg:col-span-7 space-y-8">

          {/* KARTU PRESENSI HARI INI */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-semibold border border-blue-100">
                  <ScanLine className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Presensi Hari Ini</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Pencatatan status kedatangan dan kepulangan siswa</p>
                </div>
              </div>

              <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                {todayFormatted.split(',')[0]}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Sesi Masuk */}
              <div className="p-5 sm:p-6 rounded-xl border border-slate-200/90 bg-slate-50/70 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <LogIn className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Presensi Masuk</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {checkInStatus === 'hadir' ? 'Tepat Waktu' : 'Terlambat'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Waktu Tercatat</span>
                  <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1 block">
                    {isCheckedInToday ? checkInTime : '07:12 WIB'}
                  </span>
                </div>

                <button
                  onClick={() => navigate('/siswa/scan')}
                  className="w-full h-10 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pindai Ulang Kamera</span>
                </button>
              </div>

              {/* Sesi Pulang */}
              <div className="p-5 sm:p-6 rounded-xl border border-slate-200/90 bg-slate-50/70 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Presensi Pulang</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                    Belum Dibuka
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Jadwal Kepulangan</span>
                  <span className="text-2xl font-bold text-slate-400 font-mono tracking-tight mt-1 block">
                    14:30 WIB
                  </span>
                </div>

                <button
                  onClick={() => navigate('/siswa/scan')}
                  className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>Pindai QR Pulang</span>
                </button>
              </div>
            </div>
          </div>

          {/* JADWAL PELAJARAN (KBM) HARI INI */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold border border-blue-100">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Jadwal Pembelajaran (KBM) Hari Ini</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Kelas X IPA 1 • 4 Mata Pelajaran Terjadwal</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {TODAY_SCHEDULE.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.status === 'ongoing'
                      ? 'bg-blue-50/40 border-blue-200/80'
                      : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="text-center px-3 py-1.5 bg-white rounded-lg border border-slate-200 min-w-[76px] shadow-2xs">
                      <span className="block text-xs font-bold text-slate-900 font-mono">
                        {item.time.split(' - ')[0]}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-semibold uppercase">WIB</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{item.subject}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-500">
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

                  <div>
                    {item.status === 'completed' && (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Selesai
                      </span>
                    )}
                    {item.status === 'ongoing' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Sedang Berlangsung
                      </span>
                    )}
                    {item.status === 'upcoming' && (
                      <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                        Akan Datang
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* KOLOM KANAN (5 cols): Riwayat, Agenda, Wali Kelas */}
        <div className="lg:col-span-5 space-y-8">

          {/* RIWAYAT PRESENSI TERBARU */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold border border-emerald-100">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Riwayat Presensi Terbaru</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Catatan kedatangan siswa terakhir</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/siswa/riwayat')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentAttendances.slice(0, 5).map((att, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors duration-150"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {att.className || 'Kelas X IPA 1'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(att.checkedAt)} • {formatTime(att.checkedAt)} WIB
                    </p>
                  </div>

                  <div>
                    {att.status === 'hadir' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Hadir
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Terlambat
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AGENDA & KALENDER SEKOLAH */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-semibold border border-amber-100">
                  <CalendarDays className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Agenda & Kalender Akademik</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Kegiatan resmi sekolah semester aktif</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {UPCOMING_EVENTS.map((event, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-800 font-semibold text-xs shrink-0 shadow-2xs">
                      <span>{event.date.split(' ')[0]}</span>
                      <span className="text-[9px] text-slate-400 uppercase -mt-0.5">
                        {event.date.split(' ')[1]}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{event.date}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${event.badgeClass}`}>
                    {event.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* WALI KELAS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                  AF
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Drs. Ahmad Fauzi, M.Pd</h4>
                  <p className="text-xs text-slate-500">Wali Kelas X IPA 1 • Guru Matematika</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Piket Hari Ini
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
              Untuk keperluan izin dispensasi kegiatan, surat dokter, atau konsultasi akademik kelas, silakan hubungi Ruang Guru SMA Negeri 1 Maju Bersama.
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Ruang Guru Lt. 2
              </span>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">07.00 - 15.00 WIB</span>
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
