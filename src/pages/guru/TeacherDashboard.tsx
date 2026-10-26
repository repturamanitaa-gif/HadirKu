import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Calendar,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniCalendar from '../../components/dashboard/MiniCalendar';
import AttendanceProgressWidget from '../../components/dashboard/AttendanceProgressWidget';
import AttendanceTrendsChart from '../../components/dashboard/AttendanceTrendsChart';
import AttendanceDonutChart from '../../components/dashboard/AttendanceDonutChart';
import { formatDate, formatTime } from '../../utils/helpers';
import { getStoredClasses, getStoredSessions } from '../../utils/initialData';
import type { ClassData, AttendanceSession } from '../../types';

export default function TeacherDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    // Immediately seed with initial data
    const initialClasses = getStoredClasses();
    const initialSessions = getStoredSessions();
    setClasses(initialClasses);
    setTotalStudentsCount(96);
    setSessions(initialSessions);
    setLoading(false);

    if (user && !user.uid.startsWith('demo-')) {
      const fetchTeacherData = async () => {
        try {
          const classesQ = query(
            collection(db, 'classes'),
            where('teacherIds', 'array-contains', user.uid),
            where('active', '==', true)
          );
          const classesSnap = await getDocs(classesQ);
          if (classesSnap.docs.length > 0 && isMounted) {
            const classesList: ClassData[] = classesSnap.docs.map((docSnap) => ({
              classId: docSnap.id,
              ...docSnap.data(),
            })) as ClassData[];
            setClasses(classesList);
          }

          const sessionsQ = query(
            collection(db, 'sessions'),
            where('createdBy', '==', user.uid),
            orderBy('startsAt', 'desc'),
            limit(15)
          );
          const sessionsSnap = await getDocs(sessionsQ);
          if (sessionsSnap.docs.length > 0 && isMounted) {
            const sessionsList: AttendanceSession[] = sessionsSnap.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                sessionId: docSnap.id,
                classId: d.classId,
                className: d.className || 'Kelas',
                createdBy: d.createdBy,
                startsAt: d.startsAt?.toDate() || new Date(),
                endsAt: d.endsAt?.toDate() || new Date(),
                lateThreshold: d.lateThreshold,
                status: d.status || 'closed',
                tokenHash: d.tokenHash,
              };
            });
            setSessions(sessionsList);
          }
        } catch (e) {
          console.warn('TeacherDashboard sync:', e);
        }
      };
      fetchTeacherData();
    }

    return () => { isMounted = false; };
  }, [user]);

  const activeSessions = sessions.filter((s) => s.status === 'active');

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in pb-16">
      {/* 1. HERO HEADER: GURU OVERVIEW (Linear / Vercel style) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-7 sm:p-9 shadow-xs">
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
              Dashboard Guru Pengampu
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
              Selamat datang, {profile?.name || 'Bapak/Ibu Guru'}. Kelola presensi kelas binaan, buat sesi QR dinamis, dan pantau absensi secara real-time.
            </p>
          </div>

          {/* Minimalist Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/guru/sesi')}
              className="inline-flex items-center gap-2 px-5 h-11 bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Sesi Presensi</span>
            </button>

            <button
              onClick={() => navigate('/guru/rekap')}
              className="inline-flex items-center gap-2 px-5 h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Rekap Kehadiran</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATISTIC METRIC CARDS (Tremor / shadcn Card Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-h-[145px]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Kelas Diampu</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-semibold text-xs border border-blue-100">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1 mb-1 tabular-nums">
              {classes.length}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kelas aktif semester ini</span>
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-h-[145px]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Total Siswa Binaan</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-semibold text-xs border border-blue-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1 mb-1 tabular-nums">
              {totalStudentsCount}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terdaftar di rombel binaan</span>
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-h-[145px]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Sesi Aktif Saat Ini</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-semibold text-xs border border-amber-100">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1 mb-1 tabular-nums">
              {activeSessions.length}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeSessions.length > 0 ? 'Sedang menerima scan' : 'Belum ada sesi aktif'}</span>
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-h-[145px]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Total Riwayat Sesi</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold text-xs border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1 mb-1 tabular-nums">
              {sessions.length}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Presensi selesai tercatat</span>
          </p>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT (2 Balanced Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (8 cols): Sesi Table & Analytics */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Sesi Presensi Kelas
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar sesi absensi yang telah dibuat
                </p>
              </div>

              <button
                onClick={() => navigate('/guru/sesi')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Buka Panel QR & Live</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="table-container border-0 rounded-none">
              {loading ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Memuat data sesi...
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Anda belum pernah membuat sesi presensi.
                </div>
              ) : (
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Kelas</th>
                      <th>Waktu Pelaksanaan</th>
                      <th>Status</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 6).map((s) => (
                      <tr key={s.sessionId}>
                        <td className="font-semibold text-slate-900 text-xs">
                          {s.className}
                        </td>
                        <td className="text-slate-600 text-xs">
                          <span className="block font-medium">{formatDate(s.startsAt)}</span>
                          <span className="block text-slate-400 font-mono text-[11px] mt-0.5">
                            {formatTime(s.startsAt)} — {formatTime(s.endsAt)}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={s.status} size="sm" />
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => navigate('/guru/sesi')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1 px-2.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <span>{s.status === 'active' ? 'Buka QR' : 'Detail'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <AttendanceTrendsChart />
            <AttendanceDonutChart
              hadir={Math.max(16, Math.round(totalStudentsCount * 0.88))}
              terlambat={3}
              tidakHadir={1}
            />
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          <MiniCalendar />

          <AttendanceProgressWidget
            percentage={94}
            attended={24}
            total={26}
            label="Presensi Siswa Binaan"
          />

          {/* Classes taught */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Kelas yang Diampu
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Rombel pengampuan aktif</p>
              </div>
              <button
                onClick={() => navigate('/guru/kelas')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2.5">
              {classes.slice(0, 4).map((c) => (
                <div
                  key={c.classId}
                  className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">{c.name}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">T.A. {c.academicYear}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
