import { useEffect, useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import { SavingsHistoryEntry, SavingsRule } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR, formatShortDate } from '../../utils/format';

export function AdminSavingsPage() {
  const [rules, setRules] = useState<SavingsRule[]>([]);
  const [history, setHistory] = useState<SavingsHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ rules: SavingsRule[]; history: SavingsHistoryEntry[] }>(
      '/api/admin/savings'
    )
      .then((res) => {
        setRules(res.rules);
        setHistory(res.history);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      pageTitle="Automatic Savings Monitor"
      breadcrumb="Admin Console / Automatic Savings"
    >
      {loading ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
          Loading savings activity...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Customer Savings Rules ({rules.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Goal</th>
                    <th className="py-3 px-4">Cadence</th>
                    <th className="py-3 px-4 text-right">Per Cycle</th>
                    <th className="py-3 px-4 text-right">Saved / Target</th>
                    <th className="py-3 px-4">Next Scheduled</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-[#0A1628]">
                        {r.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{r.goalName}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {r.cadence}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#0A1628]">
                        {formatINR(r.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                        <span className="font-semibold text-emerald-700">
                          {formatINR(r.savedAmount, false)}
                        </span>{' '}
                        / {formatINR(r.targetAmount, false)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {formatShortDate(r.nextScheduledAt)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Recent Simulated Savings Sweeps
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Executed At</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Goal</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Ledger Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(h.executedAt)}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0A1628]">
                        {h.customerName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {h.goalName} ({h.cadence})
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                        +{formatINR(h.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {h.transactionId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
