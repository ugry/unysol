import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import MainLayout from '@/components/MainLayout';
import DashboardHome from '@/pages/DashboardHome';
import TrucksPage from '@/pages/TrucksPage';
import TripsPage from '@/pages/TripsPage';
import CustomersPage from '@/pages/CustomersPage';
import InvoicesPage from '@/pages/InvoicesPage';
import ExpensesPage from '@/pages/ExpensesPage';
import CekSenetPage from '@/pages/CekSenetPage';
import EmployeesPage from '@/pages/EmployeesPage';
import PredictionsPage from '@/pages/PredictionsPage';
import TiresPage from '@/pages/TiresPage';
import AllowancesPage from '@/pages/AllowancesPage';
import CustomerPortalPage from '@/pages/CustomerPortalPage';
import CarbonTrackingPage from '@/pages/CarbonTrackingPage';
import KvkkPage from '@/pages/KvkkPage';
import ExportPage from '@/pages/ExportPage';
import PayslipsPage from '@/pages/PayslipsPage';
import DriverPerfPage from '@/pages/DriverPerfPage';
import ContractsPage from '@/pages/ContractsPage';
import ProposalsPage from '@/pages/ProposalsPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { Loader2 } from 'lucide-react';
import ActionsPage from '@/pages/ActionsPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import HelpPage from '@/pages/HelpPage';
import FuelLogPage from '@/pages/FuelLogPage';
import MaintenancePage from '@/pages/MaintenancePage';
import TrailersPage from '@/pages/TrailersPage';
import TollLogsPage from '@/pages/TollLogsPage';
import DriverLeavePage from '@/pages/DriverLeavePage';
import LoadBoardPage from '@/pages/LoadBoardPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#08090a]">
        <Loader2 className="animate-spin text-[#FF5F03]" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyEmailPage />} />
      <Route path="/yardim" element={<HelpPage />} />
      <Route path="/kvkk" element={<KvkkPage />} />
      <Route path="/kullanim-kosullari" element={<TermsPage />} />
      <Route path="/gizlilik-politikasi" element={<PrivacyPage />} />
      <Route path="/cerez-politikasi" element={<PrivacyPage />} />

      {/* Admin Routes — separate from tenant layout */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/*"
        element={
          <SuperAdminRoute>
            <AdminDashboard />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <SuperAdminRoute>
            <AdminDashboard />
          </SuperAdminRoute>
        }
      />

      {/* Tenant Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/trucks" element={<TrucksPage />} />
        <Route path="/dashboard/trailers" element={<TrailersPage />} />
        <Route path="/dashboard/trips" element={<TripsPage />} />
        <Route path="/dashboard/customers" element={<CustomersPage />} />
        <Route path="/dashboard/invoices" element={<InvoicesPage />} />
        <Route path="/dashboard/cek-senet" element={<CekSenetPage />} />
        <Route path="/dashboard/load-board" element={<LoadBoardPage />} />
        <Route path="/dashboard/expenses" element={<ExpensesPage />} />
        <Route path="/dashboard/employees" element={<EmployeesPage />} />
        <Route path="/dashboard/fuel-logs" element={<FuelLogPage />} />
        <Route path="/dashboard/toll-logs" element={<TollLogsPage />} />
        <Route path="/dashboard/maintenance" element={<MaintenancePage />} />
        <Route path="/dashboard/driver-leave" element={<DriverLeavePage />} />
        <Route path="/dashboard/predictions" element={<PredictionsPage />} />
        <Route path="/dashboard/tires" element={<TiresPage />} />
        <Route path="/dashboard/allowances" element={<AllowancesPage />} />
        <Route path="/dashboard/customer-portal" element={<CustomerPortalPage />} />
        <Route path="/dashboard/carbon" element={<CarbonTrackingPage />} />
        <Route path="/dashboard/export" element={<ExportPage />} />
        <Route path="/dashboard/payslips" element={<PayslipsPage />} />
        <Route path="/dashboard/driver-performance" element={<DriverPerfPage />} />
        <Route path="/dashboard/contracts" element={<ContractsPage />} />
        <Route path="/dashboard/proposals" element={<ProposalsPage />} />
        <Route path="/dashboard/reports" element={<ReportsPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/dashboard/actions" element={<ActionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
