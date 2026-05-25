import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Users,
  FileText,
  CreditCard,
  DollarSign,
  UserCheck,
  TrendingUp,
  Settings,
  Package,
  LogOut,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Ana Panel', icon: LayoutDashboard },
  { path: '/dashboard/trucks', label: 'Kamyonlar', icon: Truck },
  { path: '/dashboard/trips', label: 'Seferler', icon: MapPin },
  { path: '/dashboard/load-board', label: 'Yük Panosu', icon: Package },
  { path: '/dashboard/customers', label: 'Müşteriler', icon: Users },
  { path: '/dashboard/invoices', label: 'Faturalar', icon: FileText },
  { path: '/dashboard/cek-senet', label: 'Çek/Senet', icon: CreditCard },
  { path: '/dashboard/expenses', label: 'Giderler', icon: DollarSign },
  { path: '/dashboard/employees', label: 'Personel', icon: UserCheck },
  { path: '/dashboard/predictions', label: 'Tahminler', icon: TrendingUp },
  { path: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 bg-[#0f1011] border-r border-[rgba(255,255,255,0.05)] flex flex-col h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[rgba(255,255,255,0.05)]">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5"
        >
          <div className="w-7 h-7 bg-[#FF5F03] rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-[590] text-xs leading-none">L</span>
          </div>
          <span className="text-[#f7f8f8] font-[510] text-base tracking-tight">
            Logisol
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-[510] transition-colors duration-150 ${
                isActive
                  ? 'text-[#FF5F03] bg-[#FF5F03]-bg border-l-[2px] border-[#FF5F03]'
                  : 'text-[#8a8f98] hover:text-[#d0d6e0] hover:bg-[rgba(255,255,255,0.02)] border-l-[2px] border-transparent'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-7 h-7 rounded-full bg-[#FF5F03] flex items-center justify-center text-white text-xs font-[510] flex-shrink-0">
            {user?.firma_unvani?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-[#d0d6e0] font-[510] truncate">
              {user?.firma_unvani || 'Kullanıcı'}
            </div>
            <div className="text-[11px] text-[#62666d] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 text-[13px] text-[#8a8f98] hover:text-[#DC2626] transition-colors py-1 rounded-md hover:bg-[#DC2626]/5 px-2 -mx-2"
        >
          <LogOut size={14} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
