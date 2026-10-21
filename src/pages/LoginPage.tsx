import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
} from 'lucide-react';
import DownloadAppModal from '../components/ui/DownloadAppModal';

export default function LoginPage() {
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
      // Fallback modal with guide
      setShowInstallModal(true);
    }
  };

  const { login, loginAsDemo, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      const routes: Record<string, string> = { admin: '/admin', guru: '/guru', siswa: '/siswa' };
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F6FB',
        padding: '24px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Brand Identity */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 12px',
            backgroundColor: '#2563EB',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '22px',
            boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.35)',
          }}
        >
          H
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            HadirKu
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#2563EB',
              backgroundColor: '#E0EAFF',
              padding: '2px 8px',
              borderRadius: '999px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Sekolah
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
          Sistem Presensi Siswa Digital Berbasis QR
        </p>
      </div>

      {/* Main Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03)',
          padding: '32px 28px',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Masuk ke Akun
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', margin: '6px 0 0' }}>
            Silakan masukkan email dan kata sandi Anda
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#B91C1C',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Email Akun
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@sekolah.id"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px 0 38px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Kata Sandi
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 40px 0 38px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#64748B' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#2563EB', cursor: 'pointer' }}
              />
              <span>Ingat saya</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Untuk reset kata sandi, hubungi admin sekolah.')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              Lupa kata sandi?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              marginTop: '4px',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Section */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
          <span
            style={{
              display: 'block',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Atau Coba Masuk Sebagai (Demo)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {/* Admin Button */}
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              style={{
                padding: '10px 6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  margin: '0 auto 6px',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <ShieldCheck size={16} />
              </div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>Admin</span>
              <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>Master Data</span>
            </button>

            {/* Guru Button */}
            <button
              type="button"
              onClick={() => handleQuickDemo('guru')}
              style={{
                padding: '10px 6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  margin: '0 auto 6px',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <QrCode size={16} />
              </div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>Guru</span>
              <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>Buka Sesi QR</span>
            </button>

            {/* Siswa Button */}
            <button
              type="button"
              onClick={() => handleQuickDemo('siswa')}
              style={{
                padding: '10px 6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  margin: '0 auto 6px',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <UserCheck size={16} />
              </div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>Siswa</span>
              <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>Scan Absensi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Install App Button on Login Screen */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleDirectInstall}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '999px',
            color: '#1E293B',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={12} strokeWidth={2.5} />
          </div>
          <span>Instal Aplikasi HadirKu</span>
        </button>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#94A3B8' }}>
        © 2026 HadirKu • Sistem Presensi Sekolah Digital
      </div>

      {/* PWA Download Modal */}
      <DownloadAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </div>
  );
}
