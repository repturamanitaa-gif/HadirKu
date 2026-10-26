import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  ShieldCheck,
  QrCode,
  UserCheck,
  Download,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import DownloadAppModal from '../components/ui/DownloadAppModal';

export default function LoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const { login, loginAsDemo, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      const routes = {
        admin: '/admin',
        guru: '/guru',
        siswa: '/siswa',
      };
      navigate(routes[profile.role] || '/login', { replace: true });
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login gagal';
      if (
        message.includes('user-not-found') ||
        message.includes('wrong-password') ||
        message.includes('invalid-credential')
      ) {
        setError('Alamat email atau kata sandi salah.');
      } else if (message.includes('too-many-requests')) {
        setError('Terlalu banyak percobaan gagal. Silakan tunggu sesaat.');
      } else if (message.includes('network-request-failed')) {
        setError('Kendala koneksi internet. Cek sambungan perangkat.');
      } else {
        setError('Gagal masuk. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'admin' | 'guru' | 'siswa') => {
    const creds = {
      admin: { email: 'admin@hadirku.id', password: 'admin123' },
      guru: { email: 'guru@hadirku.id', password: 'guru123' },
      siswa: { email: 'siswa@hadirku.id', password: 'siswa123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setError('');
    setLoading(true);
    try {
      await loginAsDemo(role);
      toast.success(`Berhasil masuk sebagai demo ${role.toUpperCase()}`, 'Autentikasi Berhasil');
    } catch (e) {
      console.error(e);
      toast.error('Gagal masuk sebagai akun demo.', 'Kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 relative overflow-hidden font-sans antialiased">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/25">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">HadirKu</span>
            <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SaaS v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Sistem Presensi Siswa Digital Berbasis Dynamic QR Code
          </p>
        </div>

        {/* Authentication Card (24px rounded, soft shadow, thin border) */}
        <div className="bg-white rounded-[24px] border border-slate-200/90 shadow-xl p-7 sm:p-9 space-y-6 transition-all">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Masuk ke Portal
            </h1>
            <p className="text-xs text-slate-500">
              Gunakan akun institusi sekolah Anda untuk melanjutkan.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/90 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  style={{ paddingLeft: '2.5rem' }}
                  className="form-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  className="form-input text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Tampilkan kata sandi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  toast.info(
                    'Untuk mereset kata sandi akun Anda, silakan hubungi Administrator sekolah.',
                    'Lupa Kata Sandi'
                  )
                }
                className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-11 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Section (3 Roles) */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Atau Uji Coba Langsung (1-Click Demo)
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 rounded-[16px] text-center transition-all cursor-pointer group active:scale-98"
              >
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-700">Admin</span>
                <span className="block text-[10px] text-slate-400">Master Data</span>
              </button>

              {/* Guru Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('guru')}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 rounded-[16px] text-center transition-all cursor-pointer group active:scale-98"
              >
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-700">Guru</span>
                <span className="block text-[10px] text-slate-400">Sesi &amp; QR</span>
              </button>

              {/* Siswa Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('siswa')}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 rounded-[16px] text-center transition-all cursor-pointer group active:scale-98"
              >
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-700">Siswa</span>
                <span className="block text-[10px] text-slate-400">Scan Presensi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Portofolio & Install PWA Pill Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => navigate('/portofolio')}
            className="inline-flex items-center gap-2 px-4 h-9 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-full text-[#2563EB] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Lihat Showcase Portofolio</span>
            <ArrowRight className="w-3 h-3 text-blue-500" />
          </button>

          <button
            type="button"
            onClick={handleDirectInstall}
            className="inline-flex items-center gap-2 px-4 h-9 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-700 text-xs font-medium shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Pasang Aplikasi (PWA)</span>
          </button>
        </div>

        {/* Footer Copyright */}
        <div className="text-center text-xs text-slate-400 pt-2">
          &copy; 2026 HadirKu &bull; Sistem Presensi Sekolah Digital
        </div>
      </div>

      {/* PWA Download Modal */}
      <DownloadAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </div>
  );
}
