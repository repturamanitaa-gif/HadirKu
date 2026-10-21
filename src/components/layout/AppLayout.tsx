import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useAuth();

  // Siswa has its own authentic mobile app layout without desktop sidebar/header
  if (profile?.role === 'siswa') {
    return (
      <div className="min-h-screen bg-[#F4F6FB] antialiased">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#202B3C] flex flex-col lg:flex-row antialiased overflow-x-hidden">
      {/* Sidebar Navigation: 230px on desktop */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area filling remaining viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
