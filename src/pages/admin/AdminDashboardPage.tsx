import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ShieldCheck } from 'lucide-react';
import { AdminShell } from '../../components/AdminShell';
import {
  AuditLogEntry,
  ChainStatusInfo,
  ChainVerificationResult,
} from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR } from '../../utils/format';

interface AdminOverviewPayload {
  kpis: {
    totalCustomers: number;
    totalTransactions: number;
    totalSavings: number;
    totalVolume: number;
    pendingTransactions: number;
    blockchainVerifiedRecords: number;
  };
  charts: {
    monthlyAnalytics: { month: string; volume: number; savings: number; count: number }[];
    dailyActivity: { day: string; transactions: number; amount: number }[];
    savingsGrowth: { month: string; totalSavings: number }[];
    customerGrowth: { month: string; customers: number }[];
    statusBreakdown: { status: string; count: number; volume: number }[];
  };
  chainStatus: ChainStatusInfo;
  chainVerification: ChainVerificationResult;
  recentAuditLogs: AuditLogEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  Successful: '#059669',
  Pending: '#D97706',
  Failed: '#DC2626',
  Cancelled: '#64748B',
};

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<AdminOverviewPayload>('/api/admin/overview')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <AdminShell pageTitle="Executive Dashboard">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl" />
          ))}
        </div>
      </AdminShell>
    );
  }

  const { kpis, charts, chainStatus, chainVerification, recentAuditLogs } = data;

  return (
    <AdminShell
      pageTitle="Executive Dashboard"
      breadcrumb="Admin Console / Overview"
      headerAction={
        <Link
          to="/admin/blockchain"
          className="px-4 py-2 rounded-lg bg-[#0A1628] text-white text-xs sm:text-sm font-semibold hover:bg-[#11223D] whitespace-nowrap"
        >
          Blockchain Monitor
        </Link>
      }
    >
      {/* Integrity Strip */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-[#0A1628] text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">{chainStatus.mode}</strong> ·{' '}
            {chainVerification.valid
              ? `All ${chainVerification.verifiedBlocks} blocks cryptographically verified.`
              : `${chainVerification.tamperedBlocks.length} tampered block(s) flagged!`}
          </span>
        </div>
        <span className="font-mono text-emerald-400">
          Head Block #{chainStatus.latestBlockNumber}
        </span>
      </div>

      {/* 6 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Total Customers</div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
            {kpis.totalCustomers}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Demo Transactions</div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
            {kpis.totalTransactions}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Total Savings</div>
          <div className="mt-2 font-mono tabular-nums text-xl font-bold text-emerald-700">
            {formatINR(kpis.totalSavings, false)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Transaction Volume</div>
          <div className="mt-2 font-mono tabular-nums text-xl font-bold text-[#0A1628]">
            {formatINR(kpis.totalVolume, false)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Pending Reviews</div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-amber-600">
            {kpis.pendingTransactions}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Verified Records</div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-emerald-700">
            {kpis.blockchainVerifiedRecords}
          </div>
        </div>
      </div>

      {/* Charts Row 1: Monthly Analytics + Daily Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0A1628] mb-1">
            Monthly Transaction Analytics
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Cleared INR volume vs. automatic savings sweeps
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(val) => formatINR(Number(val ?? 0))} />
                <Bar dataKey="volume" name="Volume" fill="#0A1628" radius={[4, 4, 0, 0]} />
                <Bar dataKey="savings" name="Auto-Savings" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0A1628] mb-1">
            Daily Transaction Activity (14 Days)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Daily transaction volume across all demo accounts
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(val) => formatINR(Number(val ?? 0))} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Daily Amount"
                  stroke="#0A1628"
                  fill="#CBD5E1"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Savings Growth + Customer Growth + Transaction Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0A1628] mb-1">
            Savings Growth
          </h2>
          <p className="text-xs text-slate-500 mb-4">Cumulative vault corpus</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.savingsGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(val) => formatINR(Number(val ?? 0))} />
                <Area
                  type="monotone"
                  dataKey="totalSavings"
                  name="Total Savings"
                  stroke="#059669"
                  fill="#D1FAE5"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0A1628] mb-1">
            Customer Registrations
          </h2>
          <p className="text-xs text-slate-500 mb-4">Cumulative active profiles</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="customers"
                  name="Customers"
                  stroke="#0A1628"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0A1628] mb-1">
            Transaction Status Breakdown
          </h2>
          <p className="text-xs text-slate-500 mb-4">Count by settlement status</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {charts.statusBreakdown.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] || '#64748B'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            {charts.statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-slate-600">{s.status}</span>
                <span className="font-mono font-semibold text-[#0A1628]">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#0A1628]">
            Recent Governance & Audit Events
          </h2>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            View All Logs
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentAuditLogs.map((log) => (
            <div
              key={log.id}
              className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-mono font-semibold text-[#0A1628]">
                  {log.action}
                </span>
                <span className="text-slate-400 mx-2">·</span>
                <span className="text-slate-700">{log.details}</span>
              </div>
              <div className="text-slate-500 whitespace-nowrap shrink-0">
                {log.actorName} · {formatDateTime(log.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
