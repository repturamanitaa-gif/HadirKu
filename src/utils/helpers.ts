// ============================================
// CSV Export Utility
// ============================================

export function exportToCSV(
  data: Record<string, string | number>[],
  filename: string,
  headers?: string[]
) {
  if (data.length === 0) return;

  const keys = headers || Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(keys.join(','));

  // Data rows
  for (const row of data) {
    const values = keys.map((key) => {
      const val = row[key] ?? '';
      // Escape commas and quotes
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

// ============================================
// Date Formatting Utility
// ============================================

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// ============================================
// QR Token Utility
// ============================================

export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export async function hashToken(token: string): Promise<string> {
  // crypto.subtle requires a Secure Context (HTTPS or localhost)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: simple string hash for insecure contexts (dev only)
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ============================================
// Status Badge Utility
// ============================================

export function getStatusColor(status: string): string {
  switch (status) {
    case 'hadir':
    case 'hadir_tepat_waktu':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'terlambat':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'tidak_hadir':
    case 'alfa':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'active':
    case 'aktif':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'closed':
    case 'nonaktif':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'hadir':
    case 'hadir_tepat_waktu':
      return 'Hadir Tepat Waktu';
    case 'terlambat':
      return 'Terlambat';
    case 'tidak_hadir':
    case 'alfa':
      return 'Alfa / Tanpa Ket.';
    case 'active':
    case 'aktif':
      return 'Aktif';
    case 'closed':
      return 'Ditutup';
    case 'nonaktif':
      return 'Nonaktif';
    default:
      return status;
  }
}
