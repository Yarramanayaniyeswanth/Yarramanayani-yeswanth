import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AdminShell } from '../../components/AdminShell';
import {
  BankTransaction,
  BlockchainRecord,
  ChainVerificationResult,
  SavingsHistoryEntry,
  SavingsRule,
} from '../../types';
import { apiRequest } from '../../utils/api';
import {
  exportGenericReportPdf,
  formatDateTime,
  formatINR,
  truncateHash,
} from '../../utils/format';

interface ReportSummaryPayload {
  generatedAt: string;
  customers: {
    id: string;
    fullName: string;
    email: string;
    city: string;
    accountTier: string;
    status: string;
    totalBalance: number;
  }[];
  transactions: BankTransaction[];
  savingsRules: SavingsRule[];
  savingsHistory: SavingsHistoryEntry[];
  blockchainRecords: BlockchainRecord[];
  chainVerification: ChainVerificationResult;
}

export function AdminReportsPage() {
  const [data, setData] = useState<ReportSummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ReportSummaryPayload>('/api/admin/reports/summary')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const downloadCustomersReport = () => {
    if (!data) return;
    exportGenericReportPdf({
      title: 'Customer Directory Report',
      subtitle: `Total Registered Customers: ${data.customers.length}`,
      columns: ['Customer ID', 'Full Name', 'Email', 'City', 'Tier', 'Status', 'Total Balance (INR)'],
      rows: data.customers.map((c) => [
        c.id,
        c.fullName,
        c.email,
        c.city,
        c.accountTier,
        c.status,
        c.totalBalance.toFixed(2),
      ]),
      filename: `BLOCKBANK_Customers_Report_${Date.now()}.pdf`,
    });
  };

  const downloadTransactionsReport = () => {
    if (!data) return;
    exportGenericReportPdf({
      title: 'All Transactions Report',
      subtitle: `Total Demo Transactions: ${data.transactions.length}`,
      columns: ['Tx ID', 'Date', 'Type', 'Counterparty', 'Amount (INR)', 'Status', 'Block #'],
      rows: data.transactions.map((t) => [
        t.id,
        formatDateTime(t.createdAt),
        t.type,
        t.receiverName,
        t.amount.toFixed(2),
        t.status,
        `#${t.blockNumber}`,
      ]),
      filename: `BLOCKBANK_Transactions_Report_${Date.now()}.pdf`,
    });
  };

  const downloadSavingsReport = () => {
    if (!data) return;
    exportGenericReportPdf({
      title: 'Automatic Savings Report',
      subtitle: `Active & Paused Rules: ${data.savingsRules.length} · Sweeps: ${data.savingsHistory.length}`,
      columns: ['Rule ID', 'Goal Name', 'Cadence', 'Amount (INR)', 'Saved (INR)', 'Target (INR)', 'Status'],
      rows: data.savingsRules.map((r) => [
        r.id,
        r.goalName,
        r.cadence,
        r.amount.toFixed(2),
        r.savedAmount.toFixed(2),
        r.targetAmount.toFixed(2),
        r.status,
      ]),
      filename: `BLOCKBANK_Savings_Report_${Date.now()}.pdf`,
    });
  };

  const downloadBlockchainReport = () => {
    if (!data) return;
    exportGenericReportPdf({
      title: 'Blockchain Audit Compliance Report',
      subtitle: `Verified Blocks: ${data.chainVerification.verifiedBlocks}/${data.chainVerification.totalBlocks}`,
      columns: ['Block #', 'Transaction ID', 'Amount (INR)', 'Previous Hash', 'Block Hash', 'Timestamp'],
      rows: data.blockchainRecords.map((b) => [
        `#${b.blockNumber}`,
        b.transactionId,
        b.amount.toFixed(2),
        truncateHash(b.previousBlockHash, 10, 8),
        truncateHash(b.currentBlockHash, 10, 8),
        formatDateTime(b.timestamp),
      ]),
      filename: `BLOCKBANK_Blockchain_Audit_${Date.now()}.pdf`,
    });
  };

  const downloadMonthlyActivityReport = () => {
    if (!data) return;
    const byMonth: Record<string, { count: number; volume: number; savings: number }> = {};
    data.transactions.forEach((t) => {
      const m = t.createdAt.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { count: 0, volume: 0, savings: 0 };
      byMonth[m].count += 1;
      if (t.status === 'Successful') {
        byMonth[m].volume += t.amount;
        if (t.type === 'Auto-Savings') byMonth[m].savings += t.amount;
      }
    });

    exportGenericReportPdf({
      title: 'Monthly Activity Report',
      subtitle: 'Aggregated monthly transaction count, cleared volume, and auto-savings',
      columns: ['Month (YYYY-MM)', 'Transaction Count', 'Cleared Volume (INR)', 'Auto-Savings Volume (INR)'],
      rows: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, stats]) => [
          month,
          stats.count,
          stats.volume.toFixed(2),
          stats.savings.toFixed(2),
        ]),
      filename: `BLOCKBANK_Monthly_Activity_${Date.now()}.pdf`,
    });
  };

  return (
    <AdminShell
      pageTitle="Reports & Analytics Export"
      breadcrumb="Admin Console / Reports"
    >
      {loading || !data ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
          Preparing downloadable compliance reports...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Customer Portfolio Report
              </h2>
              <p className="mt-1.5 text-xs text-slate-600">
                Complete list of registered customers, KYC tiers, account status, and combined INR balances.
              </p>
              <div className="mt-4 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
                {data.customers.length} Customers
              </div>
            </div>
            <button
              type="button"
              onClick={downloadCustomersReport}
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A1628] text-white text-xs font-semibold hover:bg-[#11223D]"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Transaction Ledger Report
              </h2>
              <p className="mt-1.5 text-xs text-slate-600">
                All demo transfers, deposits, withdrawals, statuses, and associated audit block numbers.
              </p>
              <div className="mt-4 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
                {data.transactions.length} Transactions
              </div>
            </div>
            <button
              type="button"
              onClick={downloadTransactionsReport}
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A1628] text-white text-xs font-semibold hover:bg-[#11223D]"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Automatic Savings Report
              </h2>
              <p className="mt-1.5 text-xs text-slate-600">
                Summary of configured daily, weekly, and monthly savings rules and progress toward goals.
              </p>
              <div className="mt-4 font-mono tabular-nums text-2xl font-bold text-emerald-700">
                {formatINR(
                  data.savingsRules.reduce((s, r) => s + r.savedAmount, 0),
                  false
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={downloadSavingsReport}
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Blockchain Audit Report
              </h2>
              <p className="mt-1.5 text-xs text-slate-600">
                Full cryptographic block sequence, previous hash links, and verification summary.
              </p>
              <div className="mt-4 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
                {data.chainVerification.verifiedBlocks}/{data.chainVerification.totalBlocks} Blocks
              </div>
            </div>
            <button
              type="button"
              onClick={downloadBlockchainReport}
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A1628] text-white text-xs font-semibold hover:bg-[#11223D]"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Monthly Activity Report
              </h2>
              <p className="mt-1.5 text-xs text-slate-600">
                Monthly transaction volume breakdown, cleared INR throughput, and automated savings trends.
              </p>
              <div className="mt-4 font-mono tabular-nums text-lg font-bold text-[#0A1628]">
                Multi-Month Rollup
              </div>
            </div>
            <button
              type="button"
              onClick={downloadMonthlyActivityReport}
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A1628] text-white text-xs font-semibold hover:bg-[#11223D]"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
