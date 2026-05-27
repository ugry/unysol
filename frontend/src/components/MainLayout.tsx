import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Ana Panel',
  '/dashboard/trucks': 'Kamyonlar',
  '/dashboard/trips': 'Seferler',
  '/dashboard/customers': 'Müşteriler',
  '/dashboard/invoices': 'Faturalar',
  '/dashboard/cek-senet': 'Çek/Senet',
  '/dashboard/load-board': 'Yük Panosu',
  '/dashboard/expenses': 'Giderler',
  '/dashboard/employees': 'Personel',
  '/dashboard/predictions': 'Tahminler',
  '/dashboard/settings': 'Ayarlar',
};

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || 'Unysol';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#08090a] overflow-hidden">
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar — overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#8a8f98] hover:text-[#d0d6e0] p-1"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-[510] text-[#f7f8f8] tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#8a8f98] hidden sm:block">
              {user?.firma_unvani}
            </span>
            <div className="w-7 h-7 rounded-full bg-[#FF5F03] flex items-center justify-center text-white text-xs font-[510]">
              {user?.firma_unvani?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
