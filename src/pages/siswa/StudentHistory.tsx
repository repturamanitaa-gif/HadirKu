import { useEffect, useState } from 'react';
import {
  getDocs,
  query,
  where,
  collectionGroup,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  History,
  Clock,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate, formatTime } from '../../utils/helpers';
import { getStoredStudentAttendance } from '../../utils/initialData';
import type { AttendanceRecord } from '../../types';

interface HistoryItem extends AttendanceRecord {
  className?: string;
}

export default function StudentHistory() {
  const { user, profile } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Seed immediately with realistic attendance history
    const initial = getStoredStudentAttendance();
    setHistory(initial);
    setLoading(false);

    if (!user || user.uid.startsWith('demo-')) return;

    const fetchHistory = async () => {
      try {
        const attQ = query(
          collectionGroup(db, 'attendance'),
          where('__name__', '==', user.uid)
        );
        const attSnap = await getDocs(attQ);

        const items: HistoryItem[] = [];

        for (const d of attSnap.docs) {
          const data = d.data();
          const sessionDocRef = d.ref.parent.parent;
          let className = 'Kelas';

          if (sessionDocRef) {
            try {
              const sessionSnap = await getDoc(sessionDocRef);
              if (sessionSnap.exists()) {
                const sData = sessionSnap.data();
                if (sData.classId) {
                  const classSnap = await getDoc(doc(db, 'classes', sData.classId));
                  if (classSnap.exists()) {
                    className = classSnap.data().name || 'Kelas';
                  }
                }
              }
            } catch (e) {
              console.warn('Error fetching session info:', e);
            }
          }

          items.push({
            studentId: d.id,
            studentName: profile?.name || 'Siswa',
            status: data.status || 'hadir',
            checkedAt: data.checkedAt?.toDate() || new Date(),
            source: data.source || 'qr_scan',
            className,
          });
        }

        items.sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime());
        setHistory(items);
      } catch (err) {
        console.error('Error fetching attendance history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, profile]);

  const filteredHistory = history.filter((item) => {
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch =
      (item.className || '').toLowerCase().includes(search.toLowerCase()) ||
      formatDate(item.checkedAt).toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalHadir = history.filter((h) => h.status === 'hadir').length;
  const totalTerlambat = history.filter((h) => h.status === 'terlambat').length;
  const totalTidakHadir = history.filter((h) => h.status === 'tidak_hadir').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Presensi Pribadi</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Catatan lengkap kehadiran Anda di seluruh sesi pembelajaran yang telah diikuti.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="panel p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Sesi
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
            {history.length}
          </span>
        </div>
        <div className="panel p-4">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Hadir Tepat Waktu
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
            {totalHadir}
          </span>
        </div>
        <div className="panel p-4">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Terlambat
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
            {totalTerlambat}
          </span>
        </div>
        <div className="panel p-4">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            Alfa / Izin
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
            {totalTidakHadir}
          </span>
        </div>
      </div>

      {/* Filter and Table Panel */}
      <div className="panel">
        <div className="panel-header flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kelas atau tanggal..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'hadir', label: 'Hadir' },
              { key: 'terlambat', label: 'Terlambat' },
              { key: 'tidak_hadir', label: 'Tidak Hadir' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  filterStatus === tab.key
                    ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="table-container border-x-0 border-b-0 rounded-b-xl">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat data riwayat presensi...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Tidak ada catatan presensi ditemukan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {search || filterStatus !== 'all'
                  ? 'Coba sesuaikan kata kunci pencarian atau filter status.'
                  : 'Belum ada sesi presensi yang tersimpan untuk akun Anda.'}
              </p>
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Kelas</th>
                  <th>Tanggal Presensi</th>
                  <th>Waktu Masuk</th>
                  <th>Metode</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, index) => (
                  <tr key={index}>
                    <td className="font-semibold text-slate-900">
                      {item.className}
                    </td>
                    <td className="text-slate-600 text-xs">
                      {formatDate(item.checkedAt)}
                    </td>
                    <td className="text-slate-600 text-xs tabular-nums">
                      {formatTime(item.checkedAt)} WIB
                    </td>
                    <td className="text-slate-500 text-xs">
                      {item.source === 'qr_scan' ? 'Scan Kamera QR' : 'Manual Guru'}
                    </td>
                    <td className="text-right">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
