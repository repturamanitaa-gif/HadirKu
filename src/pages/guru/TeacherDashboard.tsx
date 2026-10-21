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

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Guru Pengampu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selamat datang, {profile?.name || 'Bapak/Ibu Guru'}. Kelola presensi kelas dan tampilkan QR code.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/guru/rekap')}
            className="btn btn-secondary text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Rekap Kehadiran</span>
          </button>
          <button
            onClick={() => navigate('/guru/sesi')}
            className="btn btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Sesi Presensi</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Kelas Diampu
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
                {classes.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8EDFF] text-[#2563EB] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Kelas aktif semester ini</span>
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Siswa Binaan
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
                {totalStudentsCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8EDFF] text-[#2563EB] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Terdaftar di rombel binaan</span>
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Sesi Aktif Saat Ini
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
                {activeSessions.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8EDFF] text-[#2563EB] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>{activeSessions.length > 0 ? 'Sedang menerima scan' : 'Belum ada sesi aktif'}</span>
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Riwayat Sesi
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
                {sessions.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8EDFF] text-[#2563EB] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Presensi selesai tercatat</span>
          </p>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Sesi Table & Analytics */}
        <div className="lg:col-span-8 space-y-6">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Sesi Presensi Kelas
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar sesi absensi yang telah dibuat
                </p>
              </div>

              <button
                onClick={() => navigate('/guru/sesi')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Buka Panel QR & Live</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="table-container border-x-0 border-b-0 rounded-b-xl">
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
                        <td className="font-semibold text-slate-900">
                          {s.className}
                        </td>
                        <td className="text-slate-600 text-xs">
                          <span className="block font-medium">{formatDate(s.startsAt)}</span>
                          <span className="block text-slate-400">
                            {formatTime(s.startsAt)} — {formatTime(s.endsAt)}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={s.status} size="sm" />
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => navigate('/guru/sesi')}
                            className="btn btn-secondary text-xs h-7 px-2.5 py-0"
                          >
                            {s.status === 'active' ? 'Buka QR' : 'Detail'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AttendanceTrendsChart />
            <AttendanceDonutChart
              hadir={Math.max(16, Math.round(totalStudentsCount * 0.88))}
              terlambat={3}
              tidakHadir={1}
            />
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <MiniCalendar />

          <AttendanceProgressWidget
            percentage={94}
            attended={24}
            total={26}
            label="Presensi Siswa Binaan"
          />

          {/* Classes taught */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Kelas yang Diampu
              </h3>
              <button
                onClick={() => navigate('/guru/kelas')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2">
              {classes.slice(0, 4).map((c) => (
                <div
                  key={c.classId}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800 block">{c.name}</span>
                    <span className="text-[11px] text-slate-400">T.A. {c.academicYear}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
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
