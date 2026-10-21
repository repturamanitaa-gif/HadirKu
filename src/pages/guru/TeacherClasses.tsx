import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  Users,
  Search,
  ChevronRight,
  Calendar,
  X,
  Mail,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { getStoredClasses } from '../../utils/initialData';
import type { ClassData, ClassMember } from '../../types';

export default function TeacherClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected class for viewing member list
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

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
        if (isMounted) setClasses(list);
      } catch {
        if (isMounted) setClasses(getStoredClasses());
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchClasses();
    return () => { isMounted = false; };
  }, [user]);

  const handleOpenMembers = async (cls: ClassData) => {
    setSelectedClass(cls);
    setLoadingMembers(true);
    setMemberSearch('');

    try {
      const membersSnap = await getDocs(
        query(collection(db, 'classes', cls.classId, 'members'), where('active', '==', true))
      );

      const memberPromises = membersSnap.docs.map(async (docSnap) => {
        const mData = docSnap.data();
        let studentName = 'Siswa';
        let studentEmail = '';

        try {
          const userDoc = await getDoc(doc(db, 'users', docSnap.id));
          if (userDoc.exists()) {
            const uData = userDoc.data();
            studentName = uData.name || 'Siswa';
            studentEmail = uData.email || '';
          }
        } catch (e) {
          console.error('Error fetching member user profile:', e);
        }

        return {
          studentId: docSnap.id,
          studentName,
          studentEmail,
          joinedAt: mData.joinedAt?.toDate() || new Date(),
          active: mData.active ?? true,
        };
      });

      const memberList = await Promise.all(memberPromises);
      setMembers(memberList);
    } catch (err) {
      console.error('Error fetching class members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.academicYear.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMembers = members.filter((m) =>
    (m.studentName || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.studentEmail || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kelas Pengampuan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar kelas yang Anda ampu dan direktori siswa terdaftar
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kelas atau tahun ajaran..."
            className="form-input w-full pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel p-5 h-44 animate-pulse bg-slate-50/50" />
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="panel p-12 text-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 text-base">Tidak ada kelas ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Anda belum ditugaskan mengampu kelas apapun saat ini.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredClasses.map((cls) => (
            <div
              key={cls.classId}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen size={20} />
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    T.A. {cls.academicYear}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
                  {cls.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#94A3B8" />
                  <span>Wali Kelas: {cls.homeroomTeacher || 'Belum Ditentukan'}</span>
                </p>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#ECFDF5',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={13} color="#059669" />
                  Kelas Aktif
                </span>
                <button
                  onClick={() => handleOpenMembers(cls)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Users size={14} color="#2563EB" />
                  <span>Lihat Anggota</span>
                  <ChevronRight size={14} color="#94A3B8" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members Modal */}
      <Modal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        title={`Direktori Anggota — ${selectedClass?.name || ''}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Cari nama atau email siswa..."
                className="form-input w-full pl-9 text-xs"
              />
            </div>
            {memberSearch && (
              <button
                onClick={() => setMemberSearch('')}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
            <span>Daftar Siswa Terdaftar</span>
            <span className="font-medium text-slate-700 tabular-nums">Total {filteredMembers.length} Siswa</span>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-0.5">
            {loadingMembers ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Memuat daftar siswa...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada siswa yang sesuai kriteria pencarian.
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.studentId}
                  className="flex items-center justify-between p-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs">
                      {member.studentName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{member.studentName}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {member.studentEmail || '-'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                    Terdaftar
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
