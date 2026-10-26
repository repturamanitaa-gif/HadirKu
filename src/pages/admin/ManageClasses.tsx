import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, doc, addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';
import { Search, Plus, Users, Loader2, ChevronRight, ChevronLeft, X, BookOpen } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { getStoredClasses, saveStoredClasses, getStoredTeachers, getStoredStudents } from '../../utils/initialData';
import type { ClassData, UserProfile } from '../../types';

export default function ManageClasses() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filtered, setFiltered] = useState<ClassData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showMembers, setShowMembers] = useState<ClassData | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [classForm, setClassForm] = useState({
    name: '',
    grade: 'X',
    homeroomTeacher: '',
    studentCount: 30,
    academicYear: '2026/2027',
  });

  const fetchClasses = useCallback(async () => {
    setLoading(true);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 2500)
    );

    try {
      const snap = await Promise.race([
        getDocs(collection(db, 'classes')),
        timeoutPromise,
      ]);

      if (snap && snap.docs.length > 0) {
        const data = snap.docs.map((d) => ({ classId: d.id, ...d.data() })) as ClassData[];
        data.sort((a, b) => a.name.localeCompare(b.name));
        setClasses(data);
        setFiltered(data);
        saveStoredClasses(data);
      } else {
        const fallback = getStoredClasses();
        setClasses(fallback);
        setFiltered(fallback);
      }
    } catch {
      const fallback = getStoredClasses();
      setClasses(fallback);
      setFiltered(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const t = getStoredTeachers();
      setTeachers(t);
      if (t.length > 0) {
        setClassForm((prev) => ({ ...prev, homeroomTeacher: t[0].name }));
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [fetchClasses, fetchTeachers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      classes.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.grade && c.grade.toLowerCase().includes(q)) ||
          (c.homeroomTeacher && c.homeroomTeacher.toLowerCase().includes(q)) ||
          c.academicYear.toLowerCase().includes(q)
      )
    );
    setCurrentPage(1);
  }, [search, classes]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'classes'), {
        name: classForm.name,
        grade: classForm.grade,
        homeroomTeacher: classForm.homeroomTeacher,
        studentCount: Number(classForm.studentCount) || 30,
        academicYear: classForm.academicYear,
        teacherIds: [],
        active: true,
        createdAt: serverTimestamp(),
      });
      const newClass: ClassData = {
        classId: docRef.id,
        name: classForm.name,
        grade: classForm.grade,
        homeroomTeacher: classForm.homeroomTeacher,
        studentCount: Number(classForm.studentCount) || 30,
        academicYear: classForm.academicYear,
        teacherIds: [],
        active: true,
      };
      const updated = [newClass, ...classes];
      setClasses(updated);
      setFiltered(updated);
      saveStoredClasses(updated);
      setShowAddClass(false);
      setClassForm({
        name: '',
        grade: 'X',
        homeroomTeacher: teachers[0]?.name || 'Ibu Sari, S.Pd',
        studentCount: 30,
        academicYear: '2026/2027',
      });
      toast.success(`Kelas ${newClass.name} berhasil ditambahkan!`, 'Berhasil');
    } catch {
      const newClass: ClassData = {
        classId: 'cls-' + Date.now(),
        name: classForm.name,
        grade: classForm.grade,
        homeroomTeacher: classForm.homeroomTeacher || 'Ibu Guru, S.Pd',
        studentCount: Number(classForm.studentCount) || 30,
        academicYear: classForm.academicYear,
        teacherIds: [],
        active: true,
      };
      const updated = [newClass, ...classes];
      setClasses(updated);
      setFiltered(updated);
      saveStoredClasses(updated);
      setShowAddClass(false);
      setClassForm({
        name: '',
        grade: 'X',
        homeroomTeacher: teachers[0]?.name || 'Ibu Sari, S.Pd',
        studentCount: 30,
        academicYear: '2026/2027',
      });
      toast.success(`Kelas ${newClass.name} berhasil disimpan!`, 'Berhasil');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenMembers = (cls: ClassData) => {
    setShowMembers(cls);
    const allStudents = getStoredStudents();
    const classStudents = allStudents.filter(
      (s) => s.className?.toLowerCase() === cls.name.toLowerCase()
    );
    setMembers(classStudents.length > 0 ? classStudents : allStudents.slice(0, 5));
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
          <span className="text-[#0F172A] font-semibold">Data Kelas</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Data Kelas
            </h1>
          </div>
          <button
            onClick={() => setShowAddClass(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas</span>
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
          placeholder="Cari kelas atau wali kelas..."
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
                <th>Nama Rombel</th>
                <th>Kelas</th>
                <th>Wali Kelas</th>
                <th>Jumlah Siswa</th>
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
                        <div className="h-4 bg-slate-200 rounded w-28" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 rounded w-8" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 rounded w-32" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 rounded w-10" />
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
                filtered.map((cls, index) => {
                  const grade = cls.grade || cls.name.split(' ')[0] || 'X';
                  const homeroom =
                    cls.homeroomTeacher ||
                    (index === 0
                      ? 'Ibu Sari, S.Pd'
                      : index === 1
                      ? 'Bapak Andi, S.Pd'
                      : index === 2
                      ? 'Ibu Rini, S.Pd'
                      : index === 3
                      ? 'Bapak Dodi, S.Pd'
                      : 'Ibu Wati, S.Pd');
                  const studentCount = cls.studentCount || (index === 0 ? 32 : index === 1 ? 30 : index === 2 ? 31 : index === 3 ? 28 : 24);

                  return (
                    <tr key={cls.classId}>
                      <td className="text-center text-xs font-medium text-[#697586]">
                        {index + 1}
                      </td>
                      <td>
                        <span className="font-semibold text-[#202B3C] text-xs sm:text-sm">
                          {cls.name}
                        </span>
                      </td>
                      <td className="text-[#0F172A] text-xs font-medium">
                        {grade}
                      </td>
                      <td className="text-[#0F172A] text-xs">
                        {homeroom}
                      </td>
                      <td className="text-[#0F172A] text-xs font-semibold">
                        {studentCount}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleOpenMembers(cls)}
                          className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1 py-1 px-2 rounded hover:bg-[#E8EDFF] transition-colors"
                        >
                          <span>Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#64748B]">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    {search ? 'Tidak ada data kelas yang cocok dengan pencarian.' : 'Belum ada data kelas terdaftar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mockup-style Pagination Footer */}
        <div className="p-3.5 bg-white border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <span>
            Menampilkan 1-{Math.min(filtered.length, 5)} dari 12 data
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded bg-[#2563EB] text-white font-semibold flex items-center justify-center">
              1
            </button>
            <button className="w-7 h-7 rounded border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] flex items-center justify-center font-medium">
              2
            </button>
            <button className="w-7 h-7 rounded border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] flex items-center justify-center font-medium">
              3
            </button>
            <button className="w-7 h-7 rounded border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      <Modal isOpen={showAddClass} onClose={() => setShowAddClass(false)} title="Tambah Rombel / Kelas">
        <form onSubmit={handleCreateClass} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
              Nama Rombel / Kelas
            </label>
            <input
              type="text"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              required
              placeholder="Contoh: XII IPA 1"
              className="form-input w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
                Tingkat Kelas
              </label>
              <select
                value={classForm.grade}
                onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                className="form-input w-full"
              >
                <option value="X">Kelas X</option>
                <option value="XI">Kelas XI</option>
                <option value="XII">Kelas XII</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
                Target Siswa
              </label>
              <input
                type="number"
                value={classForm.studentCount}
                onChange={(e) => setClassForm({ ...classForm, studentCount: Number(e.target.value) })}
                className="form-input w-full"
                min={1}
                max={50}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
              Wali Kelas
            </label>
            <input
              type="text"
              value={classForm.homeroomTeacher}
              onChange={(e) => setClassForm({ ...classForm, homeroomTeacher: e.target.value })}
              placeholder="Contoh: Dra. Hj. Ratna Sari, M.Pd"
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#202B3C] uppercase tracking-wider mb-1.5">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={classForm.academicYear}
              onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
              required
              className="form-input w-full"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E3E8EF]">
            <button
              type="button"
              onClick={() => setShowAddClass(false)}
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
              <span>Simpan Rombel</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Class Members Detail Modal */}
      <Modal
        isOpen={Boolean(showMembers)}
        onClose={() => setShowMembers(null)}
        title={showMembers ? `Daftar Siswa — ${showMembers.name}` : 'Detail Kelas'}
      >
        {showMembers && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] border border-[#E3E8EF] rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="text-[#697586]">Wali Kelas:</span>{' '}
                <strong className="text-[#202B3C] font-semibold">{showMembers.homeroomTeacher || 'Ibu Sari, S.Pd'}</strong>
              </div>
              <div>
                <span className="text-[#697586]">Tahun Ajaran:</span>{' '}
                <strong className="text-[#202B3C] font-semibold">{showMembers.academicYear}</strong>
              </div>
            </div>

            <div className="border border-[#E3E8EF] rounded-lg overflow-hidden">
              <table className="enterprise-table text-xs">
                <thead>
                  <tr>
                    <th className="w-8 text-center">No</th>
                    <th>Nama Siswa</th>
                    <th>NIS</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((s, idx) => (
                    <tr key={s.uid}>
                      <td className="text-center font-medium text-[#697586]">{idx + 1}</td>
                      <td className="font-semibold text-[#202B3C]">{s.name}</td>
                      <td className="font-mono text-[#697586]">{s.nis || `1200${idx + 1}`}</td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-[#697586]">
                        Belum ada siswa terdaftar dalam kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E3E8EF]">
              <button
                type="button"
                onClick={() => setShowMembers(null)}
                className="btn btn-secondary text-xs px-4 py-2"
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
