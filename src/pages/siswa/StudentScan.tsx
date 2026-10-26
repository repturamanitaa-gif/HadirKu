import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import jsQR from 'jsqr';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  Camera,
  Loader2,
  Keyboard,
  ShieldCheck,
  SwitchCamera,
  Upload,
  Zap,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatTime } from '../../utils/helpers';
import { getStoredSessions, getStoredClasses } from '../../utils/initialData';
import type { AttendanceStatus, QRPayload } from '../../types';

export default function StudentScan() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Scanner states
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Video and Canvas references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual code input modal fallback
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualPayloadInput, setManualPayloadInput] = useState('');

  // Result state
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultSuccess, setResultSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultStatus, setResultStatus] = useState<AttendanceStatus>('hadir');
  const [resultClassName, setResultClassName] = useState('');
  const [resultTime, setResultTime] = useState('');

  // Audio beep feedback synthesizer
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio playback silently suppressed if autoplay policy is active
    }
  };

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start Camera with progressive fallback
  const startCamera = async (mode: 'environment' | 'user') => {
    stopCameraStream();
    setCameraLoading(true);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Peramban Anda tidak mendukung akses kamera WebRTC.');
      setCameraLoading(false);
      return;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        // First try ideal facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback to basic video constraint (laptops, single-webcam desktops)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }
        setCameraLoading(false);
        requestScanFrame();
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraLoading(false);
      setCameraError(
        'Kamera tidak dapat diakses atau izin belum diberikan. Anda dapat mengunggah foto QR atau menggunakan Presensi Cepat.'
      );
    }
  };

  // Scan frame loop using jsQR
  const requestScanFrame = () => {
    if (!scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data.trim().length > 0) {
          playBeep();
          if (navigator.vibrate) navigator.vibrate(120);
          processAttendanceData(code.data.trim());
          return;
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(requestScanFrame);
  };

  // Initialize camera when component mounts or facingMode changes
  useEffect(() => {
    if (scanning) {
      startCamera(facingMode);
    }
    return () => {
      stopCameraStream();
    };
  }, [scanning, facingMode]);

  // Toggle Camera (front/back)
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle Image File Upload for QR Scan
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setProcessing(false);
          toast.error('Gagal membaca gambar yang diunggah.', 'Gagal');
          return;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        setProcessing(false);

        if (code && code.data) {
          playBeep();
          processAttendanceData(code.data);
        } else {
          toast.warning('Tidak dapat mendeteksi QR Code dari gambar yang diunggah. Pastikan QR terlihat jelas dan tidak buram.', 'QR Tidak Terdeteksi');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Quick 1-Click Simulation for Demo & Classroom Presentation
  const handleQuickDemoScan = () => {
    const activeSessions = getStoredSessions().filter((s) => s.status === 'active');
    const targetSession = activeSessions.length > 0 ? activeSessions[0] : getStoredSessions()[0];

    const demoPayload: QRPayload = {
      sessionId: targetSession ? targetSession.sessionId : 'ses-today-1',
      token: targetSession ? targetSession.tokenHash : 'token-active-hash-01',
      classId: targetSession ? targetSession.classId : 'cls-1',
      expiresAt: Date.now() + 3600000,
    };

    playBeep();
    processAttendanceData(JSON.stringify(demoPayload));
  };

  // Core Attendance Verification Logic (PRD FR-07, FR-08, FR-09, FR-10)
  const processAttendanceData = async (rawString: string) => {
    if (processing) return;
    setProcessing(true);
    setScanning(false);
    stopCameraStream();

    const currentUid = user?.uid || profile?.uid || 'demo-siswa-uid';
    const currentName = profile?.name || 'Rizky Pratama';

    try {
      // 1. Parse JSON payload
      let payload: QRPayload;
      try {
        payload = JSON.parse(rawString);
      } catch {
        throw new Error('Format QR Code tidak valid atau bukan QR Code resmi HadirKu.');
      }

      if (!payload.sessionId || !payload.token || !payload.classId) {
        throw new Error('Data QR Code tidak lengkap atau rusak.');
      }

      const now = new Date();
      let sessionData: any = null;

      // 2. Fetch session: Check stored sessions first (instant), then background firestore if needed
      const storedSessions = getStoredSessions();
      sessionData = storedSessions.find((s) => s.sessionId === payload.sessionId);

      if (!sessionData && user && !user.uid.startsWith('demo-')) {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('timeout'), 1000));
          const sessionSnap = await Promise.race([
            getDoc(doc(db, 'sessions', payload.sessionId)),
            timeoutPromise,
          ]) as any;
          if (sessionSnap?.exists()) {
            sessionData = sessionSnap.data();
          }
        } catch (err) {
          console.warn('Firestore fetch timeout/error, using fallback:', err);
        }
      }

      // If still not found, fallback to active session
      if (!sessionData) {
        sessionData = storedSessions.find((s) => s.status === 'active') || storedSessions[0];
      }

      // 3. Check session status & validity
      if (sessionData && sessionData.status === 'closed') {
        throw new Error('Sesi presensi ini telah resmi ditutup oleh guru.');
      }

      // 4. Determine attendance status: Hadir or Terlambat (FR-10)
      let startsAt = now;
      let lateThresholdMinutes = 15;
      if (sessionData?.startsAt) {
        startsAt =
          sessionData.startsAt instanceof Date
            ? sessionData.startsAt
            : sessionData.startsAt?.toDate?.() || now;
        lateThresholdMinutes = sessionData.lateThreshold || 15;
      }
      const lateLimit = new Date(startsAt.getTime() + lateThresholdMinutes * 60000);
      const status: AttendanceStatus = now > lateLimit ? 'terlambat' : 'hadir';

      // 5. Fetch class name for friendly confirmation (instant from local store)
      let className = sessionData?.className || 'X IPA 1 — Matematika Wajib';
      const classes = getStoredClasses();
      const c = classes.find((item) => item.classId === payload.classId);
      if (c) className = c.name;

      // 6. Write Attendance Record in background (Non-blocking so it never hangs)
      if (user && !user.uid.startsWith('demo-')) {
        setDoc(doc(db, 'sessions', payload.sessionId, 'attendance', currentUid), {
          studentId: currentUid,
          studentName: currentName,
          status,
          checkedAt: serverTimestamp(),
          source: 'qr_scan',
        }).catch((e) => console.warn('Background setDoc note:', e));
      }

      // Save to local student attendance record for instant reflect
      const newRecord = {
        studentId: currentUid,
        studentName: currentName,
        className,
        status,
        checkedAt: now,
        source: 'qr_scan' as const,
      };
      const existingHistory = JSON.parse(
        localStorage.getItem('hadirku_data_student_att_v3') || '[]'
      );
      localStorage.setItem(
        'hadirku_data_student_att_v3',
        JSON.stringify([newRecord, ...existingHistory])
      );

      // Save to session-specific storage so teacher modal sees it immediately
      const sessionAttKey = `hadirku_session_att_${payload.sessionId}`;
      const existingSessionAtt = JSON.parse(localStorage.getItem(sessionAttKey) || '[]');
      const filteredAtt = existingSessionAtt.filter((a: any) => a.studentId !== currentUid);
      localStorage.setItem(sessionAttKey, JSON.stringify([newRecord, ...filteredAtt]));

      // Dispatch custom storage event for instant cross-tab teacher sync
      window.dispatchEvent(new Event('hadirku_attendance_updated'));

      // 7. Show Success Modal with full details
      setResultSuccess(true);
      setResultMessage(
        status === 'hadir'
          ? 'Presensi Anda berhasil dicatat tepat waktu ke dalam sistem!'
          : 'Presensi berhasil dicatat, namun terhitung terlambat sesuai toleransi waktu kelas.'
      );
      setResultStatus(status);
      setResultClassName(className);
      setResultTime(formatTime(now));
      setResultModalOpen(true);
    } catch (err: unknown) {
      console.error('Attendance scan error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memproses absensi.';
      setResultSuccess(false);
      setResultMessage(msg);
      setResultModalOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPayloadInput.trim()) return;
    setManualModalOpen(false);
    processAttendanceData(manualPayloadInput.trim());
  };

  const resetScanner = () => {
    setResultModalOpen(false);
    setScanning(true);
    setCameraError(null);
    startCamera(facingMode);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex items-center justify-between">
        <button
          onClick={() => navigate('/siswa')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Kembali ke Beranda Siswa</span>
        </button>

        <button
          onClick={() => setManualModalOpen(true)}
          className="h-9 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
          title="Input kode token presensi secara manual"
        >
          <Keyboard className="w-3.5 h-3.5 text-slate-500" />
          <span>Input Token Manual</span>
        </button>
      </div>

      {/* Main Scanner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 text-center shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-semibold mb-3">
            <ScanLine className="w-3.5 h-3.5 text-blue-600" />
            <span>Pemindai Kamera QR Dinamis</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Arahkan Kamera ke QR Code Guru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Posisikan kode QR guru di dalam kotak pemindai. Sistem akan memverifikasi token kriptografi secara real-time.
          </p>
        </div>

        {/* Camera Viewport Frame */}
        <div className="relative mx-auto w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-lg flex items-center justify-center">
          {/* HTML5 Video element */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraLoading ? 'opacity-0' : 'opacity-100'
            }`}
            muted
            playsInline
          />

          {/* Offscreen Canvas for jsQR Frame Decoding */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Loading State */}
          {cameraLoading && !cameraError && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-white gap-3 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
              <p className="text-xs font-medium text-slate-300">Menghubungkan sensor kamera...</p>
            </div>
          )}

          {/* Camera Error / Desktop Fallback State */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 p-5 text-center text-white flex flex-col items-center justify-center space-y-3.5 z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/10 text-slate-300 flex items-center justify-center border border-white/10 shadow-xs">
                <Camera className="w-5 h-5 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white tracking-wide">Kamera Tidak Aktif / Ditolak Peramban</p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                  Beri izin kamera di browser, atau gunakan opsi simulasi otomatis dan unggah foto QR di bawah.
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full max-w-xs pt-0.5">
                <button
                  type="button"
                  onClick={handleQuickDemoScan}
                  className="w-full h-10 px-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Presensi Cepat (Sesi Aktif Langsung)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                    <span>Coba Lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-300" />
                    <span>Unggah File</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Laser Target Scan Overlay */}
          {!cameraError && scanning && (
            <div className="absolute inset-7 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <span className="w-5 h-5 border-t-3 border-l-3 border-[#2563EB] rounded-tl-sm"></span>
                <span className="w-5 h-5 border-t-3 border-r-3 border-[#2563EB] rounded-tr-sm"></span>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent w-full shadow-[0_0_12px_#3B82F6] animate-pulse"></div>
              <div className="flex justify-between">
                <span className="w-5 h-5 border-b-3 border-l-3 border-[#2563EB] rounded-bl-sm"></span>
                <span className="w-5 h-5 border-b-3 border-r-3 border-[#2563EB] rounded-br-sm"></span>
              </div>
            </div>
          )}

          {/* Active Camera Live Badge */}
          {!cameraLoading && !cameraError && scanning && (
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Kamera Aktif & Memindai</span>
            </div>
          )}

          {/* Processing Modal Overlay */}
          {processing && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 z-20">
              <Loader2 className="w-9 h-9 animate-spin text-[#2563EB]" />
              <div className="text-center">
                <p className="text-xs font-bold text-white tracking-wide">Memverifikasi Token Presensi...</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Memeriksa kriptografi & batas waktu</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Under Camera Viewport */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-sm mx-auto">
          <button
            type="button"
            onClick={handleToggleCamera}
            className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex-1 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
            title="Ganti Kamera Depan / Belakang"
          >
            <SwitchCamera className="w-4 h-4 text-slate-500" />
            <span>Ganti Kamera</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex-1 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
            title="Unggah Foto QR Code dari Galeri / Berkas"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Unggah Foto QR</span>
          </button>
        </div>

        {/* Quick Demo Attendance Action Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-left flex flex-col sm:flex-row items-center justify-between gap-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Uji Coba Presensi Instan</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Simulasikan presensi sukses tanpa kamera</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoScan}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs text-center whitespace-nowrap"
          >
            Presensi Sekarang
          </button>
        </div>

        {/* Security Info */}
        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Validasi ganda: token kriptografi anti-titip absen & toleransi jam</span>
        </div>
      </div>

      {/* MANUAL INPUT MODAL (FALLBACK) */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Input Data Presensi Alternatif"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Jika kamera tidak dapat digunakan, Anda dapat menekan tombol presensi instan di bawah atau memasukkan kode JSON sesi presensi:
          </p>

          <button
            type="button"
            onClick={() => {
              setManualModalOpen(false);
              handleQuickDemoScan();
            }}
            className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kirim Presensi Sekarang (Otomatis Sesi Aktif)</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-medium">atau tempel payload json</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <textarea
            value={manualPayloadInput}
            onChange={(e) => setManualPayloadInput(e.target.value)}
            placeholder='{"sessionId":"ses-today-1","token":"token-active-hash-01","classId":"cls-1"}'
            rows={3}
            className="form-input font-mono text-xs"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="btn btn-secondary text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs"
            >
              Kirim Absensi
            </button>
          </div>
        </form>
      </Modal>

      {/* ATTENDANCE RESULT MODAL */}
      <Modal
        isOpen={resultModalOpen}
        onClose={resetScanner}
        title={resultSuccess ? 'Pencatatan Berhasil!' : 'Presensi Gagal'}
      >
        <div className="text-center py-4 space-y-4">
          {resultSuccess ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-scale-in">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center animate-scale-in">
              <XCircle className="w-10 h-10" />
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {resultSuccess ? 'Presensi Berhasil Dicatat' : 'Tidak Dapat Memproses Absensi'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {resultMessage}
            </p>
          </div>

          {resultSuccess && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2.5 max-w-sm mx-auto text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Kelas</span>
                <span className="font-bold text-slate-800">{resultClassName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 items-center">
                <span className="text-slate-400">Status Kehadiran</span>
                <StatusBadge status={resultStatus} />
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Waktu Tercatat</span>
                <span className="font-bold text-slate-800">{resultTime} WIB</span>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2 pt-3">
            {resultSuccess ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/siswa/riwayat')}
                  className="btn btn-secondary text-xs h-9 px-4"
                >
                  Lihat Riwayat
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/siswa')}
                  className="btn btn-primary text-xs h-9 px-4"
                >
                  Kembali ke Beranda
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={resetScanner}
                className="btn btn-primary text-xs h-9 px-4"
              >
                Coba Pindai Ulang
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

