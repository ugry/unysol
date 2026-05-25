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
import SettingsPage from '@/pages/SettingsPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { Loader2 } from 'lucide-react';
import ActionsPage from '@/pages/ActionsPage';
import LoadBoardPage from '@/pages/LoadBoardPage';

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
        <Route path="/dashboard/trips" element={<TripsPage />} />
        <Route path="/dashboard/customers" element={<CustomersPage />} />
        <Route path="/dashboard/invoices" element={<InvoicesPage />} />
        <Route path="/dashboard/cek-senet" element={<CekSenetPage />} />
        <Route path="/dashboard/load-board" element={<LoadBoardPage />} />
        <Route path="/dashboard/expenses" element={<ExpensesPage />} />
        <Route path="/dashboard/employees" element={<EmployeesPage />} />
        <Route path="/dashboard/predictions" element={<PredictionsPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
