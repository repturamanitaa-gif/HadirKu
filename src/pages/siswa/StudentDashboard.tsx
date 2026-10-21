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
  Sparkles,
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

  // Active bottom tab
  const [activeTab, setActiveTab] = useState<'beranda' | 'kegiatan' | 'scan' | 'status' | 'settings'>('beranda');

  // Stats
  const [stats, setStats] = useState({
    totalHadir: 0,
    totalTerlambat: 0,
    totalAlpha: 0,
    persentaseKehadiran: 100,
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
    const hadir = initialHistory.filter((h) => h.status === 'hadir').length;
    const terlambat = initialHistory.filter((h) => h.status === 'terlambat').length;
    const tidakHadir = initialHistory.filter((h) => h.status === 'tidak_hadir').length;
    const total = hadir + terlambat + tidakHadir;
    const pct = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 98;

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

  // Find if today already checked in
  const todayRecord = recentAttendances.length > 0 ? recentAttendances[0] : null;
  const isCheckedInToday = Boolean(todayRecord && todayRecord.status === 'hadir');
  const checkInTime = todayRecord ? formatTime(todayRecord.checkedAt) : '06:48 WIB';

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-24 -m-4 sm:-m-6 lg:-m-8">
      {/* Maximum width container for authentic mobile app experience */}
      <div className="max-w-md mx-auto relative bg-[#F4F6FB] min-h-screen shadow-xl sm:rounded-3xl overflow-hidden flex flex-col justify-between">
        
        <div>
          {/* ======================================================== */}
          {/* 1. TOP CURVED GRADIENT HEADER */}
          {/* ======================================================== */}
          <div className="relative bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#7C3AED] pt-7 pb-12 px-5 rounded-b-[36px] shadow-[0_12px_32px_rgba(79,70,229,0.22)] overflow-hidden">
            {/* Subtle network/nodes overlay background pattern */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
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
            <div className="relative z-10 flex items-center gap-3.5">
              {/* Circular Avatar */}
              <div className="w-13 h-13 rounded-full bg-slate-300/80 border-2 border-white/90 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-500">
                  <svg className="w-8 h-8 translate-y-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>

              {/* Greeting Name & NIS */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-semibold tracking-tight">👋 Hai,</span>
                  <span className="text-white text-sm font-bold truncate">
                    {profile?.name || 'Rizky Pratama'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-block bg-white/20 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-white/25 truncate">
                    NIS: {profile?.nis || '20241001'} • {classes[0]?.name || 'X IPA 1'}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={async () => {
                  const { logout } = await import('../../contexts/AuthContext').then(() => ({ logout: () => localStorage.removeItem('hadirku_demo_user') }));
                  logout();
                  window.location.href = '/HadirKu/login';
                }}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white/90 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. QUICK ACTIONS (4 HORIZONTAL ICONS) */}
          {/* ======================================================== */}
          <div className="relative z-20 -mt-6 mx-4">
            <div className="bg-white rounded-2xl p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between gap-1">
              {/* 1. Jadwal */}
              <button
                onClick={() => navigate('/siswa')}
                className="flex flex-col items-center flex-1 py-1 group cursor-pointer transition-transform active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#E6FFFA] text-[#059669] flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Jadwal</span>
              </button>

              {/* 2. Riwayat */}
              <button
                onClick={() => navigate('/siswa/riwayat')}
                className="flex flex-col items-center flex-1 py-1 group cursor-pointer transition-transform active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Riwayat</span>
              </button>

              {/* 3. Web Sekolah */}
              <a
                href="https://sekolah.kemdikbud.go.id"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center flex-1 py-1 group cursor-pointer transition-transform active:scale-95 no-underline"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[64px]">
                  Web Sekolah
                </span>
              </a>

              {/* 4. Izin KBM */}
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

          {/* ======================================================== */}
          {/* 3. KARTU: PRESENSI HARI INI (DATANG & PULANG BUTTONS) */}
          {/* ======================================================== */}
          <div className="mx-4 mt-4">
            <div className="bg-white rounded-3xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100">
              {/* Header Title + Date */}
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
                {/* Tombol Datang (Ungu/Indigo solid) */}
                <button
                  onClick={() => navigate('/siswa/scan')}
                  className="w-full h-12 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(67,56,202,0.28)] active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>Datang</span>
                </button>

                {/* Tombol Pulang (Pink/Rose cerah) */}
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

          {/* ======================================================== */}
          {/* 4. KARTU: RIWAYAT PRESENSI (DATANG & PULANG) */}
          {/* ======================================================== */}
          <div className="mx-4 mt-4">
            <div className="bg-white rounded-3xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100">
              {/* Header */}
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

              {/* Item: Datang */}
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Datang</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {isCheckedInToday ? checkInTime : '--:--'}
                    </p>
                  </div>
                </div>

                <div>
                  {isCheckedInToday ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      Hadir Tepat Waktu
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-100/60">
                      Belum presensi
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 my-1" />

              {/* Item: Pulang */}
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
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-100/60">
                    Belum presensi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. BOTTOM NAVIGATION DOCK (WITH FLOATING CENTER ICON) */}
        {/* ======================================================== */}
        <div className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] sm:rounded-b-3xl">
          <div className="flex items-center justify-around relative">
            {/* 1. Beranda */}
            <button
              onClick={() => setActiveTab('beranda')}
              className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
                activeTab === 'beranda' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] font-bold mt-1">Beranda</span>
            </button>

            {/* 2. Kegiatan */}
            <button
              onClick={() => {
                setActiveTab('kegiatan');
                navigate('/siswa/riwayat');
              }}
              className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
                activeTab === 'kegiatan' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] font-semibold mt-1">Kegiatan</span>
            </button>

            {/* 3. Center Floating E-School / Scan Button */}
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

            {/* 4. Status */}
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

            {/* 5. Settings */}
            <button
              onClick={() => navigate('/siswa/riwayat')}
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
    </div>
  );
}
