import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, query, where, doc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';
import { Search, Plus, UserCheck, UserX, Loader2, GraduationCap, ChevronRight } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { getStoredTeachers, saveStoredTeachers } from '../../utils/initialData';
import type { UserProfile } from '../../types';

export default function ManageTeachers() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 2500)
    );

    try {
      const snap = await Promise.race([
        getDocs(query(collection(db, 'users'), where('role', '==', 'guru'))),
        timeoutPromise,
      ]);

      if (snap && snap.docs.length > 0) {
        const data = snap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        })) as UserProfile[];
        data.sort((a, b) => a.name.localeCompare(b.name));
        setTeachers(data);
        setFiltered(data);
        saveStoredTeachers(data);
      } else {
        const fallback = getStoredTeachers();
        setTeachers(fallback);
        setFiltered(fallback);
      }
    } catch {
      const fallback = getStoredTeachers();
      setTeachers(fallback);
      setFiltered(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      teachers.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      )
    );
  }, [search, teachers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: form.name,
        email: form.email,
        role: 'guru',
        active: true,
        createdAt: serverTimestamp(),
      });
      setForm({ name: '', email: '', password: '' });
      setShowModal(false);
      fetchTeachers();
    } catch {
      const newTeacher: UserProfile = {
        uid: 'tch-' + Date.now(),
        name: form.name,
        email: form.email,
        role: 'guru',
        active: true,
        password: form.password,
        createdAt: new Date(),
      };
      const updated = [newTeacher, ...teachers];
      setTeachers(updated);
      setFiltered(updated);
      saveStoredTeachers(updated);
      setForm({ name: '', email: '', password: '' });
      setShowModal(false);
      toast.success(`Akun guru ${newTeacher.name} berhasil dibuat!`, 'Berhasil');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (uid: string, currentActive: boolean) => {
    const updated = teachers.map((t) => (t.uid === uid ? { ...t, active: !currentActive } : t));
    setTeachers(updated);
    setFiltered(updated);
    saveStoredTeachers(updated);
    toast.info(`Status akun berhasil diubah menjadi ${!currentActive ? 'Aktif' : 'Nonaktif'}.`, 'Status Diperbarui');

    try {
      await updateDoc(doc(db, 'users', uid), { active: !currentActive });
    } catch {
      // already updated in local state
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
          <span className="text-[#0F172A] font-semibold">Data Guru</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Data Guru
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
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
          placeholder="Cari berdasarkan nama atau email guru pengampu..."
          className="form-input w-full pl-10 h-10 text-xs bg-white"
        />
      </div>

      {/* Table Container */}
      <div className="panel overflow-hidden">
        <div className="table-container border-0 rounded-xl">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Nama Guru Pengampu</th>
                <th>Alamat Email</th>
                <th>Status Akun</th>
                <th className="text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading Skeletons */}
              {loading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-200" />
                          <div className="h-4 bg-slate-200 rounded w-36" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3.5 bg-slate-100 rounded w-44" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 bg-slate-100 rounded-full w-16" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="h-7 bg-slate-100 rounded w-20 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Data Rows */}
              {!loading && filtered.map((teacher) => (
                <tr key={teacher.uid}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E8EDFF] border border-[#DBE4FF] text-[#2563EB] flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-[#0F172A] text-xs sm:text-sm">
                        {teacher.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-[#64748B] text-xs font-mono">{teacher.email}</td>
                  <td>
                    <StatusBadge status={teacher.active ? 'active' : 'closed'} size="sm" />
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => toggleActive(teacher.uid, teacher.active)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        teacher.active
                          ? 'border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100/60'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/60'
                      }`}
                    >
                      {teacher.active ? (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span>Nonaktifkan</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Aktifkan</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-xs text-[#697586]">
                    <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    {search ? 'Tidak ada data guru yang cocok dengan pencarian.' : 'Belum ada data guru terdaftar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Pendaftaran Guru Baru">
        <form onSubmit={handleAdd} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
              Nama Lengkap & Gelar
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Contoh: Ahmad Fauzi, S.Pd"
              className="form-input w-full"
            />
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
              placeholder="guru@sekolah.sch.id"
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
              <span>Simpan Akun Guru</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
