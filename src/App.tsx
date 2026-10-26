import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

// Pages
import LoginPage from './pages/LoginPage';
import PortfolioPage from './pages/PortfolioPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageClasses from './pages/admin/ManageClasses';
import AdminReports from './pages/admin/AdminReports';

// Teacher Pages
import TeacherDashboard from './pages/guru/TeacherDashboard';
import TeacherClasses from './pages/guru/TeacherClasses';
import TeacherSessions from './pages/guru/TeacherSessions';
import TeacherReports from './pages/guru/TeacherReports';

// Student Pages
import StudentDashboard from './pages/siswa/StudentDashboard';
import StudentScan from './pages/siswa/StudentScan';
import StudentHistory from './pages/siswa/StudentHistory';

function RootRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user || !profile) return <Navigate to="/login" replace />;

  const routes = {
    admin: '/admin',
    guru: '/guru',
    siswa: '/siswa',
  };

  return <Navigate to={routes[profile.role] || '/login'} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/portofolio" element={<PortfolioPage />} />
          <Route path="/portfolio" element={<Navigate to="/portofolio" replace />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="siswa" element={<ManageStudents />} />
            <Route path="guru" element={<ManageTeachers />} />
            <Route path="kelas" element={<ManageClasses />} />
            <Route path="laporan" element={<AdminReports />} />
          </Route>

          {/* Teacher (Guru) Routes */}
          <Route
            path="/guru"
            element={
              <ProtectedRoute allowedRoles={['guru']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="kelas" element={<TeacherClasses />} />
            <Route path="sesi" element={<TeacherSessions />} />
            <Route path="rekap" element={<TeacherReports />} />
          </Route>

          {/* Student (Siswa) Routes */}
          <Route
            path="/siswa"
            element={
              <ProtectedRoute allowedRoles={['siswa']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="scan" element={<StudentScan />} />
            <Route path="riwayat" element={<StudentHistory />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  );
}
