import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getStoredClasses, getStoredSessions } from '../../utils/initialData';
import {
  QrCode,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Eye,
  Edit2,
  Calendar,
  Loader2,
  Search,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  formatDate,
  formatTime,
  formatDateTime,
  generateToken,
  hashToken,
} from '../../utils/helpers';
import type {
  ClassData,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
} from '../../types';

export default function TeacherSessions() {
  const { user, profile } = useAuth();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Session Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState(15);

  // Active / QR Modal
  const [activeSessionView, setActiveSessionView] = useState<AttendanceSession | null>(null);
  const [currentPlainToken, setCurrentPlainToken] = useState<string>('');
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);

  // Manual Edit Attendance Modal
  const [editAttendee, setEditAttendee] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('hadir');
  const [editReason, setEditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch teacher classes and sessions
  useEffect(() => {
    let isMounted = true;

    // Immediately seed with initial data so UI is never blank
    const initialClasses = getStoredClasses();
    const initialSessions = getStoredSessions();
    setClasses(initialClasses);
    if (initialClasses.length > 0) setSelectedClassId(initialClasses[0].classId);
    setSessions(initialSessions);
    setLoading(false);

    // Then attempt background sync with Firestore if user is present
    if (user && !user.uid.startsWith('demo-')) {
      const fetchData = async () => {
        try {
          const classesQ = query(
            collection(db, 'classes'),
            where('teacherIds', 'array-contains', user.uid),
            where('active', '==', true)
          );
          const classesSnap = await getDocs(classesQ);
          if (classesSnap.docs.length > 0 && isMounted) {
            const classList: ClassData[] = classesSnap.docs.map((d) => ({
              classId: d.id,
              ...d.data(),
            })) as ClassData[];
            setClasses(classList);
          }

          const sessionsQ = query(
            collection(db, 'sessions'),
            where('createdBy', '==', user.uid),
            orderBy('startsAt', 'desc')
          );
          const sessionsSnap = await getDocs(sessionsQ);
          if (sessionsSnap.docs.length > 0 && isMounted) {
            const sessionList: AttendanceSession[] = sessionsSnap.docs.map((d) => {
              const data = d.data();
              return {
                sessionId: d.id,
                classId: data.classId,
                className: data.className || 'Kelas',
                createdBy: data.createdBy,
                startsAt: data.startsAt?.toDate() || new Date(),
                endsAt: data.endsAt?.toDate() || new Date(),
                lateThreshold: data.lateThreshold,
                status: data.status || 'closed',
                tokenHash: data.tokenHash,
              };
            });
            setSessions(sessionList);
          }
        } catch (e) {
          console.warn('Background sync note:', e);
        }
      };
      fetchData();
    }

    return () => { isMounted = false; };
  }, [user]);

  // 2. Real-time attendee listener when viewing a session
  useEffect(() => {
    if (!activeSessionView) {
      setAttendances([]);
      return;
    }

    setLoadingAttendees(true);
    const attColl = collection(db, 'sessions', activeSessionView.sessionId, 'attendance');
    const unsubscribe = onSnapshot(attColl, async (snap) => {
      const records: AttendanceRecord[] = [];

      for (const d of snap.docs) {
        const data = d.data();
        let studentName = data.studentName;

        if (!studentName) {
          try {
            const userSnap = await getDoc(doc(db, 'users', d.id));
            if (userSnap.exists()) {
              studentName = userSnap.data().name;
            }
          } catch (e) {
            console.error('Error fetching student name:', e);
          }
        }

        records.push({
          studentId: d.id,
          studentName: studentName || 'Siswa',
          status: data.status || 'hadir',
          checkedAt: data.checkedAt?.toDate() || new Date(),
          source: data.source || 'qr_scan',
          updatedAt: data.updatedAt?.toDate(),
        });
      }

      setAttendances(records);
      setLoadingAttendees(false);
    });

    return () => unsubscribe();
  }, [activeSessionView]);

  // Handle Create Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClassId) return;

    setSubmitting(true);
    try {
      const plainToken = generateToken(32);
      const tokenHash = await hashToken(plainToken);

      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000);

      const docRef = await addDoc(collection(db, 'sessions'), {
        classId: selectedClassId,
        createdBy: user.uid,
        startsAt,
        endsAt,
        lateThreshold: lateThresholdMinutes,
        status: 'active',
        tokenHash,
        createdAt: serverTimestamp(),
      });

      const targetClass = classes.find((c) => c.classId === selectedClassId);
      const newSession: AttendanceSession = {
        sessionId: docRef.id,
        classId: selectedClassId,
        className: targetClass?.name || 'Kelas',
        createdBy: user.uid,
        startsAt,
        endsAt,
        lateThreshold: lateThresholdMinutes,
        status: 'active',
        tokenHash,
      };

      setSessions([newSession, ...sessions]);
      setCreateModalOpen(false);

      // Immediately open active view with QR
      setCurrentPlainToken(plainToken);
      setActiveSessionView(newSession);
    } catch (err) {
      console.error('Error creating session:', err);
      alert('Gagal membuat sesi absensi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Close Session
  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menutup sesi absensi ini? Siswa tidak akan bisa scan lagi.')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'closed',
      });

      setSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, status: 'closed' } : s))
      );

      if (activeSessionView?.sessionId === sessionId) {
        setActiveSessionView((prev) => (prev ? { ...prev, status: 'closed' } : null));
      }
    } catch (err) {
      console.error('Error closing session:', err);
      alert('Gagal menutup sesi.');
    }
  };

  // Regenerate Token (anti-fraud/cheating feature)
  const handleRefreshToken = async () => {
    if (!activeSessionView) return;
    setRefreshingToken(true);

    try {
      const newPlain = generateToken(32);
      const newHash = await hashToken(newPlain);

      await updateDoc(doc(db, 'sessions', activeSessionView.sessionId), {
        tokenHash: newHash,
      });

      setCurrentPlainToken(newPlain);
      setActiveSessionView({ ...activeSessionView, tokenHash: newHash });
    } catch (err) {
      console.error('Error refreshing token:', err);
      alert('Gagal memperbarui token QR.');
    } finally {
      setRefreshingToken(false);
    }
  };

  // Open QR View for existing active session
  const handleOpenQR = (session: AttendanceSession) => {
    if (!currentPlainToken) {
      // If we don't have plaintext token in memory, regenerate a fresh one
      const token = generateToken(32);
      hashToken(token).then((h) => {
        updateDoc(doc(db, 'sessions', session.sessionId), { tokenHash: h });
        setCurrentPlainToken(token);
      });
    }
    setActiveSessionView(session);
  };

  // Manual Attendance Edit with Audit Log (FR-13)
  const handleSaveEditAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionView || !editAttendee || !user) return;

    if (!editReason.trim()) {
      alert('Alasan perubahan wajib diisi untuk pencatatan audit log.');
      return;
    }

    setSavingEdit(true);
    try {
      // 1. Update attendance record
      const attDocRef = doc(
        db,
        'sessions',
        activeSessionView.sessionId,
        'attendance',
        editAttendee.studentId
      );
      await updateDoc(attDocRef, {
        status: editStatus,
        source: 'manual',
        updatedAt: serverTimestamp(),
      });

      // 2. Record to auditLogs
      await addDoc(collection(db, 'auditLogs'), {
        actorUid: user.uid,
        actorName: profile?.name || 'Guru',
        action: 'update_attendance',
        targetId: `${activeSessionView.sessionId}/${editAttendee.studentId}`,
        targetStudentName: editAttendee.studentName,
        previousStatus: editAttendee.status,
        newStatus: editStatus,
        reason: editReason.trim(),
        createdAt: serverTimestamp(),
      });

      setEditAttendee(null);
      setEditReason('');
    } catch (err) {
      console.error('Error updating attendance manually:', err);
      alert('Gagal memperbarui status absensi.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Generate QR payload JSON
  const qrPayload = activeSessionView && currentPlainToken
    ? JSON.stringify({
        sessionId: activeSessionView.sessionId,
        token: currentPlainToken,
        classId: activeSessionView.classId,
        expiresAt: activeSessionView.endsAt.getTime(),
      })
    : '';

  const filteredSessions = sessions.filter(
    (s) =>
      s.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(s.startsAt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sesi Presensi Guru</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat sesi absensi QR code, pantau kehadiran langsung, dan koreksi status kehadiran siswa.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Sesi Baru</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between panel p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kelas atau tanggal sesi..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Total {sessions.length} Sesi Terdaftar
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Memuat data sesi...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="panel p-12 text-center">
          <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-800 text-sm">Belum Ada Sesi Presensi</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Klik tombol "Buat Sesi Baru" untuk memulai sesi absensi QR Code di kelas Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.sessionId}
              style={{
                backgroundColor: session.status === 'active' ? '#F8FAFF' : '#FFFFFF',
                borderRadius: '16px',
                border: session.status === 'active' ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                padding: '20px 24px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-lg flex-shrink-0 ${
                    session.status === 'active'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">{session.className}</h3>
                    <StatusBadge status={session.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(session.startsAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTime(session.startsAt)} — {formatTime(session.endsAt)}
                    </span>
                    {session.lateThreshold && (
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium text-[11px]">
                        Toleransi telat: +{session.lateThreshold} mnt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {session.status === 'active' ? (
                  <>
                    <button
                      onClick={() => handleOpenQR(session)}
                      className="btn btn-primary text-xs h-8 px-3"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Tampilkan QR & Live</span>
                    </button>
                    <button
                      onClick={() => handleCloseSession(session.sessionId)}
                      className="btn btn-danger text-xs h-8 px-3"
                      title="Tutup Sesi Sekarang"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tutup</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveSessionView(session)}
                    className="btn btn-secondary text-xs h-8 px-3"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lihat Rekap Kehadiran</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Buat Sesi Presensi Baru"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Kelas
            </label>
            {classes.length === 0 ? (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                Anda belum memiliki kelas yang diampu.
              </p>
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                required
                className="form-input"
              >
                {classes.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.name} ({cls.academicYear})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Durasi Sesi
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="form-input"
              >
                <option value={30}>30 Menit</option>
                <option value={45}>45 Menit</option>
                <option value={60}>1 Jam</option>
                <option value={90}>1.5 Jam</option>
                <option value={120}>2 Jam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Toleransi Telat
              </label>
              <select
                value={lateThresholdMinutes}
                onChange={(e) => setLateThresholdMinutes(Number(e.target.value))}
                className="form-input"
              >
                <option value={5}>5 Menit</option>
                <option value={10}>10 Menit</option>
                <option value={15}>15 Menit</option>
                <option value={20}>20 Menit</option>
                <option value={30}>30 Menit</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            Sistem akan menghasilkan QR code yang terikat dengan token unik dan masa berlaku sesi. Token divalidasi server untuk mencegah manipulasi.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-secondary text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || classes.length === 0}
              className="btn btn-primary text-xs"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Membuat...' : 'Mulai Sesi Sekarang'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ACTIVE QR & LIVE ATTENDANCE MODAL */}
      <Modal
        isOpen={!!activeSessionView}
        onClose={() => setActiveSessionView(null)}
        title={`Sesi Presensi — ${activeSessionView?.className || ''}`}
        size="lg"
      >
        {activeSessionView && (
          <div className="space-y-5">
            {activeSessionView.status === 'active' ? (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Sesi Aktif — Siswa Dapat Memindai QR</span>
                </div>

                {/* QR Canvas */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs inline-block mb-3">
                  {qrPayload ? (
                    <QRCodeSVG
                      value={qrPayload}
                      size={220}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                      Memuat QR...
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleRefreshToken}
                    disabled={refreshingToken}
                    className="btn btn-secondary text-xs h-8 px-3"
                    title="Perbarui token QR untuk mencegah kecurangan foto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshingToken ? 'animate-spin' : ''}`} />
                    <span>Perbarui Token Anti-Titip</span>
                  </button>

                  <button
                    onClick={() => handleCloseSession(activeSessionView.sessionId)}
                    className="btn btn-danger text-xs h-8 px-3"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tutup Sesi Presensi</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs text-center">
                Sesi absensi ini telah ditutup pada {formatDateTime(activeSessionView.endsAt)}.
              </div>
            )}

            {/* Attendance Live List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#2563EB]" />
                  Daftar Siswa Yang Sudah Absen ({attendances.length})
                </h3>
                {loadingAttendees && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-[#2563EB]" /> Memperbarui data...
                  </span>
                )}
              </div>

              {attendances.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
                  Belum ada siswa yang melakukan absensi pada sesi ini.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {attendances.map((rec) => (
                    <div
                      key={rec.studentId}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8EDFF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                          {rec.studentName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{rec.studentName}</p>
                          <p className="text-[11px] text-slate-400">
                            Waktu: {formatTime(rec.checkedAt)} • Via {rec.source === 'qr_scan' ? 'Scan QR' : 'Koreksi Manual'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={rec.status} />
                        <button
                          onClick={() => {
                            setEditAttendee(rec);
                            setEditStatus(rec.status);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-[#E8EDFF]/40 transition-colors"
                          title="Ubah Status Manual (Audit Log)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MANUAL EDIT ATTENDANCE MODAL (FR-13 AUDIT LOG) */}
      <Modal
        isOpen={!!editAttendee}
        onClose={() => setEditAttendee(null)}
        title="Ubah Status Absensi Siswa"
      >
        {editAttendee && (
          <form onSubmit={handleSaveEditAttendee} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400">Nama Siswa</p>
              <p className="text-sm font-bold text-slate-800">{editAttendee.studentName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status Baru
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                className="form-input"
              >
                <option value="hadir">Hadir</option>
                <option value="terlambat">Terlambat</option>
                <option value="tidak_hadir">Tidak Hadir (Alpha / Izin / Sakit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Perubahan (Wajib untuk Audit Log)
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Contoh: Siswa sakit surat menyusul / izin dispensasi lomba..."
                rows={3}
                required
                className="form-input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditAttendee(null)}
                className="btn btn-secondary text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn btn-primary text-xs"
              >
                {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{savingEdit ? 'Menyimpan...' : 'Simpan Koreksi'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
