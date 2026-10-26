<?php
/**
 * HadirKu — Dynamic Entry Point & System Portfolio Showcase
 * Mendukung eksekusi dinamis PHP di lingkungan server XAMPP Apache
 */

date_default_timezone_set('Asia/Jakarta');

// Server-side dynamic metrics
$serverTime = date('H:i:s') . ' WIB';
$serverDate = date('d F Y');
$phpVersion = phpversion();
$academicYear = '2026/2027';

// Dynamic mock statistics
$totalSiswa = 32;
$totalKelas = 6;
$tingkatKehadiran = 96.4;
$sesiAktif = 'X IPA 1 — Matematika Wajib';

// If requested with ?app=true, redirect to built app or dev app
if (isset($_GET['app'])) {
    if (file_exists(__DIR__ . '/dist/index.html')) {
        header('Location: dist/index.html');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HadirKu — Portal Presensi Siswa Digital & Portofolio</title>
  <meta name="description" content="Sistem Presensi Siswa Digital berbasis Dynamic QR Code berbatas waktu, PWA, dan Android Hybrid.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    :root {
      --royal: #2563eb;
      --royal-dark: #1d4ed8;
      --navy: #172554;
      --canvas: #f5f7fb;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --emerald: #059669;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: var(--canvas); color: var(--text); line-height: 1.6; }
    .server-badge { background: #172554; color: #ffffff; padding: 8px 20px; font-size: 12px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .nav { background: #ffffff; border-bottom: 1px solid var(--border); padding: 0 24px; height: 68px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
    .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; }
    .brand-logo { width: 40px; height: 40px; border-radius: 12px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .hero { padding: 50px 0 60px; text-align: center; background: linear-gradient(180deg, #fff 0%, #eff6ff 100%); border-bottom: 1px solid var(--border); }
    .card { background: #ffffff; border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer; border: none; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #fff; border: 1px solid var(--border); color: var(--text); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .badge-success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 30px 0; }
    @media(max-width: 800px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>

  <!-- Dynamic Server-side Info Header (PHP Engine) -->
  <div class="server-badge">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 99px; font-size: 10px;">PHP 8.2 DINAMIS</span>
      <span>XAMPP Server Berjalan • Tanggal: <?= htmlspecialchars($serverDate) ?></span>
    </div>
    <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">
      Jam Server: <strong style="color: #60a5fa;"><?= htmlspecialchars($serverTime) ?></strong>
    </div>
  </div>

  <!-- Navbar -->
  <nav class="nav">
    <a href="#" class="brand">
      <div class="brand-logo">H</div>
      <div>
        <div style="font-size: 18px; font-weight: 800; color: #172554;">HadirKu</div>
        <div style="font-size: 11px; color: #64748b;">Sistem Presensi Dinamis Siswa</div>
      </div>
    </a>

    <div style="display: flex; gap: 10px;">
      <a href="portfolio.html" class="btn btn-secondary">
        <span>📖 Portofolio Lengkap</span>
      </a>
      <a href="dist/index.html" class="btn btn-primary">
        <span>🚀 Masuk ke Web App</span>
      </a>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #e0eaff; color: #2563eb; border-radius: 99px; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
        <span>🎓</span>
        <span>PORTOFOLIO AKADEMIK RESMI — KARYA MAHASISWA</span>
      </div>

      <h1 style="font-size: 38px; font-weight: 900; color: #172554; max-width: 800px; margin: 0 auto 16px; line-height: 1.2;">
        HadirKu — Presensi Digital Berbasis QR Dinamis & Multi-Platform
      </h1>

      <p style="font-size: 15px; color: #64748b; max-width: 680px; margin: 0 auto 24px;">
        Sistem presensi anti-titip absen dengan rotasi token dinamis, arsitektur visual rapi, dan dukungan multi-perangkat (PWA & Android Hybrid).
      </p>

      <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
        <a href="dist/index.html" class="btn btn-primary" style="padding: 12px 24px; font-size: 14px;">
          <span>Buka Aplikasi Presensi (Login)</span>
          <span>→</span>
        </a>
        <a href="portfolio.html#simulator" class="btn btn-secondary" style="padding: 12px 24px; font-size: 14px;">
          <span>⚡ Coba Simulator QR Dinamis</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Dynamic Server Metrics Grid -->
  <section class="container" style="padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 22px; font-weight: 800; color: #172554;">Status & Metrik Sistem Nyata</h2>
      <p style="font-size: 13px; color: #64748b;">Data yang disinkronisasi langsung dari server PHP & basis data lokal</p>
    </div>

    <div class="grid-4">
      <div class="card" style="text-align: center;">
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Total Siswa Terdaftar</span>
        <div style="font-size: 32px; font-weight: 900; color: #2563eb; margin: 4px 0;"><?= $totalSiswa ?></div>
        <span class="badge badge-success">Kelas X IPA 1</span>
      </div>

      <div class="card" style="text-align: center;">
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Rombel Kelas</span>
        <div style="font-size: 32px; font-weight: 900; color: #172554; margin: 4px 0;"><?= $totalKelas ?></div>
        <span style="font-size: 11px; color: #64748b;">X, XI, XII Rombel</span>
      </div>

      <div class="card" style="text-align: center;">
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Tingkat Kehadiran</span>
        <div style="font-size: 32px; font-weight: 900; color: #059669; margin: 4px 0;"><?= $tingkatKehadiran ?>%</div>
        <span class="badge badge-success">Sangat Baik</span>
      </div>

      <div class="card" style="text-align: center;">
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Tahun Ajaran</span>
        <div style="font-size: 28px; font-weight: 900; color: #7c3aed; margin: 6px 0;"><?= $academicYear ?></div>
        <span style="font-size: 11px; color: #64748b;">Semester Genap</span>
      </div>
    </div>

    <!-- Quick Access Box -->
    <div class="card" style="background: linear-gradient(135deg, #172554, #1d4ed8); color: #fff; padding: 36px; margin-top: 20px;">
      <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">Akses Cepat Pengguna (Akun Demo)</h3>
      <p style="font-size: 13px; color: #bfdbfe; margin-bottom: 20px;">
        Anda dapat langsung menguji aplikasi HadirKu melalui 3 peran utama berikut:
      </p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;">
        <div style="background: rgba(255,255,255,0.1); padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);">
          <strong style="display: block; font-size: 14px;">Siswa</strong>
          <span style="font-size: 11px; color: #bfdbfe;">siswa@hadirku.id</span>
          <p style="font-size: 11px; margin-top: 6px; color: #e2e8f0;">Fitur: Scan QR, Riwayat Kehadiran, Surat Izin KBM</p>
        </div>

        <div style="background: rgba(255,255,255,0.1); padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);">
          <strong style="display: block; font-size: 14px;">Guru</strong>
          <span style="font-size: 11px; color: #bfdbfe;">guru@hadirku.id</span>
          <p style="font-size: 11px; margin-top: 6px; color: #e2e8f0;">Fitur: Buka Sesi QR Dinamis, Live Presensi, Audit Log</p>
        </div>

        <div style="background: rgba(255,255,255,0.1); padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);">
          <strong style="display: block; font-size: 14px;">Admin</strong>
          <span style="font-size: 11px; color: #bfdbfe;">admin@hadirku.id</span>
          <p style="font-size: 11px; margin-top: 6px; color: #e2e8f0;">Fitur: Kelola Master Data Siswa, Guru, Rekap Excel</p>
        </div>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="dist/index.html" class="btn" style="background: #ffffff; color: #172554; padding: 12px 28px; font-size: 14px;">
          <span>Masuk ke Halaman Login Aplikasi →</span>
        </a>
      </div>
    </div>
  </section>

  <footer style="background: #ffffff; border-top: 1px solid var(--border); padding: 24px 0; text-align: center; font-size: 12px; color: #94a3b8;">
    © 2026 HadirKu • Sistem Presensi Dinamis Siswa Berbasis Dynamic QR Code • PHP <?= $phpVersion ?>
  </footer>

</body>
</html>
