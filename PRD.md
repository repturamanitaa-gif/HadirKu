# Product Requirements Document (PRD)
## HadirKu — Sistem Presensi Siswa Berbasis QR Code Dinamis & Multi-Platform (PWA & Hybrid Android)

---

### 1. Ringkasan Eksekutif & Tujuan Produk
**HadirKu** adalah aplikasi presensi sekolah modern yang dirancang untuk mempermudah pencatatan kehadiran siswa secara akurat, cepat, dan transparan. Aplikasi ini menghilangkan kecurangan (titip absen) menggunakan teknologi **QR Code Dinamis Berbatas Waktu**, serta dapat diakses melalui berbagai perangkat dengan arsitektur **Hybrid App (Capacitor)** dan **Progressive Web App (PWA)**.

---

### 2. Pilar Arsitektur & Teknologi

| Aspek | Spesifikasi Teknis | Implementasi Nyata |
| :--- | :--- | :--- |
| **Frontend Web** | React 19 + TypeScript + Vite + Tailwind CSS | Single Page Application (SPA), performa rendering instan. |
| **PWA (Progressive Web App)** | Web App Manifest (`manifest.webmanifest`), Service Worker v2 (`sw.js`), Cache-First Static Assets, App Icons (192px & 512px). | Dapat diinstal langsung dari browser Chrome/Edge/Safari (tombol *Install App* di layar utama/homescreen), offline-resilient cache. |
| **Hybrid Android** | Apache Cordova / Capacitor 8 (`@capacitor/android`, `@capacitor/core`, `@capacitor/cli`) | Folder proyek `/android` native siap kompilasi APK, bridge akses izin perangkat keras Kamera (`CAMERA`, `CAMERA_AUTOFOCUS`). |
| **Database & Auth** | Google Firebase (Firestore Database + Firebase Authentication) | Real-time listeners, role-based authorization, secure collection group. |
| **Automated Build (CI/CD)** | GitHub Actions (`.github/workflows/build-apk.yml`) | Kompilasi APK otomatis di cloud tanpa perlu instalasi Android Studio lokal. |

---

### 3. Matriks Kebutuhan Fungsional (Functional Requirements)

#### FR-01: Multi-Role Authentication & Access Control
- Pengguna login menggunakan kredensial email/ID dan password.
- Sistem mengidentifikasi 3 role utama:
  - **Admin**: Hak penuh kelola master data (guru, siswa, rombel kelas) dan rekap institusi.
  - **Guru**: Hak kelola kelas binaan, pembuatan sesi presensi QR dinamis, dan pemantauan absensi real-time.
  - **Siswa**: Hak melakukan pemindaian QR absensi dan memeriksa riwayat kehadiran mandiri.

#### FR-02: Pembuatan Sesi Presensi & Dynamic QR Code
- Guru dapat membuat sesi presensi baru dengan parameter:
  - Pilihan kelas/rombel.
  - Jam mulai & batas toleransi keterlambatan (misal: 15 menit).
  - Masa berlaku QR Code dinamis (refresh token otomatis setiap 15–30 detik) untuk mencegah tangkapan layar/titip absen.

#### FR-03: Pemindaian QR & Validasi Presensi (Siswa)
- Siswa mengarahkan kamera perangkat melalui modul pemindai barcode (`@yudiel/react-qr-scanner`).
- Algoritma validasi berlapis:
  1. *Token Hash Check*: Memastikan token QR cocok dengan sesi aktif guru saat itu.
  2. *Membership Check*: Memastikan siswa resmi terdaftar dalam rombel kelas yang bersangkutan.
  3. *Single-Entry Check*: Mencegah duplikasi absen pada sesi yang sama.
  4. *Time Classification*: Menetapkan status **Hadir** (sebelum toleransi) atau **Terlambat** (setelah toleransi).

#### FR-04: Manajemen Data Master Akademik (Admin)
- Admin memiliki antarmuka khusus untuk:
  - Menambah, mengedit, menonaktifkan akun guru dan siswa.
  - Mengelola rombongan belajar (X, XI, XII) dan menetapkan wali kelas.
  - Mengunduh rekapitulasi sekolah dalam format spreadsheet (CSV/Excel).

#### FR-05: Aksesibilitas Hybrid & PWA
- Dapat diinstal di desktop/laptop via PWA.
- Dapat diinstal di smartphone Android via paket instalasi APK (Capacitor).
- Tampilan antarmuka responsif yang menyesuaikan ukuran layar secara elegan (desktop, tablet, mobile).

---

### 4. Standar Desain & Antarmuka (UI/UX)
- **Palet Warna Resmi**:
  - *Royal Blue* (`#2563EB`): Tombol aksi utama, elemen interaktif, tab aktif.
  - *Deep Navy* (`#172554`): Identitas sidebar, header branding, judul kontras tinggi.
  - *Soft Lavender* (`#E8EDFF`): Latar ikon metrik, aksen lembut.
  - *Clean Canvas* (`#F5F7FB`): Latar belakang aplikasi yang sejuk dan tidak melelahkan mata.
- **Komponen Kartu**: Memiliki lengkungan `rounded-2xl` (16px), border tipis abu-abu muda (`#E2E8F0`), dan elevasi bayangan halus (`shadow-sm`) untuk kesan profesional dan rapi.
