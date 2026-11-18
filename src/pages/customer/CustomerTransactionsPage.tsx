import { useCallback, useEffect, useState } from 'react';
import { Download, Search, XCircle } from 'lucide-react';
import { CustomerShell } from '../../components/CustomerShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import { useAuth } from '../../context/AuthContext';
import { BankTransaction } from '../../types';
import { apiRequest } from '../../utils/api';
import {
  exportTransactionsPdf,
  formatDateTime,
  formatINR,
  truncateHash,
} from '../../utils/format';

export function CustomerTransactionsPage() {
  const { customer } = useAuth();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (typeFilter !== 'All') params.set('type', typeFilter);
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    try {
      const res = await apiRequest<{ transactions: BankTransaction[] }>(
        `/api/customer/transactions?${params.toString()}`
      );
      setTransactions(res.transactions);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleCancelPending = async (txId: string) => {
    setActionMessage('');
    try {
      await apiRequest(`/api/customer/transactions/${txId}/cancel`, {
        method: 'POST',
      });
      setActionMessage(
        `Transaction ${txId} marked Cancelled and append-only audit entry sealed.`
      );
      fetchTransactions();
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : 'Unable to cancel transaction.'
      );
    }
  };

  return (
    <CustomerShell
      pageTitle="Transaction History"
      breadcrumb="Customer Portal / Transactions"
      headerAction={
        <button
          type="button"
          onClick={() =>
            exportTransactionsPdf(
              transactions,
              customer?.fullName || 'BLOCKBANK Customer'
            )
          }
          disabled={transactions.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A1628] text-white text-xs sm:text-sm font-semibold hover:bg-[#11223D] disabled:opacity-40 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Download Statement (PDF)</span>
        </button>
      }
    >
      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, counterparty, description, or hash..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by transaction type"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="All">All Types</option>
            <option value="Transfer">Transfer</option>
            <option value="Auto-Savings">Auto-Savings</option>
            <option value="Deposit">Deposit</option>
            <option value="Withdrawal">Withdrawal</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="All">All Statuses</option>
            <option value="Successful">Successful</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {actionMessage}
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading ledger transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No transactions match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Blockchain Audit</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.map((tx) => {
                  const isCredit =
                    tx.type === 'Deposit' || tx.type === 'Fee Refund';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-[#0A1628] whitespace-nowrap">
                        {tx.id}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {tx.type}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0A1628] text-xs sm:text-sm">
                          {tx.receiverName}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[240px]">
                          {tx.description}
                        </div>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                          isCredit ? 'text-emerald-700' : 'text-[#0A1628]'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={tx.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <StatusIndicator status={tx.verificationStatus} />
                          <span className="text-xs font-mono text-slate-400">
                            #{tx.blockNumber} ·{' '}
                            {truncateHash(tx.transactionHash, 6, 4)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {tx.status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => handleCancelPending(tx.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
