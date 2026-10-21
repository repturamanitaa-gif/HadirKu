import { useState, useEffect } from 'react';
import { Smartphone, Download, Check, Share, PlusSquare, ArrowUpRight } from 'lucide-react';
import Modal from './Modal';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      } catch (e) {
        console.warn('Install prompt error:', e);
      }
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instal Aplikasi HadirKu">
      <div className="flex flex-col items-center text-center p-2 sm:p-3 space-y-4">
        {/* Phone Icon with checkmark badge */}
        <div className="relative w-16 h-16 rounded-2xl bg-[#E8EDFF] border border-[#C7D7FE] flex items-center justify-center text-[#2563EB]">
          <Smartphone className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h3 className="text-base font-bold text-[#172554]">
            {isIOS ? 'Pasang di Layar Utama iPhone' : 'Instal Aplikasi HadirKu (PWA)'}
          </h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto leading-relaxed">
            Akses instan seperti aplikasi dari App Store / Play Store tanpa browser bar.
          </p>
        </div>

        {/* Instructions based on platform */}
        {isIOS ? (
          <div className="w-full text-left bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5 text-xs text-[#334155]">
            <p className="font-semibold text-[#0F172A] text-[11px] uppercase tracking-wider">
              Khusus Safari di iOS (iPhone / iPad):
            </p>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 font-bold text-[11px]">
                1
              </div>
              <div className="leading-snug">
                Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah atas <Share className="inline w-3.5 h-3.5 text-[#2563EB]" />) di bilah bawah Safari.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 font-bold text-[11px]">
                2
              </div>
              <div className="leading-snug">
                Gulir ke bawah dan pilih <strong>&quot;Add to Home Screen&quot;</strong> (<PlusSquare className="inline w-3.5 h-3.5 text-slate-700" /> Tambahkan ke Layar Utama).
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 font-bold text-[11px]">
                3
              </div>
              <div className="leading-snug">
                Ketuk <strong>&quot;Add&quot;</strong> di pojok kanan atas. Ikon HadirKu akan langsung muncul di homescreen!
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full text-left bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2 text-xs text-[#334155]">
            <p className="font-semibold text-[#0F172A] text-[11px] uppercase tracking-wider">
              Android & Chrome / Edge:
            </p>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-[#2563EB] shrink-0">1.</span>
              <span>Klik tombol <strong>&quot;Instal Sekarang&quot;</strong> di bawah.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-[#2563EB] shrink-0">2.</span>
              <span>Atau buka menu titik tiga di kanan atas browser &gt; pilih <strong>&quot;Instal Aplikasi&quot;</strong>.</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {deferredPrompt ? (
          <button
            onClick={handleInstallPWA}
            className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Instal Sekarang</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full h-10 bg-[#172554] hover:bg-[#0F172A] text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>{isIOS ? 'Saya Mengerti' : 'Tutup'}</span>
          </button>
        )}
      </div>
    </Modal>
  );
}
