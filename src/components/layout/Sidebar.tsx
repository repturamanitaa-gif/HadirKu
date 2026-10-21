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

  const iconClass = 'w-[18px] h-[18px]';

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
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-[2px]"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar: 230px Fixed, Deep Navy Theme (#172554) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[230px] bg-[#172554] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-30 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Institution Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-sm text-white tracking-tight block">HadirKu</span>
                <span className="text-[10px] text-slate-300 font-medium block">Presensi Sekolah</span>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-white/10 text-white/60 lg:hidden"
              aria-label="Tutup navigasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Category Label */}
          <div className="px-5 pt-6 pb-2">
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
              Menu Navigasi
            </span>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/guru' || item.path === '/siswa'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 h-10 text-[13px] font-medium rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#172554] font-semibold shadow-xs'
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
        <div className="p-3 space-y-2.5 shrink-0 border-t border-white/10">
          {/* Academic Year Badge */}
          <div className="px-3 py-2 bg-white/5 rounded-lg text-[11px]">
            <div className="flex items-center gap-2 text-slate-400">
              <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
              <span>Tahun Ajaran</span>
            </div>
            <div className="text-white font-semibold mt-0.5 pl-5">
              2026/2027
            </div>
          </div>

          {/* User Profile Card & Logout */}
          <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 leading-tight">
                <span className="text-xs font-semibold text-white block truncate">
                  {profile?.name || 'Pengguna'}
                </span>
                <span className="text-[10px] text-slate-400 capitalize block">
                  {profile?.role === 'admin' ? 'Administrator' : profile?.role === 'guru' ? 'Guru' : 'Siswa'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-300 transition-colors shrink-0"
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
