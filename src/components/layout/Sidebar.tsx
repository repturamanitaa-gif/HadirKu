import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  QrCode,
  History,
  ScanLine,
  LogOut,
  X,
  FileSpreadsheet,
  CalendarClock,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const iconClass = 'w-5 h-5';

  const adminNav: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className={iconClass} /> },
    { label: 'Data Siswa', path: '/admin/siswa', icon: <Users className={iconClass} /> },
    { label: 'Data Guru', path: '/admin/guru', icon: <GraduationCap className={iconClass} /> },
    { label: 'Data Kelas', path: '/admin/kelas', icon: <BookOpen className={iconClass} /> },
    { label: 'Laporan Rekap', path: '/admin/laporan', icon: <FileSpreadsheet className={iconClass} /> },
  ];

  const guruNav: NavItem[] = [
    { label: 'Dashboard', path: '/guru', icon: <LayoutDashboard className={iconClass} /> },
    { label: 'Kelas Saya', path: '/guru/kelas', icon: <BookOpen className={iconClass} /> },
    { label: 'Sesi Presensi (QR)', path: '/guru/sesi', icon: <QrCode className={iconClass} /> },
    { label: 'Laporan Presensi', path: '/guru/rekap', icon: <FileSpreadsheet className={iconClass} /> },
  ];

  const siswaNav: NavItem[] = [
    { label: 'Dashboard', path: '/siswa', icon: <LayoutDashboard className={iconClass} /> },
    { label: 'Scan QR Presensi', path: '/siswa/scan', icon: <ScanLine className={iconClass} /> },
    { label: 'Riwayat Kehadiran', path: '/siswa/riwayat', icon: <History className={iconClass} /> },
  ];

  const navItems =
    profile?.role === 'admin'
      ? adminNav
      : profile?.role === 'guru'
      ? guruNav
      : siswaNav;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar: 260px Fixed, Deep Navy Theme (#172554) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#172554] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-30 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Institution Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-base text-white tracking-tight block">HadirKu</span>
                <span className="text-[11px] text-blue-200 font-medium block">Presensi Digital</span>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 lg:hidden cursor-pointer"
              aria-label="Tutup navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Category Label */}
          <div className="px-6 pt-7 pb-2.5">
            <span className="text-[11px] font-bold text-blue-200/60 tracking-wider uppercase block">
              Menu Utama
            </span>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/guru' || item.path === '/siswa'}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 px-3.5 h-11 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#172554] font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex-shrink-0 transition-colors ${
                        isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 space-y-2.5 shrink-0 border-t border-white/10">
          {/* Portofolio Showcase Link */}
          <button
            onClick={() => window.open(import.meta.env.BASE_URL + 'portofolio', '_blank')}
            className="w-full px-3.5 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/20 text-blue-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Portofolio HadirKu</span>
            </span>
            <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">↗</span>
          </button>

          {/* Academic Year Badge */}
          <div className="px-3.5 py-2 bg-white/5 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
              <span>Tahun Ajaran</span>
            </div>
            <div className="text-white font-semibold mt-0.5 pl-5 text-xs">
              2026/2027 (Genap)
            </div>
          </div>

          {/* User Profile Card & Logout */}
          <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 leading-tight">
                <span className="text-xs font-bold text-white block truncate">
                  {profile?.name || 'Pengguna'}
                </span>
                <span className="text-[10px] text-blue-200/70 capitalize block">
                  {profile?.role === 'admin' ? 'Administrator' : profile?.role === 'guru' ? 'Guru' : 'Siswa'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-300 transition-colors shrink-0 cursor-pointer"
              title="Keluar Akun"
              aria-label="Keluar dari sistem"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
