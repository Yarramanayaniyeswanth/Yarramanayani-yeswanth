import React from 'react';
import {
  Activity,
  Bell,
  Blocks,
  CreditCard,
  FileBarChart2,
  History,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout, SidebarNavItem } from './DashboardLayout';

interface AdminShellProps {
  pageTitle: string;
  breadcrumb?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({
  pageTitle,
  breadcrumb = 'Admin Console',
  headerAction,
  children,
}: AdminShellProps) {
  const { admin, logoutAdmin } = useAuth();

  const navItems: SidebarNavItem[] = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Customers', to: '/admin/customers', icon: Users },
    { label: 'Accounts', to: '/admin/accounts', icon: CreditCard },
    { label: 'Transactions', to: '/admin/transactions', icon: History },
    { label: 'Automatic Savings', to: '/admin/savings', icon: PiggyBank },
    { label: 'Blockchain Explorer', to: '/admin/blockchain', icon: Blocks },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: Activity },
    { label: 'Reports', to: '/admin/reports', icon: FileBarChart2 },
    { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    { label: 'Admin Settings', to: '/admin/settings', icon: Settings },
  ];

  return (
    <DashboardLayout
      portalTitle="Admin"
      userName={admin?.fullName || 'Administrator'}
      userSubtitle={admin?.roleTitle || 'Compliance Admin'}
      navItems={navItems}
      onLogout={logoutAdmin}
      logoutRedirect="/admin/login"
      pageTitle={pageTitle}
      breadcrumb={breadcrumb}
      headerAction={headerAction}
    >
      {children}
    </DashboardLayout>
  );
}
