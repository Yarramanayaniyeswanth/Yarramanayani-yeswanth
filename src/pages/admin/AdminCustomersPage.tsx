import { useCallback, useEffect, useState } from 'react';
import { Eye, Search, UserCheck, UserX } from 'lucide-react';
import { AdminShell } from '../../components/AdminShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import {
  BankAccount,
  BankTransaction,
  CustomerUser,
  SavingsRule,
} from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR } from '../../utils/format';

interface AdminCustomerSummary extends CustomerUser {
  accounts: BankAccount[];
  totalBalance: number;
  totalSavings: number;
  txCount: number;
}

interface CustomerDetailPayload {
  customer: CustomerUser;
  accounts: BankAccount[];
  transactions: BankTransaction[];
  savingsRules: SavingsRule[];
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] =
    useState<CustomerDetailPayload | null>(null);
  const [feedback, setFeedback] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const res = await apiRequest<{ customers: AdminCustomerSummary[] }>(
        `/api/admin/customers${q}`
      );
      setCustomers(res.customers);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const inspectCustomer = async (id: string) => {
    const res = await apiRequest<CustomerDetailPayload>(
      `/api/admin/customers/${id}`
    );
    setSelectedDetail(res);
  };

  const toggleStatus = async (c: AdminCustomerSummary) => {
    const next = c.status === 'Active' ? 'Deactivated' : 'Active';
    await apiRequest(`/api/admin/customers/${c.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    setFeedback(`Customer ${c.fullName} updated to ${next} (audit logged).`);
    await loadCustomers();
    if (selectedDetail?.customer.id === c.id) {
      await inspectCustomer(c.id);
    }
  };

  return (
    <AdminShell
      pageTitle="Customer Management"
      breadcrumb="Admin Console / Customers"
    >
      <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, email, or city..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <div className="text-xs text-slate-500">
          Sensitive account identifiers remain masked in compliance views.
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading customers...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Total Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0A1628]">
                          {c.fullName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.email} · {c.city}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0A1628] whitespace-nowrap">
                        {formatINR(c.totalBalance)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={c.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => inspectCustomer(c.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium ${
                            c.status === 'Active'
                              ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {c.status === 'Active' ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Profile & Activity Inspector */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          {selectedDetail ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0A1628]">
                    {selectedDetail.customer.fullName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDetail.customer.email} · {selectedDetail.customer.phone}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedDetail.customer.accountTier} · Joined{' '}
                    {formatDateTime(selectedDetail.customer.createdAt)}
                  </p>
                </div>
                <StatusIndicator status={selectedDetail.customer.status} />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-2">
                  Masked Accounts
                </h3>
                <div className="space-y-2">
                  {selectedDetail.accounts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <span className="font-semibold text-[#0A1628]">
                          {a.accountType}
                        </span>{' '}
                        <span className="font-mono text-slate-500">
                          ({a.accountNumberMasked})
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-bold text-[#0A1628]">
                        {formatINR(a.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-2">
                  Savings Activity ({selectedDetail.savingsRules.length} Rules)
                </h3>
                {selectedDetail.savingsRules.length === 0 ? (
                  <p className="text-xs text-slate-500">No savings rules.</p>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {selectedDetail.savingsRules.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-slate-700">
                          {r.goalName} ({r.cadence})
                        </span>
                        <span className="font-mono tabular-nums font-medium text-emerald-700">
                          {formatINR(r.savedAmount, false)} /{' '}
                          {formatINR(r.targetAmount, false)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-2">
                  Recent Transactions ({selectedDetail.transactions.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                  {selectedDetail.transactions.slice(0, 6).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <span className="font-mono font-medium text-[#0A1628]">
                          {t.id}
                        </span>{' '}
                        · {t.type}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums font-semibold">
                          {formatINR(t.amount)}
                        </span>
                        <StatusIndicator status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              Select a customer &quot;Profile&quot; to inspect masked accounts, savings rules, and transaction activity.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
