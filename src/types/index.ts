// ============================================
// HadirKu — Type Definitions
// ============================================

// --- User Types ---
export type UserRole = 'admin' | 'guru' | 'siswa';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  nis?: string;
  className?: string;
}

// --- Class Types ---
export interface ClassData {
  classId: string;
  name: string;
  grade?: string;
  homeroomTeacher?: string;
  studentCount?: number;
  academicYear: string;
  teacherIds: string[];
  active: boolean;
}

export interface ClassMember {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  joinedAt: Date;
  active: boolean;
}

// --- Session Types ---
export type SessionStatus = 'active' | 'closed';

export interface AttendanceSession {
  sessionId: string;
  classId: string;
  className?: string;
  createdBy: string;
  createdByName?: string;
  startsAt: Date;
  endsAt: Date;
  lateThreshold?: number; // minutes after startsAt to be considered late
  status: SessionStatus;
  tokenHash: string;
  qrToken?: string; // plaintext token (only in memory, not stored)
}

// --- Attendance Types ---
export type AttendanceStatus = 'hadir' | 'terlambat' | 'tidak_hadir';
export type AttendanceSource = 'qr_scan' | 'manual';

export interface AttendanceRecord {
  studentId: string;
  studentName?: string;
  className?: string;
  status: AttendanceStatus;
  checkedAt: Date;
  source: AttendanceSource;
  updatedAt?: Date;
}

// --- Audit Log Types ---
export interface AuditLog {
  logId: string;
  actorUid: string;
  actorName?: string;
  action: string;
  targetId: string;
  reason: string;
  createdAt: Date;
}

// --- QR Payload ---
export interface QRPayload {
  sessionId: string;
  token: string;
  classId: string;
  expiresAt: number; // unix timestamp
}

// --- API Response ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// --- Stats ---
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSessions: number;
  todaySessions: number;
  todayAttendance: number;
}

export interface AttendanceSummary {
  hadir: number;
  terlambat: number;
  tidak_hadir: number;
  total: number;
}
