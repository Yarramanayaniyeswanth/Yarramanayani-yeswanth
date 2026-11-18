import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

export interface SidebarNavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DashboardLayoutProps {
  portalTitle: string;
  userName: string;
  userSubtitle: string;
  navItems: SidebarNavItem[];
  onLogout: () => Promise<void>;
  logoutRedirect: string;
  pageTitle: string;
  breadcrumb: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  portalTitle,
  userName,
  userSubtitle,
  navItems,
  onLogout,
  logoutRedirect,
  pageTitle,
  breadcrumb,
  headerAction,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    await onLogout();
    navigate(logoutRedirect);
  };

  const renderNavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 h-16 flex items-center justify-between border-b border-white/10 shrink-0">
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap"
        >
          BLOCKBANK
        </Link>
        <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">
          {portalTitle}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={
                item.to === '/dashboard' || item.to === '/admin/dashboard'
              }
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="font-mono tabular-nums text-xs font-semibold text-emerald-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
        <div className="px-2">
          <div className="text-sm font-semibold text-white truncate">
            {userName}
          </div>
          <div className="text-xs text-slate-400 truncate">{userSubtitle}</div>
        </div>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors min-h-[40px]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F4F6F9] text-[#0A1628]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0A1628] text-white z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-[#0A1628] text-white h-full z-10 flex flex-col">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="absolute top-3 right-3 p-2 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {renderNavContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">{breadcrumb}</div>
              <h1 className="font-display text-lg font-bold text-[#0A1628] truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          {headerAction && (
            <div className="shrink-0 flex items-center gap-3">
              {headerAction}
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
