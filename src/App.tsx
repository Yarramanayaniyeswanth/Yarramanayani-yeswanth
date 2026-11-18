import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { CustomerLoginPage } from './pages/public/CustomerLoginPage';
import { HomePage } from './pages/public/HomePage';
import { RegisterPage } from './pages/public/RegisterPage';
import { SecurityPage } from './pages/public/SecurityPage';
import { ServicesPage } from './pages/public/ServicesPage';
import { CustomerAccountsPage } from './pages/customer/CustomerAccountsPage';
import { CustomerBlockchainPage } from './pages/customer/CustomerBlockchainPage';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { CustomerNotificationsPage } from './pages/customer/CustomerNotificationsPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { CustomerSavingsPage } from './pages/customer/CustomerSavingsPage';
import { CustomerTransactionsPage } from './pages/customer/CustomerTransactionsPage';
import { CustomerTransferPage } from './pages/customer/CustomerTransferPage';
import { AdminAccountsPage } from './pages/admin/AdminAccountsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminBlockchainPage } from './pages/admin/AdminBlockchainPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSavingsPage } from './pages/admin/AdminSavingsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';

function RequireCustomer({ children }: { children: React.ReactNode }) {
  const { loading, role } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9] text-sm text-slate-600">
        Verifying customer session...
      </div>
    );
  }
  if (role !== 'customer') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, role } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060E1A] text-sm text-slate-300">
        Verifying administrator authorization...
      </div>
    );
  }
  if (role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<CustomerLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer Portal Routes */}
          <Route
            path="/dashboard"
            element={
              <RequireCustomer>
                <CustomerDashboardPage />
              </RequireCustomer>
            }
          />
          <Route
            path="/dashboard/accounts"
            element={
              <RequireCustomer>
                <CustomerAccountsPage />
              </RequireCustomer>
            }
          />
          <Route
            path="/dashboard/transactions"
            element={
              <RequireCustomer>
                <CustomerTransactionsPage />
              </RequireCustomer>
            }
          />
          <Route
            path="/dashboard/transfer"
            element={
              <RequireCustomer>
                <CustomerTransferPage />
              </RequireCustomer>
            }
          />
          <Route
            path="/dashboard/savings"
            element={
              <RequireCustomer>
                <CustomerSavingsPage />
              </RequireCustomer>
            }
          />
          <Route
            path="/dashboard/blockchain"
            element={
              <RequireCustomer>
                <CustomerBlockchainPage />
              </RequireCustomer>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <RequireCustomer>
                <CustomerProfilePage />
              </RequireCustomer>
            }
          />
          <Route
            path="/dashboard/notifications"
            element={
              <RequireCustomer>
                <CustomerNotificationsPage />
              </RequireCustomer>
            }
          />

          {/* Separate Admin Console Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAdmin>
                <AdminDashboardPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <RequireAdmin>
                <AdminCustomersPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/accounts"
            element={
              <RequireAdmin>
                <AdminAccountsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <RequireAdmin>
                <AdminTransactionsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/savings"
            element={
              <RequireAdmin>
                <AdminSavingsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/blockchain"
            element={
              <RequireAdmin>
                <AdminBlockchainPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RequireAdmin>
                <AdminAuditLogsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireAdmin>
                <AdminReportsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <RequireAdmin>
                <AdminNotificationsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAdmin>
                <AdminSettingsPage />
              </RequireAdmin>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
