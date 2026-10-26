import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, QrCode, Calendar, History, Settings, Users, BookOpen } from 'lucide-react';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const location = useLocation();

  // Role-specific Mobile Tab Bar Items (Apple HIG / Material 3 Guidelines)
  const getMobileNavItems = () => {
    const role = profile?.role || 'siswa';
    if (role === 'siswa') {
      return [
        { name: 'Beranda', to: '/siswa', icon: LayoutDashboard, exact: true },
        { name: 'Scan QR', to: '/siswa/scan', icon: QrCode },
        { name: 'Jadwal', to: '/siswa/jadwal', icon: Calendar },
        { name: 'Riwayat', to: '/siswa/riwayat', icon: History },
      ];
    }
    if (role === 'guru') {
      return [
        { name: 'Beranda', to: '/guru', icon: LayoutDashboard, exact: true },
        { name: 'QR Kelas', to: '/guru/qr', icon: QrCode },
        { name: 'Siswa', to: '/guru/siswa', icon: Users },
        { name: 'Laporan', to: '/guru/laporan', icon: History },
      ];
    }
    return [
      { name: 'Beranda', to: '/admin', icon: LayoutDashboard, exact: true },
      { name: 'Siswa', to: '/admin/siswa', icon: Users },
      { name: 'Kelas', to: '/admin/kelas', icon: BookOpen },
      { name: 'Setting', to: '/admin/settings', icon: Settings },
    ];
  };

  const navItems = getMobileNavItems();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col lg:flex-row antialiased">
      {/* Sidebar Navigation: Desktop */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area filling remaining viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F8FAFC]">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content Area filling remaining viewport with guaranteed padding */}
        <main className="page-container flex-1">
          <Outlet />
        </main>
      </div>

      {/* NATIVE MOBILE BOTTOM NAVIGATION BAR (Apple HIG / Material Design 3) */}
      <nav
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-[#2563EB] font-bold'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div
                  className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-blue-50 text-[#2563EB]' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

