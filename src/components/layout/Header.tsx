import { useState } from 'react';
import { Menu, Bell, Search, Calendar, Download, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 lg:px-10">
      {/* Left: Mobile Toggle & Figma-style Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors lg:hidden cursor-pointer active:scale-95"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Figma Pill Search Field with Ctrl+K badge */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari mata pelajaran, guru, atau informasi..."
            style={{ paddingLeft: '2.75rem', paddingRight: '4.5rem' }}
            className="w-full h-11 text-xs bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/80 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all shadow-2xs"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 border border-slate-200 rounded-md shadow-2xs">
            Ctrl K
          </span>
        </div>

        {title && (
          <span className="font-bold text-sm text-slate-900 sm:hidden truncate">
            {title}
          </span>
        )}
      </div>

      {/* Right Controls matching Figma Community screenshot */}
      <div className="flex items-center gap-4">
        {/* Notification Bell with red dot */}
        <button
          className="w-10 h-10 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors relative flex items-center justify-center cursor-pointer"
          title="Notifikasi"
          aria-label="Notifikasi sistem"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile Pill Avatar matching Figma */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-sm shadow-2xs">
            {profile?.name?.charAt(0)?.toUpperCase() || 'R'}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <span className="text-xs font-bold text-slate-900 block truncate max-w-[150px]">
              {profile?.name || 'Rizky Pratama'}
            </span>
            <span className="text-[11px] text-slate-400 block font-medium">
              {profile?.role === 'admin'
                ? 'Administrator'
                : profile?.role === 'guru'
                ? 'Guru Pengampu'
                : 'Kelas X IPA 1'}
            </span>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <DownloadAppModal isOpen={showDownload} onClose={() => setShowDownload(false)} />
    </header>
  );
}
