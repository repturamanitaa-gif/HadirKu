import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { exportToCSV, formatDate, formatTime } from '../../utils/helpers';
import { getStoredClasses, getStoredSessions } from '../../utils/initialData';
import type { ClassData, AttendanceSession, AttendanceStatus } from '../../types';

interface StudentReportRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: AttendanceStatus;
  checkedAt: string;
  source: string;
}

export default function TeacherReports() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const [reportRows, setReportRows] = useState<StudentReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    hadir: 0,
    terlambat: 0,
    tidakHadir: 0,
  });

  // 1. Fetch teacher classes
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 4000)
        );

        const fetchPromise = (async () => {
          const q = query(
            collection(db, 'classes'),
            where('teacherIds', 'array-contains', user.uid),
            where('active', '==', true)
          );
          const snap = await getDocs(q);
          let list: ClassData[] = snap.docs.map((d) => ({
            classId: d.id,
            ...d.data(),
          })) as ClassData[];

          if (list.length === 0) {
            list = getStoredClasses();
          }
          return list;
        })();

        const list = await Promise.race([fetchPromise, timeoutPromise]);
        if (isMounted) {
          setClasses(list);
          if (list.length > 0) setSelectedClassId(list[0].classId);
        }
      } catch {
        if (isMounted) {
          const list = getStoredClasses();
          setClasses(list);
          if (list.length > 0) setSelectedClassId(list[0].classId);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchClasses();
    return () => { isMounted = false; };
  }, [user]);

  // 2. Fetch sessions when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSessions([]);
      setSelectedSessionId('');
      return;
    }

    let isMounted = true;
    const fetchSessions = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 4000)
        );

        const fetchPromise = (async () => {
          const q = query(
            collection(db, 'sessions'),
            where('classId', '==', selectedClassId),
            orderBy('startsAt', 'desc')
          );
          const snap = await getDocs(q);
          let list: AttendanceSession[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              sessionId: d.id,
              classId: data.classId,
              createdBy: data.createdBy,
              startsAt: data.startsAt?.toDate() || new Date(),
              endsAt: data.endsAt?.toDate() || new Date(),
              status: data.status,
              lateThreshold: data.lateThreshold,
              tokenHash: data.tokenHash,
            };
          });

          if (list.length === 0) {
            list = getStoredSessions().filter((s) => s.classId === selectedClassId || !s.classId);
            if (list.length === 0) list = getStoredSessions();
          }
          return list;
        })();

        const list = await Promise.race([fetchPromise, timeoutPromise]);
        if (isMounted) {
          setSessions(list);
          if (list.length > 0) setSelectedSessionId(list[0].sessionId);
        }
      } catch {
        if (isMounted) {
          const list = getStoredSessions();
          setSessions(list);
          if (list.length > 0) setSelectedSessionId(list[0].sessionId);
        }
      }
    };

    fetchSessions();
    return () => { isMounted = false; };
  }, [selectedClassId]);

  // 3. Fetch report details when session changes
  useEffect(() => {
    if (!selectedClassId || !selectedSessionId) {
      setReportRows([]);
      setStats({ total: 0, hadir: 0, terlambat: 0, tidakHadir: 0 });
      return;
    }

    const fetchReport = async () => {
      setLoadingReport(true);
      try {
        const membersSnap = await getDocs(
          query(
            collection(db, 'classes', selectedClassId, 'members'),
            where('active', '==', true)
          )
        );

        const attSnap = await getDocs(
          collection(db, 'sessions', selectedSessionId, 'attendance')
        );
        const attMap = new Map<string, any>();
        attSnap.docs.forEach((docSnap) => {
          attMap.set(docSnap.id, docSnap.data());
        });

        let hadirCount = 0;
        let terlambatCount = 0;
        let tidakHadirCount = 0;

        const rows: StudentReportRow[] = [];
        for (const mDoc of membersSnap.docs) {
          const studentId = mDoc.id;
          let name = 'Siswa';
          let email = '';

          try {
            const userDoc = await getDoc(doc(db, 'users', studentId));
            if (userDoc.exists()) {
              const uData = userDoc.data();
              name = uData.name || 'Siswa';
              email = uData.email || '';
            }
          } catch (e) {
            console.error('Error getting student profile:', e);
          }

          const attendanceData = attMap.get(studentId);
          let status: AttendanceStatus = 'tidak_hadir';
          let checkedAtStr = '-';
          let sourceStr = '-';

          if (attendanceData) {
            status = attendanceData.status || 'hadir';
            const checkedDate = attendanceData.checkedAt?.toDate();
            checkedAtStr = checkedDate ? formatTime(checkedDate) : '-';
            sourceStr = attendanceData.source === 'qr_scan' ? 'Scan QR' : 'Manual';
          }

          if (status === 'hadir') hadirCount++;
          else if (status === 'terlambat') terlambatCount++;
          else tidakHadirCount++;

          rows.push({
            studentId,
            studentName: name,
            studentEmail: email,
            status,
            checkedAt: checkedAtStr,
            source: sourceStr,
          });
        }

        rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
        setReportRows(rows);
        setStats({
          total: rows.length,
          hadir: hadirCount,
          terlambat: terlambatCount,
          tidakHadir: tidakHadirCount,
        });
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoadingReport(false);
      }
    };

    fetchReport();
  }, [selectedClassId, selectedSessionId]);

  const handleExportCSV = () => {
    if (reportRows.length === 0) return;

    const currentClass = classes.find((c) => c.classId === selectedClassId);
    const currentSession = sessions.find((s) => s.sessionId === selectedSessionId);

    const exportData = reportRows.map((r, index) => ({
      No: index + 1,
      'Nama Siswa': r.studentName,
      Email: r.studentEmail,
      Status: r.status === 'hadir' ? 'Hadir' : r.status === 'terlambat' ? 'Terlambat' : 'Tidak Hadir',
      'Waktu Absensi': r.checkedAt,
      Metode: r.source,
    }));

    const dateStr = currentSession ? formatDate(currentSession.startsAt).replace(/\s+/g, '_') : 'tanggal';
    const className = currentClass?.name.replace(/\s+/g, '_') || 'kelas';

    exportToCSV(exportData, `Rekap_Absensi_${className}_${dateStr}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rekap & Laporan Kehadiran</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Lihat data absensi per sesi kelas dan unduh arsip laporan dalam format CSV
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={reportRows.length === 0 || loadingReport}
          className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span className="font-medium text-slate-700">Ekspor Berkas CSV</span>
        </button>
      </div>

      {/* Filter Panel */}
      <div className="panel p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Pilih Kelas Pengampuan
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="form-input w-full"
            disabled={loading || classes.length === 0}
          >
            {classes.length === 0 ? (
              <option value="">Belum ada kelas terdaftar</option>
            ) : (
              classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.name} — T.A. {c.academicYear}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Pilih Sesi / Tanggal Absensi
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            disabled={sessions.length === 0}
            className="form-input w-full disabled:opacity-50"
          >
            {sessions.length === 0 ? (
              <option value="">Tidak ada sesi absensi ditemukan</option>
            ) : (
              sessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {formatDate(s.startsAt)} ({formatTime(s.startsAt)} - {formatTime(s.endsAt)}) • {s.status === 'active' ? 'AKTIF' : 'DITUTUP'}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      {selectedSessionId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Anggota</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.total}</p>
          </div>
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Hadir Tepat Waktu</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{stats.hadir}</p>
          </div>
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Terlambat</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{stats.terlambat}</p>
          </div>
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tidak Hadir / Alfa</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">{stats.tidakHadir}</p>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="panel overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Rincian Siswa</h2>
            <p className="text-xs text-slate-500">Status kehadiran per siswa pada sesi yang dipilih</p>
          </div>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {reportRows.length} Siswa Terdaftar
          </span>
        </div>

        {loadingReport ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
            <span className="text-xs">Menyiapkan laporan kehadiran...</span>
          </div>
        ) : reportRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Tidak ada data untuk ditampilkan</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Silakan pilih kelas dan sesi absensi pada filter di atas.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">No</th>
                  <th>Nama Siswa</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Waktu Presensi</th>
                  <th>Metode</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row, idx) => (
                  <tr key={row.studentId}>
                    <td className="text-center text-slate-400 text-xs tabular-nums">{idx + 1}</td>
                    <td className="font-semibold text-slate-900">
                      {row.studentName}
                    </td>
                    <td className="text-slate-500 text-xs font-mono">
                      {row.studentEmail || '-'}
                    </td>
                    <td>
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="text-slate-600 text-xs tabular-nums">
                      {row.checkedAt}
                    </td>
                    <td className="text-xs text-slate-500">
                      {row.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
