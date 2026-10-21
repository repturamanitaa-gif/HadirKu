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
  ScanLine,
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Award,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniCalendar from '../../components/dashboard/MiniCalendar';
import AttendanceProgressWidget from '../../components/dashboard/AttendanceProgressWidget';
import AttendanceTrendsChart from '../../components/dashboard/AttendanceTrendsChart';
import AttendanceDonutChart from '../../components/dashboard/AttendanceDonutChart';
import { formatDate, formatTime } from '../../utils/helpers';
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

  const [stats, setStats] = useState({
    totalHadir: 0,
    totalTerlambat: 0,
    totalAlpha: 0,
    persentaseKehadiran: 100,
  });

  useEffect(() => {
    if (!user) return;

    const initialClasses = getStoredClasses().filter((c) => c.name === 'X IPA 1');
    const initialHistory = getStoredStudentAttendance();
    const hadir = initialHistory.filter((h) => h.status === 'hadir').length;
    const terlambat = initialHistory.filter((h) => h.status === 'terlambat').length;
    const tidakHadir = initialHistory.filter((h) => h.status === 'tidak_hadir').length;
    const total = hadir + terlambat + tidakHadir;
    const pct = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 95;

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

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Portal Presensi Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selamat datang, {profile?.name || 'Siswa'}. Pindai QR Code untuk mencatat kehadiran hari ini.
          </p>
        </div>

        <button
          onClick={() => navigate('/siswa/scan')}
          className="btn btn-primary text-xs"
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>Scan QR Presensi</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Tingkat Kehadiran
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
                {stats.persentaseKehadiran}%
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8EDFF] text-[#2563EB] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Persentase kehadiran semester ini</span>
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Hadir Tepat Waktu
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
                {stats.totalHadir}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8EDFF] text-[#2563EB] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Presensi sebelum toleransi waktu</span>
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Terlambat
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
                {stats.totalTerlambat}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8EDFF] text-[#2563EB] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Melebihi toleransi waktu guru</span>
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Kelas Terdaftar
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
            <span>Rombel aktif Anda</span>
          </p>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Table & Charts */}
        <div className="lg:col-span-8 space-y-6">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Riwayat Presensi Terbaru
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan kehadiran pada sesi yang baru diikuti
                </p>
              </div>

              <button
                onClick={() => navigate('/siswa/riwayat')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Lihat Seluruh Riwayat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="table-container border-x-0 border-b-0 rounded-b-xl">
              {loading ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Memuat data riwayat...
                </div>
              ) : recentAttendances.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Belum ada catatan presensi yang tersimpan.
                </div>
              ) : (
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Kelas</th>
                      <th>Waktu Tercatat</th>
                      <th>Metode</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendances.slice(0, 6).map((rec, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold text-slate-900">
                          {rec.className}
                        </td>
                        <td className="text-slate-600 text-xs">
                          <span className="block font-medium">{formatDate(rec.checkedAt)}</span>
                          <span className="block text-slate-400">
                            Pukul {formatTime(rec.checkedAt)} WIB
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs">
                          {rec.source === 'qr_scan' ? 'Scan Kamera QR' : 'Koreksi Guru'}
                        </td>
                        <td className="text-right">
                          <StatusBadge status={rec.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AttendanceTrendsChart />
            <AttendanceDonutChart
              hadir={Math.max(12, stats.totalHadir)}
              terlambat={stats.totalTerlambat || 1}
              tidakHadir={stats.totalAlpha || 0}
            />
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <MiniCalendar />

          <AttendanceProgressWidget
            percentage={stats.persentaseKehadiran}
            attended={stats.totalHadir}
            total={stats.totalHadir + stats.totalTerlambat + stats.totalAlpha || 1}
            label="Progres Kehadiran Semester"
          />

          {/* Enrolled Classes */}
          <div className="panel p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
              Kelas Terdaftar
            </h3>
            <div className="space-y-2">
              {classes.map((c) => (
                <div
                  key={c.classId}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800 block">{c.name}</span>
                    <span className="text-[11px] text-slate-400">T.A. {c.academicYear}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
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
