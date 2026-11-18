import React from 'react';
import {
  ArrowLeftRight,
  Bell,
  Blocks,
  CreditCard,
  History,
  LayoutDashboard,
  PiggyBank,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout, SidebarNavItem } from './DashboardLayout';

interface CustomerShellProps {
  pageTitle: string;
  breadcrumb?: string;
  headerAction?: React.ReactNode;
  unreadCount?: number;
  children: React.ReactNode;
}

export function CustomerShell({
  pageTitle,
  breadcrumb = 'Customer Portal',
  headerAction,
  unreadCount,
  children,
}: CustomerShellProps) {
  const { customer, logoutCustomer } = useAuth();

  const navItems: SidebarNavItem[] = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Accounts', to: '/dashboard/accounts', icon: CreditCard },
    { label: 'Transactions', to: '/dashboard/transactions', icon: History },
    { label: 'Money Transfer', to: '/dashboard/transfer', icon: ArrowLeftRight },
    { label: 'Auto Savings', to: '/dashboard/savings', icon: PiggyBank },
    { label: 'Blockchain Audit', to: '/dashboard/blockchain', icon: Blocks },
    { label: 'Profile', to: '/dashboard/profile', icon: User },
    {
      label: 'Notifications',
      to: '/dashboard/notifications',
      icon: Bell,
      badge: unreadCount,
    },
  ];

  return (
    <DashboardLayout
      portalTitle="Customer"
      userName={customer?.fullName || 'Customer'}
      userSubtitle={customer?.accountTier || 'Banking Account'}
      navItems={navItems}
      onLogout={logoutCustomer}
      logoutRedirect="/login"
      pageTitle={pageTitle}
      breadcrumb={breadcrumb}
      headerAction={headerAction}
    >
      {children}
    </DashboardLayout>
  );
}
