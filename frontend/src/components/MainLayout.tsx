import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  const title = pageTitles[location.pathname] || 'Logisol';

  return (
    <div className="flex h-screen bg-[#08090a] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0 border-b border-[rgba(255,255,255,0.05)]">
          <h1 className="text-sm font-[510] text-[#f7f8f8] tracking-tight">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#8a8f98] hidden sm:block">
              {user?.firma_unvani}
            </span>
            <div className="w-7 h-7 rounded-full bg-[#FF5F03] flex items-center justify-center text-white text-xs font-[510]">
              {user?.firma_unvani?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
