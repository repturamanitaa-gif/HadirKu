import type { UserProfile, ClassData, AttendanceSession, AttendanceRecord } from '../types';

export const INITIAL_STUDENTS: UserProfile[] = [
  // Kelas X IPA 1
  {
    uid: 'demo-siswa-uid',
    name: 'Muhammad Rizky Pratama',
    email: 'siswa@hadirku.id',
    nis: '20241001',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-2',
    name: 'Adinda Putri Maharani',
    email: 'adinda.putri@hadirku.id',
    nis: '20241002',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-3',
    name: 'Bima Arya Pangestu',
    email: 'bima.arya@hadirku.id',
    nis: '20241003',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-4',
    name: 'Cantika Dewi Larasati',
    email: 'cantika.dewi@hadirku.id',
    nis: '20241004',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-5',
    name: 'Dimas Wahyu Nugroho',
    email: 'dimas.wahyu@hadirku.id',
    nis: '20241005',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-6',
    name: 'Fadhil Ihsan Ramadhan',
    email: 'fadhil.ihsan@hadirku.id',
    nis: '20241006',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-7',
    name: 'Gita Syahrani',
    email: 'gita.syahrani@hadirku.id',
    nis: '20241007',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-8',
    name: 'Hafiz Danendra',
    email: 'hafiz.danendra@hadirku.id',
    nis: '20241008',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-9',
    name: 'Indah Kusuma Wardani',
    email: 'indah.kusuma@hadirku.id',
    nis: '20241009',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-10',
    name: 'Kevin Jonathan Siregar',
    email: 'kevin.jonathan@hadirku.id',
    nis: '20241010',
    className: 'X IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },

  // Kelas X IPS 2
  {
    uid: 'std-11',
    name: 'Lestari Ayu Ningtyas',
    email: 'lestari.ayu@hadirku.id',
    nis: '20242001',
    className: 'X IPS 2',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-12',
    name: 'Mahendra Putra Wicaksana',
    email: 'mahendra.putra@hadirku.id',
    nis: '20242002',
    className: 'X IPS 2',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-13',
    name: 'Nadia Safitri',
    email: 'nadia.safitri@hadirku.id',
    nis: '20242003',
    className: 'X IPS 2',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-14',
    name: 'Oki Pratama Yudha',
    email: 'oki.pratama@hadirku.id',
    nis: '20242004',
    className: 'X IPS 2',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },
  {
    uid: 'std-15',
    name: 'Putri Salsabila',
    email: 'putri.salsabila@hadirku.id',
    nis: '20242005',
    className: 'X IPS 2',
    role: 'siswa',
    active: true,
    createdAt: new Date('2026-07-15T07:30:00Z'),
  },

  // Kelas XI IPA 1
  {
    uid: 'std-16',
    name: 'Rafi Ahmad Fauzan',
    email: 'rafi.fauzan@hadirku.id',
    nis: '20231001',
    className: 'XI IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2025-07-15T07:30:00Z'),
  },
  {
    uid: 'std-17',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@hadirku.id',
    nis: '20231002',
    className: 'XI IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2025-07-15T07:30:00Z'),
  },
  {
    uid: 'std-18',
    name: 'Taufik Hidayatullah',
    email: 'taufik.h@hadirku.id',
    nis: '20231003',
    className: 'XI IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2025-07-15T07:30:00Z'),
  },
  {
    uid: 'std-19',
    name: 'Vanya Aurelia',
    email: 'vanya.aurelia@hadirku.id',
    nis: '20231004',
    className: 'XI IPA 1',
    role: 'siswa',
    active: true,
    createdAt: new Date('2025-07-15T07:30:00Z'),
  },

  // Kelas XII IPA 2
  {
    uid: 'std-20',
    name: 'Wildan Syahreza',
    email: 'wildan.s@hadirku.id',
    nis: '20221001',
    className: 'XII IPA 2',
    role: 'siswa',
    active: true,
    createdAt: new Date('2024-07-15T07:30:00Z'),
  },
  {
    uid: 'std-21',
    name: 'Yasmin Zahra Khairunnisa',
    email: 'yasmin.zahra@hadirku.id',
    nis: '20221002',
    className: 'XII IPA 2',
    role: 'siswa',
    active: true,
    createdAt: new Date('2024-07-15T07:30:00Z'),
  },
  {
    uid: 'std-22',
    name: 'Zaki Mubarak',
    email: 'zaki.mubarak@hadirku.id',
    nis: '20221003',
    className: 'XII IPA 2',
    role: 'siswa',
    active: true,
    createdAt: new Date('2024-07-15T07:30:00Z'),
  },
];

export const INITIAL_TEACHERS: UserProfile[] = [
  {
    uid: 'demo-guru-uid',
    name: 'Drs. Ahmad Fauzi, M.Pd',
    email: 'guru@hadirku.id',
    role: 'guru',
    active: true,
    createdAt: new Date('2024-06-10T08:00:00Z'),
  },
  {
    uid: 'tch-2',
    name: 'Dra. Hj. Ratna Sari, M.Pd',
    email: 'ratna.sari@hadirku.id',
    role: 'guru',
    active: true,
    createdAt: new Date('2024-06-10T08:00:00Z'),
  },
  {
    uid: 'tch-3',
    name: 'Hendra Wijaya, S.Kom, M.T',
    email: 'hendra.w@hadirku.id',
    role: 'guru',
    active: true,
    createdAt: new Date('2025-01-10T08:00:00Z'),
  },
  {
    uid: 'tch-4',
    name: 'Siti Aminah, S.Pd',
    email: 'siti.aminah@hadirku.id',
    role: 'guru',
    active: true,
    createdAt: new Date('2025-02-15T08:00:00Z'),
  },
  {
    uid: 'tch-5',
    name: 'Budi Santoso, S.Si',
    email: 'budi.santoso@hadirku.id',
    role: 'guru',
    active: true,
    createdAt: new Date('2025-03-01T08:00:00Z'),
  },
];

export const INITIAL_CLASSES: ClassData[] = [
  {
    classId: 'cls-1',
    name: 'X IPA 1',
    grade: 'X',
    homeroomTeacher: 'Drs. Ahmad Fauzi, M.Pd',
    studentCount: 32,
    academicYear: '2026/2027',
    teacherIds: ['demo-guru-uid', 'tch-3'],
    active: true,
  },
  {
    classId: 'cls-2',
    name: 'X IPS 2',
    grade: 'X',
    homeroomTeacher: 'Dra. Hj. Ratna Sari, M.Pd',
    studentCount: 30,
    academicYear: '2026/2027',
    teacherIds: ['tch-2', 'demo-guru-uid'],
    active: true,
  },
  {
    classId: 'cls-3',
    name: 'XI IPA 1',
    grade: 'XI',
    homeroomTeacher: 'Hendra Wijaya, S.Kom, M.T',
    studentCount: 31,
    academicYear: '2026/2027',
    teacherIds: ['tch-3', 'tch-5'],
    active: true,
  },
  {
    classId: 'cls-4',
    name: 'XI IPS 1',
    grade: 'XI',
    homeroomTeacher: 'Siti Aminah, S.Pd',
    studentCount: 28,
    academicYear: '2026/2027',
    teacherIds: ['tch-4'],
    active: true,
  },
  {
    classId: 'cls-5',
    name: 'XII IPA 2',
    grade: 'XII',
    homeroomTeacher: 'Budi Santoso, S.Si',
    studentCount: 29,
    academicYear: '2026/2027',
    teacherIds: ['demo-guru-uid', 'tch-5'],
    active: true,
  },
  {
    classId: 'cls-6',
    name: 'XII IPS 1',
    grade: 'XII',
    homeroomTeacher: 'Dra. Hj. Ratna Sari, M.Pd',
    studentCount: 30,
    academicYear: '2026/2027',
    teacherIds: ['tch-2'],
    active: true,
  },
];

// Helper to create dates relative to today
const createTodayDate = (hour: number, minute: number = 0) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

const createPastDate = (daysAgo: number, hour: number, minute: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const INITIAL_SESSIONS: AttendanceSession[] = [
  {
    sessionId: 'ses-today-1',
    classId: 'cls-1',
    className: 'X IPA 1 — Matematika Wajib',
    createdBy: 'demo-guru-uid',
    createdByName: 'Drs. Ahmad Fauzi, M.Pd',
    startsAt: createTodayDate(7, 0),
    endsAt: createTodayDate(8, 30),
    lateThreshold: 15,
    status: 'active',
    tokenHash: 'token-active-hash-01',
  },
  {
    sessionId: 'ses-today-2',
    classId: 'cls-5',
    className: 'XII IPA 2 — Fisika Terapan',
    createdBy: 'demo-guru-uid',
    createdByName: 'Drs. Ahmad Fauzi, M.Pd',
    startsAt: createTodayDate(9, 0),
    endsAt: createTodayDate(10, 30),
    lateThreshold: 15,
    status: 'closed',
    tokenHash: 'token-closed-hash-02',
  },
  {
    sessionId: 'ses-past-1',
    classId: 'cls-1',
    className: 'X IPA 1 — Matematika Wajib',
    createdBy: 'demo-guru-uid',
    createdByName: 'Drs. Ahmad Fauzi, M.Pd',
    startsAt: createPastDate(1, 7, 0),
    endsAt: createPastDate(1, 8, 30),
    lateThreshold: 15,
    status: 'closed',
    tokenHash: 'token-past-hash-03',
  },
  {
    sessionId: 'ses-past-2',
    classId: 'cls-1',
    className: 'X IPA 1 — Biologi',
    createdBy: 'tch-2',
    createdByName: 'Dra. Hj. Ratna Sari, M.Pd',
    startsAt: createPastDate(2, 8, 30),
    endsAt: createPastDate(2, 10, 0),
    lateThreshold: 15,
    status: 'closed',
    tokenHash: 'token-past-hash-04',
  },
  {
    sessionId: 'ses-past-3',
    classId: 'cls-1',
    className: 'X IPA 1 — Informatika & TIK',
    createdBy: 'tch-3',
    createdByName: 'Hendra Wijaya, S.Kom, M.T',
    startsAt: createPastDate(3, 10, 30),
    endsAt: createPastDate(3, 12, 0),
    lateThreshold: 15,
    status: 'closed',
    tokenHash: 'token-past-hash-05',
  },
  {
    sessionId: 'ses-past-4',
    classId: 'cls-1',
    className: 'X IPA 1 — Bahasa Indonesia',
    createdBy: 'tch-4',
    createdByName: 'Siti Aminah, S.Pd',
    startsAt: createPastDate(4, 7, 0),
    endsAt: createPastDate(4, 8, 30),
    lateThreshold: 15,
    status: 'closed',
    tokenHash: 'token-past-hash-06',
  },
  {
    sessionId: 'ses-past-5',
    classId: 'cls-1',
    className: 'X IPA 1 — Kimia Dasar',
    createdBy: 'tch-5',
    createdByName: 'Budi Santoso, S.Si',
    startsAt: createPastDate(5, 7, 30),
    endsAt: createPastDate(5, 9, 0),
    lateThreshold: 15,
    status: 'closed',
    tokenHash: 'token-past-hash-07',
  },
];

// Catatan kehadiran realistis untuk siswa (demo-siswa-uid)
export const INITIAL_STUDENT_ATTENDANCE: AttendanceRecord[] = [
  {
    studentId: 'demo-siswa-uid',
    studentName: 'Muhammad Rizky Pratama',
    className: 'X IPA 1 — Matematika Wajib',
    status: 'hadir',
    checkedAt: createTodayDate(7, 12),
    source: 'qr_scan',
  },
  {
    studentId: 'demo-siswa-uid',
    studentName: 'Muhammad Rizky Pratama',
    className: 'X IPA 1 — Matematika Wajib',
    status: 'hadir',
    checkedAt: createPastDate(1, 7, 8),
    source: 'qr_scan',
  },
  {
    studentId: 'demo-siswa-uid',
    studentName: 'Muhammad Rizky Pratama',
    className: 'X IPA 1 — Biologi',
    status: 'hadir',
    checkedAt: createPastDate(2, 8, 35),
    source: 'qr_scan',
  },
  {
    studentId: 'demo-siswa-uid',
    studentName: 'Muhammad Rizky Pratama',
    className: 'X IPA 1 — Informatika & TIK',
    status: 'terlambat',
    checkedAt: createPastDate(3, 10, 48),
    source: 'qr_scan',
  },
  {
    studentId: 'demo-siswa-uid',
    studentName: 'Muhammad Rizky Pratama',
    className: 'X IPA 1 — Bahasa Indonesia',
    status: 'hadir',
    checkedAt: createPastDate(4, 7, 10),
    source: 'qr_scan',
  },
  {
    studentId: 'demo-siswa-uid',
    studentName: 'Muhammad Rizky Pratama',
    className: 'X IPA 1 — Kimia Dasar',
    status: 'hadir',
    checkedAt: createPastDate(5, 7, 25),
    source: 'qr_scan',
  },
  {
    studentId: 'demo-siswa-uid',
    studentName: 'Muhammad Rizky Pratama',
    className: 'X IPA 1 — Matematika Wajib',
    status: 'hadir',
    checkedAt: createPastDate(6, 7, 11),
    source: 'qr_scan',
  },
  {
    studentId: 'demo-siswa-uid',
    studentName: 'Muhammad Rizky Pratama',
    className: 'X IPA 1 — Bahasa Inggris',
    status: 'hadir',
    checkedAt: createPastDate(7, 8, 40),
    source: 'qr_scan',
  },
];

// Helper Storage
export function getStoredStudents(): UserProfile[] {
  const raw = localStorage.getItem('hadirku_data_students_v3');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].nis) {
        return parsed.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt) }));
      }
    } catch {
      // fallback
    }
  }
  localStorage.setItem('hadirku_data_students_v3', JSON.stringify(INITIAL_STUDENTS));
  return INITIAL_STUDENTS;
}

export function saveStoredStudents(students: UserProfile[]) {
  localStorage.setItem('hadirku_data_students_v3', JSON.stringify(students));
}

export function getStoredTeachers(): UserProfile[] {
  const raw = localStorage.getItem('hadirku_data_teachers_v3');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt) }));
    } catch {
      // fallback
    }
  }
  localStorage.setItem('hadirku_data_teachers_v3', JSON.stringify(INITIAL_TEACHERS));
  return INITIAL_TEACHERS;
}

export function saveStoredTeachers(teachers: UserProfile[]) {
  localStorage.setItem('hadirku_data_teachers_v3', JSON.stringify(teachers));
}

export function getStoredClasses(): ClassData[] {
  const raw = localStorage.getItem('hadirku_data_classes_v3');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].homeroomTeacher) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  localStorage.setItem('hadirku_data_classes_v3', JSON.stringify(INITIAL_CLASSES));
  return INITIAL_CLASSES;
}

export function saveStoredClasses(classes: ClassData[]) {
  localStorage.setItem('hadirku_data_classes_v3', JSON.stringify(classes));
}

export function getStoredSessions(): AttendanceSession[] {
  const raw = localStorage.getItem('hadirku_data_sessions_v3');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].className) {
        return parsed.map((s: any) => ({
          ...s,
          startsAt: new Date(s.startsAt),
          endsAt: new Date(s.endsAt),
        }));
      }
    } catch {
      // fallback
    }
  }
  localStorage.setItem('hadirku_data_sessions_v3', JSON.stringify(INITIAL_SESSIONS));
  return INITIAL_SESSIONS;
}

export function saveStoredSessions(sessions: AttendanceSession[]) {
  localStorage.setItem('hadirku_data_sessions_v3', JSON.stringify(sessions));
}

export function getStoredStudentAttendance(): AttendanceRecord[] {
  const raw = localStorage.getItem('hadirku_data_student_att_v3');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a: any) => ({
          ...a,
          checkedAt: new Date(a.checkedAt),
        }));
      }
    } catch {
      // fallback
    }
  }
  localStorage.setItem('hadirku_data_student_att_v3', JSON.stringify(INITIAL_STUDENT_ATTENDANCE));
  return INITIAL_STUDENT_ATTENDANCE;
}
