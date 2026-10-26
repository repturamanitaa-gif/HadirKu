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

      {/* Main Sidebar: 228px Sleek, Clean Modern Light Theme (#FFFFFF) matching Figma reference */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[228px] bg-white border-r border-slate-200/70 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-30 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Institution Header matching Figma design */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold shadow-xs border border-blue-100/80">
                <GraduationCap className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-base text-slate-900 tracking-tight block">HadirKu</span>
                <span className="text-[11px] text-slate-400 font-medium block">Presensi Digital Sekolah</span>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 lg:hidden cursor-pointer"
              aria-label="Tutup navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Category Label */}
          <div className="px-6 pt-6 pb-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
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
                  `group flex items-center gap-3.5 px-4 h-11 text-xs font-semibold rounded-2xl transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50/80 text-[#2563EB] font-bold border border-blue-100/60 shadow-2xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
                        isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-700'
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
        <div className="p-4 space-y-3 shrink-0 border-t border-slate-100">
          {/* Academic Year Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shadow-2xs">
              <CalendarClock className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Tahun Ajaran</span>
              <span className="text-xs font-bold text-slate-800 block">2026/2027</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full h-10 px-3.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>

          <div className="px-2 pt-1 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">HadirKu v1.0</span>
            <span className="text-[9px] text-slate-300 block">Sistem Presensi Siswa Digital</span>
          </div>
        </div>
      </aside>
    </>
  );
}
