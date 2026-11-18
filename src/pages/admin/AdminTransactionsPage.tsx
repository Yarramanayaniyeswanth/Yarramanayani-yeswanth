import { useCallback, useEffect, useState } from 'react';
import { Check, Download, Search, X } from 'lucide-react';
import { AdminShell } from '../../components/AdminShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import { BankTransaction } from '../../types';
import { apiRequest } from '../../utils/api';
import {
  exportTransactionsPdf,
  formatDateTime,
  formatINR,
  truncateHash,
} from '../../utils/format';

export function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [feedback, setFeedback] = useState('');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (typeFilter !== 'All') params.set('type', typeFilter);

    try {
      const res = await apiRequest<{ transactions: BankTransaction[] }>(
        `/api/admin/transactions?${params.toString()}`
      );
      setTransactions(res.transactions);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleReview = async (
    id: string,
    decision: 'Approve' | 'Reject' | 'FlagReviewed'
  ) => {
    setFeedback('');
    await apiRequest(`/api/admin/transactions/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision }),
    });
    setFeedback(
      `Action "${decision}" completed for ${id}. Append-only review block & audit log recorded.`
    );
    await loadTransactions();
  };

  return (
    <AdminShell
      pageTitle="Transaction Management"
      breadcrumb="Admin Console / Transactions"
      headerAction={
        <button
          type="button"
          onClick={() =>
            exportTransactionsPdf(
              transactions,
              'All BLOCKBANK Customers',
              'Administrator Transaction Audit Report'
            )
          }
          disabled={transactions.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A1628] text-white text-xs sm:text-sm font-semibold hover:bg-[#11223D] disabled:opacity-40 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Export Report (PDF)</span>
        </button>
      }
    >
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Tx ID, customer, hash..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Successful">Successful</option>
          <option value="Failed">Failed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="All">All Types</option>
          <option value="Transfer">Transfer</option>
          <option value="Auto-Savings">Auto-Savings</option>
          <option value="Deposit">Deposit</option>
          <option value="Withdrawal">Withdrawal</option>
        </select>
      </div>

      {feedback && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {feedback}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading transactions...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type / Counterparty</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Admin Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-[#0A1628]">
                        {tx.id}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatDateTime(tx.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#0A1628]">
                      {tx.customerName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-[#0A1628]">
                        {tx.type} · {tx.receiverName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {tx.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0A1628] whitespace-nowrap">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusIndicator status={tx.status} />
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <StatusIndicator status={tx.verificationStatus} />
                      <div className="font-mono text-[11px] text-slate-400">
                        #{tx.blockNumber} · {truncateHash(tx.transactionHash, 6, 4)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {tx.status === 'Pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReview(tx.id, 'Approve')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(tx.id, 'Reject')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : tx.status === 'Failed' ? (
                        <button
                          type="button"
                          onClick={() => handleReview(tx.id, 'FlagReviewed')}
                          className="px-2.5 py-1 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Log Review
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
