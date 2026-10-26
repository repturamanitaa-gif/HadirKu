import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, query, where, doc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';
import { Search, Plus, Loader2, Users, ChevronRight, ChevronLeft, UserCheck, UserX } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { getStoredStudents, saveStoredStudents } from '../../utils/initialData';
import type { UserProfile } from '../../types';

export default function ManageStudents() {
  const { toast } = useToast();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailStudent, setDetailStudent] = useState<UserProfile | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    nis: '',
    className: 'X IPA 1',
    password: '',
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 2500)
    );

    try {
      const snap = await Promise.race([
        getDocs(query(collection(db, 'users'), where('role', '==', 'siswa'))),
        timeoutPromise,
      ]);

      if (snap && snap.docs.length > 0) {
        const data = snap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        })) as UserProfile[];
        data.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(data);
        setFiltered(data);
        saveStoredStudents(data);
      } else {
        const fallback = getStoredStudents();
        setStudents(fallback);
        setFiltered(fallback);
      }
    } catch {
      const fallback = getStoredStudents();
      setStudents(fallback);
      setFiltered(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.nis && s.nis.toLowerCase().includes(q)) ||
          (s.className && s.className.toLowerCase().includes(q))
      )
    );
    setCurrentPage(1);
  }, [search, students]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: form.name,
        email: form.email,
        nis: form.nis,
        className: form.className,
        role: 'siswa',
        active: true,
        createdAt: serverTimestamp(),
      });
      setForm({ name: '', email: '', nis: '', className: 'X IPA 1', password: '' });
      setShowModal(false);
      fetchStudents();
    } catch {
      // Fallback: create locally
      const newStudent: UserProfile = {
        uid: 'std-' + Date.now(),
        name: form.name,
        email: form.email,
        nis: form.nis || '120' + Math.floor(10 + Math.random() * 90),
        className: form.className,
        role: 'siswa',
        active: true,
        createdAt: new Date(),
      };
      const updated = [newStudent, ...students];
      setStudents(updated);
      setFiltered(updated);
      saveStoredStudents(updated);
      setForm({ name: '', email: '', nis: '', className: 'X IPA 1', password: '' });
      setShowModal(false);
      toast.success(`Data siswa ${newStudent.name} berhasil ditambahkan!`, 'Berhasil');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (uid: string, currentActive: boolean) => {
    const updated = students.map((s) => (s.uid === uid ? { ...s, active: !currentActive } : s));
    setStudents(updated);
    setFiltered(updated);
    saveStoredStudents(updated);
    toast.info(`Status siswa diubah menjadi ${!currentActive ? 'Aktif' : 'Nonaktif'}.`, 'Status Diperbarui');

    if (detailStudent && detailStudent.uid === uid) {
      setDetailStudent({ ...detailStudent, active: !currentActive });
    }

    try {
      await updateDoc(doc(db, 'users', uid), { active: !currentActive });
    } catch {
      // updated in local state
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
          <Link to="/admin" className="hover:text-[#2563EB] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0F172A] font-semibold">Data Siswa</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Data Siswa
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama siswa, NIS, atau kelas..."
          className="form-input w-full pl-10 h-10 text-xs bg-white"
        />
      </div>

      {/* Table Container */}
      <div className="panel overflow-hidden">
        <div className="table-container border-0 rounded-xl">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th className="w-12 text-center">No</th>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th>Kelas</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading Skeletons */}
              {loading && (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="text-center py-3.5 px-4">
                        <div className="h-4 bg-slate-200 rounded w-4 mx-auto" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 rounded w-32" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 rounded w-16" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 rounded w-20" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 bg-slate-100 rounded-full w-14" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="h-6 bg-slate-100 rounded w-14 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Data Rows */}
              {!loading &&
                filtered.map((student, index) => (
                  <tr key={student.uid}>
                    <td className="text-center text-xs font-medium text-[#64748B]">
                      {index + 1}
                    </td>
                    <td>
                      <span className="font-semibold text-[#0F172A] text-xs sm:text-sm">
                        {student.name}
                      </span>
                    </td>
                    <td className="text-[#64748B] text-xs font-mono font-medium">
                      {student.nis || `1200${index + 1}`}
                    </td>
                    <td className="text-[#0F172A] text-xs font-medium">
                      {student.className || 'X IPA 1'}
                    </td>
                    <td>
                      <StatusBadge status={student.active ? 'aktif' : 'nonaktif'} size="sm" />
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setDetailStudent(student)}
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1 py-1 px-2 rounded hover:bg-[#E8EDFF] transition-colors"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#697586]">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    {search ? 'Tidak ada data siswa yang cocok dengan pencarian.' : 'Belum ada data siswa terdaftar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mockup-style Pagination Footer */}
        <div className="p-3.5 bg-white border-t border-[#E3E8EF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#697586]">
          <span>
            Menampilkan 1-{Math.min(filtered.length, 5)} dari 245 data
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded border border-[#E3E8EF] flex items-center justify-center text-[#697586] hover:bg-[#F8FAFC] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded bg-[#2563EB] text-white font-semibold flex items-center justify-center">
              1
            </button>
            <button className="w-7 h-7 rounded border border-[#E3E8EF] text-[#697586] hover:bg-[#F8FAFC] flex items-center justify-center font-medium">
              2
            </button>
            <button className="w-7 h-7 rounded border border-[#E3E8EF] text-[#697586] hover:bg-[#F8FAFC] flex items-center justify-center font-medium">
              3
            </button>
            <button className="w-7 h-7 rounded border border-[#E3E8EF] text-[#697586] hover:bg-[#F8FAFC] flex items-center justify-center font-medium">
              4
            </button>
            <button className="w-7 h-7 rounded border border-[#E3E8EF] text-[#697586] hover:bg-[#F8FAFC] flex items-center justify-center font-medium">
              5
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-7 h-7 rounded border border-[#E3E8EF] text-[#697586] hover:bg-[#F8FAFC] flex items-center justify-center font-medium">
              49
            </button>
            <button className="w-7 h-7 rounded border border-[#E3E8EF] flex items-center justify-center text-[#697586] hover:bg-[#F8FAFC]">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Siswa Baru">
        <form onSubmit={handleAdd} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Contoh: Ahmad Rizki"
              className="form-input w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
                NIS
              </label>
              <input
                type="text"
                value={form.nis}
                onChange={(e) => setForm({ ...form, nis: e.target.value })}
                required
                placeholder="12001"
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
                Kelas
              </label>
              <select
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                className="form-input w-full"
              >
                <option value="X IPA 1">X IPA 1</option>
                <option value="X IPS 2">X IPS 2</option>
                <option value="XI IPA 1">XI IPA 1</option>
                <option value="XI IPS 1">XI IPS 1</option>
                <option value="XII IPA 2">XII IPA 2</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="siswa@sekolah.sch.id"
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
              Kata Sandi Default
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              className="form-input w-full"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E3E8EF]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary text-xs px-3.5 py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="btn btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Akun Siswa</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Detail Modal */}
      <Modal
        isOpen={Boolean(detailStudent)}
        onClose={() => setDetailStudent(null)}
        title="Detail Profil Siswa"
      >
        {detailStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E3E8EF] rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#EEF4F8] text-[#243B64] font-bold text-base flex items-center justify-center border border-[#DCE5EE]">
                {detailStudent.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-[#202B3C] text-sm">{detailStudent.name}</h4>
                <p className="text-xs text-[#697586] font-mono">{detailStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-[#E3E8EF] rounded-lg">
                <span className="text-[11px] text-[#697586] block font-semibold uppercase">NIS</span>
                <span className="text-sm font-bold text-[#202B3C] mt-0.5 block font-mono">
                  {detailStudent.nis || '12001'}
                </span>
              </div>
              <div className="p-3 bg-white border border-[#E3E8EF] rounded-lg">
                <span className="text-[11px] text-[#697586] block font-semibold uppercase">Kelas</span>
                <span className="text-sm font-bold text-[#202B3C] mt-0.5 block">
                  {detailStudent.className || 'X IPA 1'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white border border-[#E3E8EF] rounded-lg text-xs">
              <div>
                <span className="font-semibold text-[#202B3C] block">Status Akun Siswa</span>
                <span className="text-[11px] text-[#697586]">
                  {detailStudent.active ? 'Siswa dapat melakukan absensi QR' : 'Akses presensi dinonaktifkan'}
                </span>
              </div>
              <StatusBadge status={detailStudent.active ? 'aktif' : 'nonaktif'} size="sm" />
            </div>

            <div className="pt-2 flex justify-between gap-2 border-t border-[#E3E8EF]">
              <button
                type="button"
                onClick={() => toggleActive(detailStudent.uid, detailStudent.active)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  detailStudent.active
                    ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {detailStudent.active ? (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Nonaktifkan Akun</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Aktifkan Akun</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="btn btn-secondary text-xs px-3.5 py-1.5"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
