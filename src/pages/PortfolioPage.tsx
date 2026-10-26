import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
  GraduationCap,
  Lock,
  ChevronRight,
  Globe,
  Database,
  BarChart3,
  Check,
  Laptop,
  Layers,
  Award,
  ScanLine,
  Activity,
  UserCheck,
  ShieldAlert,
  SlidersHorizontal,
  ChevronDown,
  Play,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { generateToken } from '../utils/helpers';
import { getStoredClasses, getStoredSessions } from '../utils/initialData';

export default function PortfolioPage() {
  const navigate = useNavigate();

  // Dynamic Live Simulator States
  const [simToken, setSimToken] = useState('token-hadirku-live-' + Math.floor(Math.random() * 1000));
  const [simCountdown, setSimCountdown] = useState(20);
  const [simSelectedStudent, setSimSelectedStudent] = useState('Muhammad Rizky Pratama');
  const [simSelectedNIS, setSimSelectedNIS] = useState('20241001');
  const [simAttendanceList, setSimAttendanceList] = useState([
    {
      name: 'Adinda Putri Maharani',
      nis: '20241002',
      time: '07:08 WIB',
      status: 'hadir',
    },
    {
      name: 'Bima Arya Pangestu',
      nis: '20241003',
      time: '07:11 WIB',
      status: 'hadir',
    },
    {
      name: 'Cantika Dewi Larasati',
      nis: '20241004',
      time: '07:14 WIB',
      status: 'hadir',
    },
  ]);
  const [simStatusMsg, setSimStatusMsg] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Dynamic WIB Clock
  const [currentTimeWIB, setCurrentTimeWIB] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeWIB(
        new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta',
        }).format(now) + ' WIB'
      );
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Simulator Dynamic QR Rotation (PRD FR-02: 20s token refresh)
  useEffect(() => {
    const timer = setInterval(() => {
      setSimCountdown((prev) => {
        if (prev <= 1) {
          const newToken = generateToken(24);
          setSimToken(newToken);
          // Sync with local active session storage so student scan picks it up
          syncLocalActiveSession(newToken);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to ensure simulator QR token is always valid for student scanner
  const syncLocalActiveSession = (token: string) => {
    try {
      const sessions = getStoredSessions();
      if (sessions.length > 0) {
        sessions[0].tokenHash = token;
        sessions[0].status = 'active';
        localStorage.setItem('hadirku_data_sessions', JSON.stringify(sessions));
      }
    } catch {
      // ignore
    }
  };

  // Initial sync on mount
  useEffect(() => {
    syncLocalActiveSession(simToken);
  }, [simToken]);

  // Handle Dynamic Simulation Attendance
  const handleSimulateAttendance = () => {
    const now = new Date();
    const timeStr =
      new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(now) + ' WIB';

    // Status based on realistic time tolerance
    const isLate = Math.random() < 0.25;
    const status = isLate ? 'terlambat' : 'hadir';

    // Prevent duplicate in current session list
    const filtered = simAttendanceList.filter((item) => item.name !== simSelectedStudent);
    const newEntry = {
      name: simSelectedStudent,
      nis: simSelectedNIS,
      time: timeStr,
      status,
    };

    setSimAttendanceList([newEntry, ...filtered]);
    setSimStatusMsg(
      `Presensi berhasil! ${simSelectedStudent} (${simSelectedNIS}) tercatat: ${
        status === 'hadir' ? 'Hadir Tepat Waktu' : 'Terlambat'
      } pada ${timeStr}`
    );

    // Save also to localStorage so StudentHistory & Teacher sees it
    try {
      const existingHistory = JSON.parse(
        localStorage.getItem('hadirku_data_student_att_v3') || '[]'
      );
      const studentRecord = {
        studentId: simSelectedNIS === '20241001' ? 'demo-siswa-uid' : 'sim-' + simSelectedNIS,
        studentName: simSelectedStudent,
        className: 'X IPA 1 — Matematika Wajib',
        status,
        checkedAt: now,
        source: 'qr_scan',
      };
      localStorage.setItem(
        'hadirku_data_student_att_v3',
        JSON.stringify([studentRecord, ...existingHistory.slice(0, 15)])
      );
      window.dispatchEvent(new Event('hadirku_attendance_updated'));
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSimStatusMsg(null);
    }, 5000);
  };

  // QR Payload JSON string
  const simQrPayload = JSON.stringify({
    sessionId: 'ses-today-1',
    token: simToken,
    classId: 'cls-1',
    expiresAt: Date.now() + 3600000,
  });

  const handleCopyPayload = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(simQrPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      {/* 1. MODERN SAAS NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">HadirKu</span>
                <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  v1.0 SaaS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Sistem Presensi Siswa Digital Berbasis QR Dinamis
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-[#2563EB] transition-colors">
              Fitur Unggulan
            </a>
            <a href="#simulator" className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Simulator QR</span>
            </a>
            <a href="#modul" className="hover:text-[#2563EB] transition-colors">
              Multi-Role
            </a>
            <a href="#keamanan" className="hover:text-[#2563EB] transition-colors">
              Anti-Fraud
            </a>
            <a href="#arsitektur" className="hover:text-[#2563EB] transition-colors">
              Arsitektur Teknis
            </a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-5 h-10 bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-sm transition-all duration-200 cursor-pointer active:scale-98"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION: 2-COLUMN MODERN SAAS (LINEAR / VERCEL STYLE) */}
      <section className="relative overflow-hidden py-12 lg:py-20 border-b border-slate-200/80 bg-gradient-to-b from-blue-50/50 via-slate-50/30 to-[#F8FAFC]">
        {/* Subtle Ambient Mesh Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-400/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column (7 cols): Copywriting, Badges, CTAs, Proof */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Product Version Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-[#2563EB] font-bold">HadirKu v1.0</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">Enterprise School Attendance SaaS</span>
              </div>

              {/* Main SaaS Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.12]">
                Sistem Presensi Siswa Digital, <span className="text-[#2563EB]">Real-Time</span> &amp; Anti Titip Absen.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed font-normal max-w-xl">
                Solusi presensi cerdas berbasis <strong>Dynamic QR 20 Detik</strong> dengan verifikasi token kriptografi ganda, 
                pencegahan screenshot, dan dashboard terintegrasi untuk Siswa, Guru, dan Administrator.
              </p>

              {/* Quick Feature Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
                  Rotasi Token 20s
                </span>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Anti-Screenshot Token
                </span>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  WIB Real-Time
                </span>
              </div>

              {/* Primary & Secondary CTA */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href="#simulator"
                  className="inline-flex items-center gap-2 px-6 h-12 bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-sm shadow-blue-500/20 transition-all duration-200 cursor-pointer active:scale-98"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Uji Coba Simulator QR</span>
                </a>

                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-5 h-12 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-2xs active:scale-98"
                >
                  <span>Masuk ke Dashboard</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Micro Tech Stack Badges */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                <span>Didukung teknologi:</span>
                <div className="flex items-center gap-2 font-mono text-slate-600 text-xs">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">React 19</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">TypeScript</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">PWA Offline</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Tailwind CSS</span>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Floating Dashboard Mockup */}
            <div className="lg:col-span-5">
              <div className="relative group">
                {/* Floating ambient glow behind mockup */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[26px] blur-lg opacity-15 group-hover:opacity-25 transition duration-500" />

                <div className="relative bg-white rounded-[24px] border border-slate-200/90 shadow-xl overflow-hidden p-3 transition-all">
                  {/* Browser Window Control Bar */}
                  <div className="bg-slate-50 rounded-[18px] border border-slate-200/70 px-3.5 py-2.5 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-3 py-0.5 rounded-lg shadow-2xs flex items-center gap-1.5">
                      <Lock className="w-2.5 h-2.5 text-emerald-500" />
                      <span>hadirku.sch.id/portal</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  </div>

                  {/* Mockup Dashboard Content */}
                  <div className="p-3.5 sm:p-4 bg-[#F8FAFC] rounded-[18px] space-y-3">
                    {/* Header Widget */}
                    <div className="bg-white p-3.5 rounded-[18px] border border-slate-200/80 shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 uppercase">
                          Live Monitoring
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">Sesi Presensi X IPA 1</h4>
                        <p className="text-[10px] text-slate-400">SMA Negeri 1 Maju Bersama</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          96% Hadir
                        </span>
                      </div>
                    </div>

                    {/* Stat Cards 2x2 */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white p-3 rounded-[16px] border border-slate-200/80 shadow-2xs">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Tepat Waktu</span>
                        <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">32 Siswa</span>
                        <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Sesuai Jadwal
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-[16px] border border-slate-200/80 shadow-2xs">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Terlambat</span>
                        <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">2 Siswa</span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">Toleransi 15 Menit</span>
                      </div>
                    </div>

                    {/* Live Activity Mini Stream */}
                    <div className="bg-white p-3 rounded-[16px] border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-[#2563EB]" />
                          Presensi Masuk Terakhir
                        </span>
                        <span className="text-slate-400 font-mono text-[9px]">{currentTimeWIB}</span>
                      </div>
                      <div className="space-y-1.5 text-[10px]">
                        <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">Adinda Putri Maharani</span>
                          <span className="text-emerald-700 font-bold text-[9px]">07:08 WIB</span>
                        </div>
                        <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">Bima Arya Pangestu</span>
                          <span className="text-emerald-700 font-bold text-[9px]">07:11 WIB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FLAGSHIP INTERACTIVE SIMULATOR (HIGHLIGHT UTAMA) */}
      <section id="simulator" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[24px] border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12 relative">
          {/* Header Playground */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-7 border-b border-slate-100 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Interactive Playground</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Live Simulator Dynamic QR &amp; Presensi Real-Time
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
                Bukti sistem HadirKu bekerja dinamis tanpa reload halaman. Amati rotasi kode QR setiap 20 detik,
                coba tombol rotasi manual, kirim presensi siswa, atau buka langsung pemindai kamera siswa.
              </p>
            </div>

            <div className="text-left md:text-right shrink-0">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">WAKTU SISTEM</span>
              <span className="text-base font-bold text-slate-900 font-mono">{currentTimeWIB}</span>
            </div>
          </div>

          {/* Feedback Toast Banner */}
          {simStatusMsg && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-[20px] text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span>{simStatusMsg}</span>
            </div>
          )}

          {/* 2-Column Live Playground */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-8 items-start">
            {/* Column 1: Teacher Dynamic QR Display (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50/70 p-6 sm:p-7 rounded-[20px] border border-slate-200/90 flex flex-col items-center text-center shadow-xs">
              <div className="flex items-center justify-between w-full mb-4">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#2563EB]" />
                  Layar Guru (Sesi KBM Aktif)
                </span>
                <span className="text-[11px] bg-blue-100 text-[#2563EB] px-2.5 py-0.5 rounded-full font-bold">
                  Kelas X IPA 1
                </span>
              </div>

              {/* Dynamic QR SVG Pedestal */}
              <div className="p-5 bg-white rounded-[20px] border-2 border-slate-200/80 shadow-md inline-block my-2 transition-all">
                <QRCodeSVG value={simQrPayload} size={210} level="H" includeMargin={true} />
              </div>

              {/* Dynamic Countdown Progress Bar */}
              <div className="w-full max-w-xs space-y-2 mt-4 mb-4">
                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2563EB] h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${Math.max(5, (simCountdown / 20) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
                    Token Masa Berlaku:
                  </span>
                  <span className="font-bold text-[#2563EB] font-mono">{simCountdown} detik</span>
                </div>
              </div>

              {/* Buttons: Force rotate & Copy Payload */}
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    const newToken = generateToken(24);
                    setSimToken(newToken);
                    setSimCountdown(20);
                    syncLocalActiveSession(newToken);
                  }}
                  className="w-full h-10 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Paksa Rotasi Token Baru Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="w-full h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedPayload ? 'Berhasil Dicopy ke Clipboard!' : 'Salin JSON Payload QR'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                Tangkapan layar akan kedaluwarsa otomatis dalam 20 detik untuk mencegah titip absen.
              </p>
            </div>

            {/* Column 2: Student Simulator & Live Table (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Interactive Controller Card */}
              <div className="bg-white p-6 rounded-[20px] border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#2563EB]" />
                    Simulasi Siswa Melakukan Scan QR
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/siswa/scan')}
                    className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Buka Kamera Siswa</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pilih Siswa
                    </label>
                    <select
                      value={simSelectedStudent}
                      onChange={(e) => {
                        setSimSelectedStudent(e.target.value);
                        if (e.target.value === 'Muhammad Rizky Pratama') setSimSelectedNIS('20241001');
                        else if (e.target.value === 'Dimas Wahyu Nugroho') setSimSelectedNIS('20241005');
                        else setSimSelectedNIS('20241006');
                      }}
                      className="w-full h-11 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    >
                      <option value="Muhammad Rizky Pratama">Muhammad Rizky Pratama (20241001)</option>
                      <option value="Dimas Wahyu Nugroho">Dimas Wahyu Nugroho (20241005)</option>
                      <option value="Fadhil Ihsan Ramadhan">Fadhil Ihsan Ramadhan (20241006)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Aksi Simulasi
                    </label>
                    <button
                      type="button"
                      onClick={handleSimulateAttendance}
                      className="w-full h-11 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Kirim Scan Presensi</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Attendees Table */}
              <div className="bg-white rounded-[20px] border border-slate-200/90 overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Daftar Kehadiran Real-Time ({simAttendanceList.length} Siswa)
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200/70 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Updated
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {simAttendanceList.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 px-4 sm:px-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#2563EB] font-bold text-xs flex items-center justify-center border border-blue-100">
                          {att.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{att.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">NIS: {att.nis} • Waktu: {att.time}</p>
                        </div>
                      </div>

                      <div>
                        {att.status === 'hadir' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Hadir
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Terlambat
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MULTI-ROLE ECOSYSTEM SECTION */}
      <section id="modul" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Ekosistem Sekolah Lengkap</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Tiga Modul Berperan Khusus (Multi-Role)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
            Setiap pengguna memiliki antarmuka yang disesuaikan secara presisi untuk kenyamanan dan efisiensi alur kerja sekolah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Siswa Card */}
          <div className="bg-white p-7 sm:p-8 rounded-[20px] border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold border border-blue-100">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Portal Siswa (Mobile First)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Antarmuka kartu mobile modern dengan pemindai QR WebRTC responsif, riwayat absensi mandiri, serta pengajuan surat izin KBM digital.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kamera scan cepat &amp; unggah foto QR</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Statistik kehadiran &amp; jadwal KBM hari ini</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengajuan izin sakit &amp; dispensasi online</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => navigate('/siswa')}
              className="w-full h-11 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98"
            >
              <span>Buka Portal Siswa</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Guru Card */}
          <div className="bg-white p-7 sm:p-8 rounded-[20px] border-2 border-blue-600 shadow-md shadow-blue-500/5 transition-all flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3 right-6 bg-[#2563EB] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Paling Sering Digunakan
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold border border-blue-100">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Portal Guru Pengampu</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kelola sesi presensi kelas, tampilkan QR code dinamis anti-kecurangan di proyektor, pantau siswa live, dan koreksi kehadiran ber-audit log.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pembuatan sesi kelas &amp; toleransi waktu masuk</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>QR dinamis refresh otomatis setiap 20 detik</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Koreksi status dengan audit log transparan</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => navigate('/guru')}
              className="w-full h-11 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <span>Buka Portal Guru</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>

          {/* Admin Card */}
          <div className="bg-white p-7 sm:p-8 rounded-[20px] border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Portal Administrator</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pusat kendali master data akademik sekolah: kelola akun siswa, guru, rombel kelas, serta unduh rekapitulasi kehadiran institusi dalam spreadsheet.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Manajemen data siswa, NIS, dan rombel</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Manajemen akun guru &amp; penugasan wali kelas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ekspor data rekapitulasi sekolah (CSV/Excel)</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-full h-11 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98"
            >
              <span>Buka Portal Admin</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. SECURITY & ANTI-FRAUD SECTION */}
      <section id="keamanan" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold mb-3">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Proteksi Anti-Kecurangan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Mengapa Bebas Titip Absen?
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
              Kombinasi teknologi kriptografi berbatas waktu, verifikasi keanggotaan kelas, dan audit trail transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-[20px] bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold mb-4">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Token Rotasi 20 Detik</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Setiap QR code berisi payload terenkripsi yang berevolusi setiap 20 detik. Foto layar atau screenshot tidak akan dapat digunakan kembali.
              </p>
            </div>

            <div className="p-6 rounded-[20px] bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Validasi Identitas Ganda</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Sistem mencocokkan akun siswa dengan daftar rombel kelas aktif guru. Siswa dari kelas lain tidak dapat memindai sesi yang bukan haknya.
              </p>
            </div>

            <div className="p-6 rounded-[20px] bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Toleransi Waktu Masuk</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Guru dapat mengatur batas menit toleransi (misal 15 menit). Absensi setelah batas waktu otomatis berstatus terlambat tanpa manipulasi manual.
              </p>
            </div>

            <div className="p-6 rounded-[20px] bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Audit Log Koreksi Guru</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Setiap perubahan status kehadiran oleh guru tercatat rapi beserta alasan dan waktu perubahan untuk pertanggungjawaban sekolah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TECHNICAL ARCHITECTURE SECTION */}
      <section id="arsitektur" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-semibold mb-3">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Fondasi Rekayasa Perangkat Lunak</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Arsitektur Teknologi Kelas Enterprise
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
            Kombinasi teknologi web modern, hybrid mobile, dan algoritma verifikasi token untuk sistem yang kokoh.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[20px] border border-slate-200/90 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold mb-3">
              <Laptop className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">React 19 &amp; TypeScript</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Komponen modular dengan type safety ketat, rendering ultra-cepat, dan struktur kode bersih berbasis enterprise patterns.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[20px] border border-slate-200/90 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">PWA &amp; Service Worker</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Dapat di-install langsung dari browser di ponsel pintar siswa dengan dukungan cache offline cerdas dan sensor kamera WebRTC.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[20px] border border-slate-200/90 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Firestore &amp; Local Fallback</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sinkronisasi real-time cloud Firestore dengan fallback dataset lokal sehingga absensi tetap lancar meskipun sinyal internet padat.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[20px] border border-slate-200/90 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Analytics &amp; Ekspor Excel</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Visualisasi tren kehadiran mingguan, diagram persentase kehadiran, dan pengunduhan rekapitulasi spreadsheet dalam format CSV/Excel.
            </p>
          </div>
        </div>
      </section>

      {/* 7. ACADEMIC & DEVELOPER PROFILE HERO CARD */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#172554] rounded-[24px] p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/15">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Karya Portofolio Akademik &amp; Rekayasa Sistem</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Dikembangkan untuk Standar Presensi Sekolah Indonesia
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Aplikasi ini dirancang sebagai portofolio implementasi teknologi presensi digital.
              Sistem memadukan kerapihan antarmuka SaaS modern, arsitektur berbasis token dinamis real-time,
              serta kepatuhan penuh pada spesifikasi PRD industri perangkat lunak.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15 text-xs">
              <div>
                <span className="text-blue-200 block text-[11px]">Proyek</span>
                <span className="font-bold text-white text-sm">HadirKu v1.0</span>
              </div>
              <div>
                <span className="text-blue-200 block text-[11px]">Platform</span>
                <span className="font-bold text-white text-sm">Web, PWA &amp; Mobile</span>
              </div>
              <div>
                <span className="text-blue-200 block text-[11px]">Kategori</span>
                <span className="font-bold text-white text-sm">EdTech SaaS</span>
              </div>
              <div>
                <span className="text-blue-200 block text-[11px]">Status</span>
                <span className="font-bold text-emerald-400 text-sm">Production Ready</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-7 h-12 bg-white hover:bg-slate-100 text-[#172554] rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer active:scale-98"
              >
                <span>Buka Aplikasi Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. MINIMALIST SAAS FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-10 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-800">
          &copy; 2026 HadirKu — Sistem Presensi Siswa Digital Berbasis QR Dinamis
        </p>
        <p className="text-[11px] text-slate-400">
          Dirancang dengan estetika visual SaaS modern, arsitektur state real-time, dan proteksi anti-titip absen.
        </p>
      </footer>
    </div>
  );
}
