import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AdminUser, CustomerUser } from '../types';
import { apiRequest } from '../utils/api';

interface AuthState {
  loading: boolean;
  role: 'customer' | 'admin' | null;
  customer: CustomerUser | null;
  admin: AdminUser | null;
  refreshSession: () => Promise<void>;
  loginCustomer: (email: string, password: string) => Promise<void>;
  registerCustomer: (payload: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    accountTier: string;
    password: string;
  }) => Promise<void>;
  demoCustomerLogin: () => Promise<void>;
  logoutCustomer: () => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'customer' | 'admin' | null>(null);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const res = await apiRequest<{
        role: 'customer' | 'admin';
        user?: CustomerUser;
        admin?: AdminUser;
      }>('/api/auth/me');
      setRole(res.role);
      setCustomer(res.role === 'customer' && res.user ? res.user : null);
      setAdmin(res.role === 'admin' && res.admin ? res.admin : null);
    } catch {
      setRole(null);
      setCustomer(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginCustomer = async (email: string, password: string) => {
    const res = await apiRequest<{ user: CustomerUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setRole('customer');
    setCustomer(res.user);
    setAdmin(null);
  };

  const registerCustomer = async (payload: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    accountTier: string;
    password: string;
  }) => {
    const res = await apiRequest<{ user: CustomerUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setRole('customer');
    setCustomer(res.user);
    setAdmin(null);
  };

  const demoCustomerLogin = async () => {
    const res = await apiRequest<{ user: CustomerUser }>(
      '/api/auth/demo-customer',
      { method: 'POST' }
    );
    setRole('customer');
    setCustomer(res.user);
    setAdmin(null);
  };

  const logoutCustomer = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    setRole(null);
    setCustomer(null);
  };

  const loginAdmin = async (email: string, password: string) => {
    const res = await apiRequest<{ admin: AdminUser }>(
      '/api/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    setRole('admin');
    setAdmin(res.admin);
    setCustomer(null);
  };

  const logoutAdmin = async () => {
    await apiRequest('/api/admin/auth/logout', { method: 'POST' });
    setRole(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        role,
        customer,
        admin,
        refreshSession,
        loginCustomer,
        registerCustomer,
        demoCustomerLogin,
        logoutCustomer,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
