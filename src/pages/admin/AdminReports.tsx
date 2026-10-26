import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ChevronRight, CheckCircle2, Clock, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { exportToCSV } from '../../utils/helpers';
import { getStoredClasses } from '../../utils/initialData';

export default function AdminReports() {
  const { toast } = useToast();
  const classes = getStoredClasses();
  const [period, setPeriod] = useState('Oktober 2026');
  const [selectedClass, setSelectedClass] = useState('all');
  const [reportType, setReportType] = useState('kehadiran');

  // Realistic mock summary metrics matching mockup image
  const summaryMetrics = {
    hadir: '1.876',
    hadirPct: '84%',
    terlambat: '220',
    terlambatPct: '10%',
    alfa: '130',
    alfaPct: '6%',
  };

  // Mock table rows per class matching mockup
  const classReports = [
    { no: 1, name: 'X IPA 1', hadir: 32, terlambat: 2, alfa: 1, percentage: '94%' },
    { no: 2, name: 'X IPS 2', hadir: 28, terlambat: 4, alfa: 2, percentage: '88%' },
    { no: 3, name: 'XI IPA 1', hadir: 30, terlambat: 3, alfa: 1, percentage: '91%' },
    { no: 4, name: 'XI IPS 1', hadir: 27, terlambat: 2, alfa: 3, percentage: '85%' },
    { no: 5, name: 'XII IPA 2', hadir: 22, terlambat: 3, alfa: 1, percentage: '92%' },
  ];

  const filteredReports =
    selectedClass === 'all'
      ? classReports
      : classReports.filter((c) => c.name.toLowerCase() === selectedClass.toLowerCase());

  const handleExportCSV = () => {
    const rows = filteredReports.map((r) => ({
      No: r.no,
      Kelas: r.name,
      'Hadir Tepat Waktu': r.hadir,
      Terlambat: r.terlambat,
      'Alfa / Tanpa Keterangan': r.alfa,
      Persentase: r.percentage,
      Periode: period,
    }));
    exportToCSV(rows, `Laporan_Rekap_Presensi_${period.replace(/\s+/g, '_')}`);
    toast.success('Berkas rekapitulasi CSV berhasil diunduh ke perangkat Anda.', 'Ekspor Selesai');
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
          <Link to="/admin" className="hover:text-[#2563EB] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0F172A] font-semibold">Laporan Rekap</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Laporan Rekap
            </h1>
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Periode, Kelas, Jenis Laporan, and Generate Button */}
      <div className="panel p-3.5 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Periode
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="form-input w-full h-9 text-xs"
            >
              <option value="Oktober 2026">Oktober 2026</option>
              <option value="September 2026">September 2026</option>
              <option value="Agustus 2026">Agustus 2026</option>
              <option value="Semester Ganjil 2026/2027">Semester Ganjil 2026/2027</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-input w-full h-9 text-xs"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.classId} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Jenis Laporan
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-input w-full h-9 text-xs"
            >
              <option value="kehadiran">Rekap Kehadiran</option>
              <option value="keterlambatan">Rekap Keterlambatan</option>
              <option value="alfa">Rekap Tanpa Keterangan</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {}}
              className="w-full h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 shadow-xs transition-colors"
            >
              <span>Generate</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Summary Stat Cards matching Mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Hadir */}
        <div className="panel p-4 flex items-center gap-3.5 bg-white">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#697586] uppercase tracking-wider block">
              Total Hadir
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#202B3C] tabular-nums">
                {summaryMetrics.hadir}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {summaryMetrics.hadirPct}
              </span>
            </div>
          </div>
        </div>

        {/* Terlambat */}
        <div className="panel p-4 flex items-center gap-3.5 bg-white">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#697586] uppercase tracking-wider block">
              Terlambat
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#202B3C] tabular-nums">
                {summaryMetrics.terlambat}
              </span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {summaryMetrics.terlambatPct}
              </span>
            </div>
          </div>
        </div>

        {/* Alfa */}
        <div className="panel p-4 flex items-center gap-3.5 bg-white">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#697586] uppercase tracking-wider block">
              Alfa
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#202B3C] tabular-nums">
                {summaryMetrics.alfa}
              </span>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {summaryMetrics.alfaPct}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rekap Kehadiran Per Kelas Table */}
      <div className="panel overflow-hidden">
        <div className="p-4 border-b border-[#E3E8EF] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#202B3C] tracking-tight">
            Rekap Kehadiran Per Kelas
          </h3>
          <span className="text-xs text-[#697586]">
            Periode: <strong className="text-[#202B3C] font-semibold">{period}</strong>
          </span>
        </div>

        <div className="table-container border-0 rounded-b-xl rounded-t-none">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th className="w-12 text-center">No</th>
                <th>Kelas</th>
                <th>Hadir</th>
                <th>Terlambat</th>
                <th>Alfa</th>
                <th className="text-right">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((row) => (
                <tr key={row.no}>
                  <td className="text-center text-xs font-medium text-[#697586]">{row.no}</td>
                  <td>
                    <span className="font-semibold text-[#202B3C] text-xs sm:text-sm">
                      {row.name}
                    </span>
                  </td>
                  <td className="text-emerald-700 font-semibold text-xs tabular-nums">
                    {row.hadir}
                  </td>
                  <td className="text-amber-700 font-semibold text-xs tabular-nums">
                    {row.terlambat}
                  </td>
                  <td className="text-rose-700 font-semibold text-xs tabular-nums">
                    {row.alfa}
                  </td>
                  <td className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#E8EDFF] text-[#2563EB] font-bold text-xs tabular-nums border border-[#DBE4FF]">
                      {row.percentage}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#697586]">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada data rekapitulasi untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
