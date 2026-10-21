import { useState } from 'react';
import { Menu, Bell, Search, Calendar, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DownloadAppModal from '../ui/DownloadAppModal';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { profile } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [showDownload, setShowDownload] = useState(false);

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'guru':
        return 'Guru Pengampu';
      case 'siswa':
        return 'Siswa';
      default:
        return 'Pengguna';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 transition-colors lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Search Field */}
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari siswa, guru, kelas, atau sesi..."
            className="w-full h-9 pl-9 pr-8 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:bg-white transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] font-mono bg-white px-1.5 py-0.5 border border-[#E2E8F0] rounded">
            /
          </kbd>
        </div>

        {title && (
          <span className="font-semibold text-xs text-[#0F172A] sm:hidden truncate">
            {title}
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#64748B] font-medium bg-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0]">
          <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="capitalize">{todayFormatted}</span>
        </div>

        {/* Download App Button (Lavender Accent) */}
        <button
          onClick={() => setShowDownload(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#DBE4FF] text-[#2563EB] bg-[#E8EDFF] hover:bg-[#DBE4FF] text-xs font-semibold transition-colors"
          title="Unduh Aplikasi Mobile"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh App</span>
        </button>

        {/* Notification Bell */}
        <button
          className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border border-[#E2E8F0] transition-colors relative"
          title="Notifikasi"
          aria-label="Notifikasi sistem"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#2563EB] rounded-full" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#172554] text-white flex items-center justify-center font-bold text-xs">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <span className="text-xs font-semibold text-[#0F172A] block truncate max-w-[140px]">
              {profile?.name || 'Pengguna'}
            </span>
            <span className="text-[10px] text-[#64748B] block font-medium">
              {getRoleBadge(profile?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <DownloadAppModal isOpen={showDownload} onClose={() => setShowDownload(false)} />
    </header>
  );
}
