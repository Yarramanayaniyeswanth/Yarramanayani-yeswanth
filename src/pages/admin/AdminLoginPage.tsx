import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060E1A] flex flex-col justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-xl font-bold text-white tracking-tight"
          >
            BLOCKBANK
          </Link>
          <Link
            to="/login"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Customer Portal
          </Link>
        </div>

        <div className="bg-[#0A1628] border border-white/15 rounded-xl p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Isolated Governance Console</span>
          </div>
          <h1 className="font-display text-2xl font-bold">
            Administrator Sign In
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Authorized personnel only. All administrative sessions and actions are recorded in the append-only audit log.
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@blockbank.in"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#060E1A] border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#060E1A] border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying Credentials...' : 'Enter Admin Console'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
