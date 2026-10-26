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
  Filter,
  FileSpreadsheet,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. PAGE HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md w-fit mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Rekam Jejak Kehadiran</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Riwayat Presensi Siswa
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Catatan lengkap riwayat kedatangan pembelajaran Anda yang terverifikasi melalui pemindaian QR code dinamis dan rekap kehadiran guru kelas.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Semester Genap</span>
            <span className="text-sm font-bold text-slate-800">Tahun Ajaran 2026/2027</span>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Total Presensi</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            {history.length}
          </div>
          <p className="text-xs text-slate-400 mt-2">Seluruh sesi tercatat</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
            <span>Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            {totalHadir}
          </div>
          <p className="text-xs text-slate-400 mt-2">Masuk sebelum batas toleransi</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            <span>Terlambat</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            {totalTerlambat}
          </div>
          <p className="text-xs text-slate-400 mt-2">Toleransi 15 menit KBM</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700 uppercase tracking-wider mb-2">
            <span>Alfa / Izin</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            {totalTidakHadir}
          </div>
          <p className="text-xs text-slate-400 mt-2">Surat dispensasi / izin</p>
        </div>
      </div>

      {/* 3. SEARCH, FILTERS & ATTENDANCE TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Bar with guaranteed non-overlapping search padding */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mata pelajaran atau tanggal..."
              style={{ paddingLeft: '2.75rem', paddingRight: '1rem' }}
              className="w-full h-11 text-xs bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all shadow-2xs"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'all', label: 'Semua Status' },
              { key: 'hadir', label: 'Tepat Waktu' },
              { key: 'terlambat', label: 'Terlambat' },
              { key: 'tidak_hadir', label: 'Tidak Hadir' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-4 h-10 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterStatus === tab.key
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={History}
                title="Tidak Ada Catatan Presensi Ditemukan"
                description={
                  search || filterStatus !== 'all'
                    ? 'Tidak ada data presensi yang cocok dengan filter atau kata kunci pencarian Anda.'
                    : 'Belum ada riwayat absensi yang tercatat untuk akun siswa ini.'
                }
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Mata Pelajaran & Kelas</th>
                  <th className="py-4 px-6">Tanggal Presensi</th>
                  <th className="py-4 px-6">Waktu Masuk</th>
                  <th className="py-4 px-6">Metode Presensi</th>
                  <th className="py-4 px-6 text-right">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredHistory.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-4.5 px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {item.className ? item.className.charAt(0) : 'K'}
                        </div>
                        <span>{item.className || 'Kelas X IPA 1'}</span>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-slate-600 text-xs font-medium">
                      {formatDate(item.checkedAt)}
                    </td>

                    <td className="py-4.5 px-6 text-slate-800 font-mono text-xs font-semibold">
                      {formatTime(item.checkedAt)} WIB
                    </td>

                    <td className="py-4.5 px-6 text-slate-500 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {item.source === 'qr_scan' ? 'Scan QR Kamera' : 'Verifikasi Guru'}
                      </span>
                    </td>

                    <td className="py-4.5 px-6 text-right">
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
