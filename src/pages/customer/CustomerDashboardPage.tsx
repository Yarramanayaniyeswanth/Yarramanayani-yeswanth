import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, PiggyBank, ShieldCheck } from 'lucide-react';
import { CustomerShell } from '../../components/CustomerShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import {
  BankAccount,
  BankTransaction,
  ChainStatusInfo,
  CustomerUser,
  SavingsRule,
} from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR, truncateHash } from '../../utils/format';

interface DashboardPayload {
  user: CustomerUser;
  summary: {
    totalBalance: number;
    availableBalance: number;
    totalSavings: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    unreadNotifications: number;
  };
  accounts: BankAccount[];
  recentTransactions: BankTransaction[];
  savingsRules: SavingsRule[];
  chainStatus: ChainStatusInfo;
}

export function CustomerDashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<DashboardPayload>('/api/customer/dashboard')
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <CustomerShell pageTitle="Account Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl" />
          ))}
        </div>
      </CustomerShell>
    );
  }

  if (error || !data) {
    return (
      <CustomerShell pageTitle="Account Overview">
        <div className="p-6 bg-white border border-rose-200 rounded-xl text-sm text-rose-700">
          {error || 'Unable to load dashboard.'}
        </div>
      </CustomerShell>
    );
  }

  const { summary, accounts, recentTransactions, savingsRules, chainStatus, user } = data;
  const primaryAccount = accounts[0];

  return (
    <CustomerShell
      pageTitle="Account Overview"
      breadcrumb={`BLOCKBANK · ${user.accountTier}`}
      unreadCount={summary.unreadNotifications}
      headerAction={
        <Link
          to="/dashboard/transfer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-500 transition-colors whitespace-nowrap"
        >
          <span>Send Demo Transfer</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      }
    >
      {/* Disclosure Banner */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-[#0A1628] text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">{chainStatus.mode}:</strong>{' '}
            Test INR balances & cryptographic Keccak-256 ledger active (Latest Block #{chainStatus.latestBlockNumber}).
          </span>
        </div>
        <Link
          to="/dashboard/blockchain"
          className="text-emerald-400 font-semibold hover:underline whitespace-nowrap shrink-0"
        >
          Open Explorer
        </Link>
      </div>

      {/* 5 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Total Account Balance
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
            {formatINR(summary.totalBalance)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            Across {accounts.length} active accounts
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Available Balance
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
            {formatINR(summary.availableBalance)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {primaryAccount?.accountNumberMasked || '••••'} · Checking
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Total Savings</div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-emerald-700">
            {formatINR(summary.totalSavings)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {savingsRules.filter((r) => r.status === 'Active').length} active auto-rules
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Monthly Income (30d)
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
            {formatINR(summary.monthlyIncome)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">Deposits & credits</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Monthly Expenses (30d)
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
            {formatINR(summary.monthlyExpenses)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">Transfers & bills</div>
        </div>
      </div>

      {/* Main Content Split: Accounts & Auto Savings + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account Summary & Savings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Accounts & Profile
              </h2>
              <Link
                to="/dashboard/accounts"
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="text-xs text-slate-500 mb-4">
              {user.fullName} · {user.city} · KYC {user.kycStatus}
            </div>
            <div className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0A1628]">
                      {acc.accountType}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {acc.accountNumberMasked} · {acc.ifscCode}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums text-sm font-bold text-[#0A1628]">
                      {formatINR(acc.balance)}
                    </div>
                    <StatusIndicator status={acc.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-[#0A1628] flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-600" />
                <span>Automatic Savings Rules</span>
              </h2>
              <Link
                to="/dashboard/savings"
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Manage
              </Link>
            </div>

            {savingsRules.length === 0 ? (
              <div className="text-sm text-slate-500 py-4">
                No automatic savings rules configured yet.
              </div>
            ) : (
              <div className="space-y-4">
                {savingsRules.map((rule) => {
                  const pct = Math.min(
                    100,
                    Math.round((rule.savedAmount / rule.targetAmount) * 100)
                  );
                  return (
                    <div key={rule.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-semibold text-[#0A1628] truncate">
                          {rule.goalName}
                        </span>
                        <StatusIndicator status={rule.status} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {rule.cadence} ·{' '}
                          <span className="font-mono tabular-nums">
                            {formatINR(rule.amount, false)}
                          </span>
                        </span>
                        <span className="font-mono tabular-nums">
                          {formatINR(rule.savedAmount, false)} /{' '}
                          {formatINR(rule.targetAmount, false)} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Transactions */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-[#0A1628]">
              Recent Transactions & Audit Proofs
            </h2>
            <Link
              to="/dashboard/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-2.5 pr-3">Reference</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 pl-3">Block Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentTransactions.map((tx) => {
                    const isCredit =
                      tx.type === 'Deposit' || tx.type === 'Fee Refund';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-3 pr-3">
                          <div className="font-medium text-[#0A1628] truncate max-w-[200px]">
                            {tx.receiverName}
                          </div>
                          <div className="text-xs text-slate-500">
                            <span className="font-mono">{tx.id}</span> ·{' '}
                            {formatDateTime(tx.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                          {tx.type}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                            isCredit ? 'text-emerald-700' : 'text-[#0A1628]'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatINR(tx.amount)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusIndicator status={tx.status} />
                        </td>
                        <td className="py-3 pl-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                          #{tx.blockNumber} · {truncateHash(tx.transactionHash, 6, 4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
