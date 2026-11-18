import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { useAuth } from '../../context/AuthContext';

export function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginCustomer, demoCustomerLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginCustomer(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await demoCustomerLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Customer Banking Portal</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0A1628]">
            Sign in to BLOCKBANK
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Access your Rupee accounts, automatic savings rules, and blockchain audit trail.
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav.mehta@example.in"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0A1628] text-white text-sm font-semibold hover:bg-[#11223D] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-200 space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch Demo Customer Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-center text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Register for a Demo Account
              </Link>
            </p>
            <p className="text-xs text-center text-slate-500">
              Administrator?{' '}
              <Link
                to="/admin/login"
                className="font-semibold text-[#0A1628] hover:underline"
              >
                Go to Admin Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
