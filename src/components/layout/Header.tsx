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
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-5 sm:px-8 shadow-2xs">
      {/* Left: Mobile Toggle & Search / Breadcrumb */}
      <div className="flex items-center gap-3.5 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors lg:hidden cursor-pointer"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Field with guaranteed non-overlapping left padding */}
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari siswa, guru, kelas, atau sesi..."
            style={{ paddingLeft: '2.75rem', paddingRight: '2.25rem' }}
            className="w-full h-10 text-xs bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all shadow-2xs"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded-md shadow-2xs">
            /
          </kbd>
        </div>

        {title && (
          <span className="font-bold text-sm text-slate-900 sm:hidden truncate">
            {title}
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 px-3.5 h-10 rounded-xl border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{todayFormatted}</span>
        </div>

        {/* Portofolio Showcase Button */}
        <button
          onClick={() => window.open(import.meta.env.BASE_URL + 'portofolio', '_blank')}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 h-10 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          title="Buka Portofolio & Showcase HadirKu"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Portofolio</span>
        </button>

        {/* Download App Button */}
        <button
          onClick={() => setShowDownload(true)}
          className="hidden lg:inline-flex items-center gap-2 px-3.5 h-10 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          title="Unduh Aplikasi Mobile"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Unduh App</span>
        </button>

        {/* Notification Bell */}
        <button
          className="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors relative flex items-center justify-center cursor-pointer shadow-2xs"
          title="Notifikasi"
          aria-label="Notifikasi sistem"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-[#172554] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden xl:block text-left leading-tight">
            <span className="text-xs font-bold text-slate-900 block truncate max-w-[140px]">
              {profile?.name || 'Pengguna'}
            </span>
            <span className="text-[11px] text-slate-400 block font-medium">
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
