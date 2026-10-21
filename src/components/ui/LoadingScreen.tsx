import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center p-8">
        <div className="relative mb-5 flex justify-center">
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center border border-blue-700 shadow-sm">
            <span className="text-white font-bold text-xl tracking-tight">H</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-slate-700 font-semibold text-sm">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span>HadirKu</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Menyiapkan sistem administrasi sekolah...</p>
      </div>
    </div>
  );
}
