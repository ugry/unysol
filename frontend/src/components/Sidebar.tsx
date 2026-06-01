import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
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
  Globe,
  LogOut,
  Fuel,
  Wrench,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Ana Panel', icon: LayoutDashboard, moduleKey: 'dashboard' },
  { path: '/dashboard/trucks', label: 'Kamyonlar', icon: Truck, moduleKey: 'truck_tracking' },
  { path: '/dashboard/trailers', label: 'Dorseler', icon: Truck, moduleKey: 'trailer_mgmt' },
  { path: '/dashboard/trips', label: 'Seferler', icon: MapPin, moduleKey: 'trip_mgmt' },
  { path: '/dashboard/load-board', label: 'Yük Panosu', icon: Package, moduleKey: 'load_board' },
  { path: '/dashboard/customers', label: 'Müşteriler', icon: Users, moduleKey: 'customer_mgmt' },
  { path: '/dashboard/invoices', label: 'Faturalar', icon: FileText, moduleKey: 'invoice_mgmt' },
  { path: '/dashboard/cek-senet', label: 'Çek/Senet', icon: CreditCard, moduleKey: 'cek_senet' },
  { path: '/dashboard/expenses', label: 'Giderler', icon: DollarSign, moduleKey: 'expense_tracking' },
  { path: '/dashboard/fuel-logs', label: 'Yakıt Takip', icon: Fuel, moduleKey: 'fuel_logging' },
  { path: '/dashboard/toll-logs', label: 'HGS Takip', icon: CreditCard, moduleKey: 'toll_tracking' },
  { path: '/dashboard/maintenance', label: 'Bakım', icon: Wrench, moduleKey: 'maintenance' },
  { path: '/dashboard/driver-leave', label: 'İzin Takvimi', icon: UserCheck, moduleKey: 'driver_leave' },
  { path: '/dashboard/employees', label: 'Personel', icon: UserCheck, moduleKey: 'employee_mgmt' },
  { path: '/dashboard/predictions', label: 'Tahminler', icon: TrendingUp, moduleKey: 'predictions' },
  { path: '/dashboard/settings', label: 'Ayarlar', icon: Settings, moduleKey: 'settings' },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [permittedModules, setPermittedModules] = useState<Set<string> | null>(null);

  useEffect(() => {
    // TENANT_OWNER sees all modules
    if (user?.role === 'TENANT_OWNER') {
      setPermittedModules(null); // null = show all
      return;
    }

    api.get('/api/tenant/my-permissions').then(r => {
      if (r.data?.all_access) {
        setPermittedModules(null);
        return;
      }
      const perms = r.data?.permissions;
      if (Array.isArray(perms)) {
        const allowed = new Set<string>();
        perms.forEach((p: any) => {
          if (p.can_view) allowed.add(p.module_key);
        });
        setPermittedModules(allowed);
      }
    }).catch(() => {
      setPermittedModules(null); // on error, show all
    });
  }, [user]);

  const filteredItems = permittedModules === null
    ? navItems
    : navItems.filter(item => item.moduleKey === 'dashboard' || permittedModules.has(item.moduleKey));

  const toggleLanguage = () => {
    const next = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(next);
  };

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
            Unysol
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onNavigate?.(); }}
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

      {/* Language switcher */}
      <div className="px-3 py-2">
        <button onClick={toggleLanguage}
          className="w-full flex items-center gap-2 text-[13px] text-[#8a8f98] hover:text-[#d0d6e0] transition-colors py-1.5 rounded-md hover:bg-[rgba(255,255,255,0.05)] px-2">
          <Globe size={14} />
          {i18n.language === 'tr' ? 'TR → EN' : 'EN → TR'}
        </button>
      </div>

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
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
