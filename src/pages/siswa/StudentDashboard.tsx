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
  Globe,
  FilePlus2,
  LogIn,
  LogOut,
  MoreHorizontal,
  Plus,
  Home,
  Calendar,
  GraduationCap,
  MessageSquare,
  Settings,
  CheckCircle2,
  X,
  Upload,
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  MapPin,
  User,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { formatTime } from '../../utils/helpers';
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
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  {
    date: '28 Okt 2026',
    title: 'Upacara Peringatan Hari Sumpah Pemuda',
    category: 'Kegiatan',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  {
    date: '02 Nov 2026',
    title: 'Praktikum Lapangan Biologi Lingkungan',
    category: 'Praktikum',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
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

  // School Web Modal
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  // Active bottom tab
  const [activeTab, setActiveTab] = useState<'beranda' | 'kegiatan' | 'scan' | 'status' | 'settings'>('beranda');

  // Stats
  const [stats, setStats] = useState({
    totalHadir: 18,
    totalTerlambat: 2,
    totalAlpha: 0,
    persentaseKehadiran: 96,
  });

  // Today's date in Indonesian
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
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
          const classesSnap = await getDocs(query(collection(db, 'classes'), where('active', '==', true)));
          const enrolledClasses: StudentClassInfo[] = [];

          for (const cDoc of classesSnap.docs) {
            const memberDoc = await getDocs(
              query(collection(db, 'classes', cDoc.id, 'members'), where('__name__', '==', user.uid), where('active', '==', true))
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
          console.warn('Real student sync info:', err);
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

  const handleLogout = () => {
    localStorage.removeItem('hadirku_demo_user');
    window.location.href = '/HadirKu/login';
  };

  const todayRecord = recentAttendances.length > 0 ? recentAttendances[0] : null;
  const isCheckedInToday = Boolean(todayRecord && todayRecord.status === 'hadir');
  const checkInTime = todayRecord ? formatTime(todayRecord.checkedAt) : '07.12 WIB';

  return (
    <div className="min-h-screen bg-[#F0F2F8] text-slate-800 antialiased pb-28 lg:pb-12">
      {/* Top Header Bar for Desktop View */}
      <header className="hidden lg:block bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center font-bold shadow-xs">
              H
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">HadirKu</span>
              <span className="text-xs text-slate-400 font-medium ml-2">Portal Siswa Digital</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">{profile?.name || 'Muhammad Rizky Pratama'}</p>
              <p className="text-[11px] text-slate-500 font-medium">NIS: {profile?.nis || '20241001'} • Kelas X IPA 1</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-indigo-200 flex items-center justify-center text-slate-600 font-bold text-sm">
              R
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Responsive Wrapper */}
      <main className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 pt-0 sm:pt-4 lg:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ======================================================== */}
          {/* KOLOM KIRI (MOBILE CARD PERSIS FOTO): lg:col-span-5 / 12 */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-[#F8FAFC] shadow-xl sm:rounded-3xl overflow-hidden border border-slate-200/60 flex flex-col justify-between">
              
              <div>
                {/* 1. TOP CURVED GRADIENT HEADER (Ungu dengan Motif Nodes) */}
                <div className="relative bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#7C3AED] pt-7 pb-12 px-5 rounded-b-[36px] shadow-[0_12px_30px_rgba(79,70,229,0.25)] overflow-hidden">
                  {/* Subtle network/nodes overlay background pattern */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="nodes" width="60" height="60" patternUnits="userSpaceOnUse">
                          <circle cx="10" cy="10" r="2.5" fill="#FFFFFF" />
                          <circle cx="45" cy="40" r="2" fill="#FFFFFF" />
                          <line x1="10" y1="10" x2="45" y2="40" stroke="#FFFFFF" strokeWidth="0.8" />
                          <circle cx="50" cy="12" r="1.5" fill="#FFFFFF" />
                          <line x1="10" y1="10" x2="50" y2="12" stroke="#FFFFFF" strokeWidth="0.8" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#nodes)" />
                    </svg>
                  </div>

                  {/* Profile Avatar & Greeting */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      {/* Circular Avatar */}
                      <div className="w-13 h-13 rounded-full bg-slate-300 border-2 border-white/90 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-500">
                          <svg className="w-8 h-8 translate-y-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      </div>

                      {/* Greeting Name & NIS */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm font-semibold tracking-tight">👋 Hai,</span>
                          <span className="text-white text-sm font-bold truncate">
                            {profile?.name || 'Rizky Pratama'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-block bg-white/20 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-white/25 truncate">
                            NIS: {profile?.nis || '20241001'} • X IPA 1
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white/90 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Keluar"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. MENU CEPAT 4 IKON HORISONTAL */}
                <div className="relative z-20 -mt-6 mx-4">
                  <div className="bg-white rounded-2xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-between gap-1">
                    {/* Jadwal */}
                    <button
                      onClick={() => setActiveTab('kegiatan')}
                      className="flex flex-col items-center flex-1 py-1 group cursor-pointer transition-transform active:scale-95"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-[#E6FFFA] text-[#059669] flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                        <CalendarDays className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Jadwal</span>
                    </button>

                    {/* Riwayat */}
                    <button
                      onClick={() => navigate('/siswa/riwayat')}
                      className="flex flex-col items-center flex-1 py-1 group cursor-pointer transition-transform active:scale-95"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Riwayat</span>
                    </button>

                    {/* Web Sekolah */}
                    <button
                      onClick={() => setShowSchoolModal(true)}
                      className="flex flex-col items-center flex-1 py-1 group cursor-pointer transition-transform active:scale-95"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                        <Globe className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Web Sekolah</span>
                    </button>

                    {/* Izin KBM */}
                    <button
                      onClick={() => setShowLeaveModal(true)}
                      className="flex flex-col items-center flex-1 py-1 group cursor-pointer transition-transform active:scale-95"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                        <FilePlus2 className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Izin KBM</span>
                    </button>
                  </div>
                </div>

                {/* 3. KARTU: PRESENSI HARI INI */}
                <div className="mx-4 mt-4">
                  <div className="bg-white rounded-3xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                        Presensi Hari Ini
                      </h2>
                      <span className="text-[11px] font-medium text-slate-400 capitalize">
                        {todayFormatted}
                      </span>
                    </div>

                    {/* Action Buttons: Datang vs Pulang */}
                    <div className="grid grid-cols-2 gap-3 mt-3.5">
                      {/* Tombol Datang (Ungu) */}
                      <button
                        onClick={() => navigate('/siswa/scan')}
                        className="w-full h-12 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(67,56,202,0.28)] active:scale-95 transition-all cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span>Datang</span>
                      </button>

                      {/* Tombol Pulang (Pink / Rose) */}
                      <button
                        onClick={() => navigate('/siswa/scan')}
                        className="w-full h-12 bg-[#F43F5E] hover:bg-[#E11D48] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(244,63,94,0.28)] active:scale-95 transition-all cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span>Pulang</span>
                      </button>
                    </div>

                    {/* Tombol Ajukan Surat Izin */}
                    <button
                      onClick={() => setShowLeaveModal(true)}
                      className="w-full mt-3 h-10 border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/70 rounded-full text-slate-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5] text-slate-500" />
                      <span>Ajukan surat izin</span>
                    </button>
                  </div>
                </div>

                {/* 4. KARTU: RIWAYAT PRESENSI */}
                <div className="mx-4 mt-4 mb-5">
                  <div className="bg-white rounded-3xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100">
                    <div className="flex items-center justify-between pb-3">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        Riwayat Presensi
                      </h3>
                      <button
                        onClick={() => navigate('/siswa/riwayat')}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Lihat semua riwayat"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Datang */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Datang</h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {isCheckedInToday ? checkInTime : '07.12 WIB'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                          Hadir Tepat Waktu
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 my-1" />

                    {/* Pulang */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Pulang</h4>
                          <p className="text-[11px] text-slate-400 font-medium">--:--</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                          Belum presensi
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. BOTTOM NAVIGATION DOCK (Mobile App Dock) */}
              <div className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] sm:rounded-b-3xl">
                <div className="flex items-center justify-around relative">
                  <button
                    onClick={() => setActiveTab('beranda')}
                    className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
                      activeTab === 'beranda' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Home className="w-5 h-5 stroke-[2.2]" />
                    <span className="text-[10px] font-bold mt-1">Beranda</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('kegiatan')}
                    className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
                      activeTab === 'kegiatan' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Calendar className="w-5 h-5 stroke-[2.2]" />
                    <span className="text-[10px] font-semibold mt-1">Kegiatan</span>
                  </button>

                  {/* Center Floating E-School Button */}
                  <div className="relative -top-5 flex flex-col items-center">
                    <button
                      onClick={() => navigate('/siswa/scan')}
                      className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#8B5CF6] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(79,70,229,0.4)] ring-4 ring-white active:scale-95 transition-transform cursor-pointer"
                      title="Pindai QR Presensi"
                    >
                      <GraduationCap className="w-6 h-6 stroke-[2.2]" />
                    </button>
                    <span className="text-[10px] font-bold text-[#4F46E5] mt-0.5">E-School</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('status');
                      setShowLeaveModal(true);
                    }}
                    className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
                      activeTab === 'status' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 stroke-[2.2]" />
                    <span className="text-[10px] font-semibold mt-1">Status</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
                      activeTab === 'settings' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Settings className="w-5 h-5 stroke-[2.2]" />
                    <span className="text-[10px] font-semibold mt-1">Settings</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* KOLOM KANAN (DESKTOP EXPANDED INFO HUB): lg:col-span-7 */}
          {/* ======================================================== */}
          <div className="hidden lg:block lg:col-span-7 space-y-6">
            
            {/* Kartu Ringkasan Metrik Siswa */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  {stats.persentaseKehadiran}%
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tingkat Hadir</p>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Sangat Baik</h4>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center font-bold text-lg">
                  {stats.totalHadir}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Masuk</p>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Hari Efektif</h4>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                  {stats.totalTerlambat}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Terlambat</p>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Sesi Bulan Ini</h4>
                </div>
              </div>
            </div>

            {/* Jadwal Pelajaran (KBM) Hari Ini */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Jadwal Pembelajaran (KBM) Hari Ini</h3>
                    <p className="text-xs text-slate-400 font-medium">Kelas X IPA 1 • Semester Genap 2025/2026</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#4F46E5] bg-indigo-50 px-3 py-1 rounded-full">
                  4 Mata Pelajaran
                </span>
              </div>

              <div className="space-y-3">
                {TODAY_SCHEDULE.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between ${
                      item.status === 'ongoing'
                        ? 'bg-indigo-50/40 border-indigo-200'
                        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="text-center px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <span className="block text-[11px] font-bold text-slate-800">{item.time.split(' - ')[0]}</span>
                        <span className="block text-[10px] text-slate-400">WIB</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.subject}</h4>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {item.teacher}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.room}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {item.status === 'completed' && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-full">
                          Selesai
                        </span>
                      )}
                      {item.status === 'ongoing' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full animate-pulse">
                          Sedang Berlangsung
                        </span>
                      )}
                      {item.status === 'upcoming' && (
                        <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                          Akan Datang
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kalender Akademik & Agenda Sekolah */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Agenda & Kalender Akademik Terdekat</h3>
                    <p className="text-xs text-slate-400 font-medium">Informasi resmi dari Kurikulum & Kesiswaan</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {UPCOMING_EVENTS.map((event, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-700 font-bold text-xs shadow-2xs">
                        <span>{event.date.split(' ')[0]}</span>
                        <span className="text-[9px] text-slate-400 uppercase -mt-0.5">{event.date.split(' ')[1]}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{event.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{event.date}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${event.badgeColor}`}>
                      {event.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL: AJUKAN SURAT IZIN / KBM */}
      {/* ======================================================== */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <FilePlus2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ajukan Surat Izin KBM</h3>
                <p className="text-[11px] text-slate-500">Pemberitahuan resmi ke Guru & Admin</p>
              </div>
            </div>

            {leaveSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Pengajuan Terkirim!</h4>
                <p className="text-xs text-slate-500">
                  Surat izin Anda telah diteruskan ke Wali Kelas dan tercatat di sistem.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendLeave} className="space-y-3.5 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jenis Keterangan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['sakit', 'izin', 'dispensasi'] as const).map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setLeaveType(type)}
                        className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                          leaveType === type
                            ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alasan / Keterangan
                  </label>
                  <textarea
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Contoh: Mengalami demam dan disarankan istirahat oleh dokter..."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent placeholder:text-slate-400"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                  <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Lampirkan Bukti / Surat Dokter
                  </span>
                  <span className="text-[10px] text-slate-400 block">PNG, JPG, PDF (Maks. 2MB)</span>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    Kirim Surat Izin
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INFO WEB SEKOLAH */}
      {/* ======================================================== */}
      {showSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowSchoolModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Portal Web Sekolah</h3>
                <p className="text-[11px] text-slate-500">SMA Negeri 1 HadirKu Digital</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800">Visi Sekolah</p>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Terwujudnya insan cendekia yang berkarakter unggul, melek teknologi digital, dan berdaya saing global.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <p className="font-bold text-slate-800">Tautan Resmi</p>
                <a
                  href="https://kemdikbud.go.id"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[#4F46E5] font-semibold hover:underline"
                >
                  🌐 www.sman1hadirku.sch.id
                </a>
                <p className="text-[11px] text-slate-400">Jl. Pendidikan No. 45, Kota Pelajar</p>
              </div>
            </div>

            <button
              onClick={() => setShowSchoolModal(false)}
              className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
