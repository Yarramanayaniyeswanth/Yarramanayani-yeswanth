import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { AdminShell } from '../../components/AdminShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import {
  BlockchainRecord,
  ChainStatusInfo,
  ChainVerificationResult,
} from '../../types';
import { apiRequest } from '../../utils/api';
import {
  exportGenericReportPdf,
  formatDateTime,
  formatINR,
  truncateHash,
} from '../../utils/format';

interface AdminBlockchainPayload {
  chainStatus: ChainStatusInfo;
  verification: ChainVerificationResult;
  blocks: BlockchainRecord[];
}

export function AdminBlockchainPage() {
  const [data, setData] = useState<AdminBlockchainPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [drillResult, setDrillResult] = useState<{
    drillTargetBlock: number;
    drillTargetTxId: string;
    detectionResult: ChainVerificationResult;
  } | null>(null);
  const [singleVerifyMsg, setSingleVerifyMsg] = useState('');

  const loadBlockchain = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<AdminBlockchainPayload>(
        '/api/admin/blockchain'
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlockchain();
  }, [loadBlockchain]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setFeedback('');
    try {
      const res = await apiRequest<{ verification: ChainVerificationResult }>(
        '/api/admin/blockchain/verify-chain',
        { method: 'POST' }
      );
      setFeedback(
        res.verification.valid
          ? `Complete chain verified: ${res.verification.verifiedBlocks}/${res.verification.totalBlocks} blocks passed Keccak-256 hash-link validation.`
          : `Warning: ${res.verification.tamperedBlocks.length} tampered block(s) detected.`
      );
      await loadBlockchain();
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifySingle = async (txId: string) => {
    const res = await apiRequest<{
      verification: { valid: boolean; reason: string };
    }>(`/api/admin/blockchain/verify-record/${txId}`, { method: 'POST' });
    setSingleVerifyMsg(
      `${txId}: ${res.verification.valid ? 'VERIFIED' : 'FAILED'} — ${res.verification.reason}`
    );
  };

  const handleTamperDrill = async () => {
    const res = await apiRequest<{
      drillTargetBlock: number;
      drillTargetTxId: string;
      detectionResult: ChainVerificationResult;
    }>('/api/admin/blockchain/tamper-simulation', { method: 'POST' });
    setDrillResult(res);
  };

  const exportAuditPdf = () => {
    if (!data) return;
    exportGenericReportPdf({
      title: 'Blockchain Audit Ledger Report',
      subtitle: `${data.chainStatus.mode} · Head Block #${data.chainStatus.latestBlockNumber}`,
      columns: [
        'Block #',
        'Transaction ID',
        'Amount (INR)',
        'Status',
        'Previous Hash',
        'Current Block Hash',
        'Timestamp',
      ],
      rows: data.blocks.map((b) => [
        `#${b.blockNumber}`,
        b.transactionId,
        b.amount.toFixed(2),
        b.verified ? 'Verified' : 'Failed',
        truncateHash(b.previousBlockHash, 10, 8),
        truncateHash(b.currentBlockHash, 10, 8),
        formatDateTime(b.timestamp),
      ]),
      filename: `BLOCKBANK_Blockchain_Audit_${Date.now()}.pdf`,
    });
  };

  return (
    <AdminShell
      pageTitle="Blockchain Monitoring Panel"
      breadcrumb="Admin Console / Blockchain Explorer"
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTamperDrill}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-xs font-semibold text-amber-900 hover:bg-amber-100 whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Run Tamper Detection Drill</span>
          </button>
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={verifying}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>Verify Complete Hash Chain</span>
          </button>
          <button
            type="button"
            onClick={exportAuditPdf}
            disabled={!data}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A1628] text-white text-xs font-semibold hover:bg-[#11223D] whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit PDF</span>
          </button>
        </div>
      }
    >
      {loading || !data ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
          Loading blockchain ledger...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Total Audit Records</div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
                {data.verification.totalBlocks}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Verified Records</div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-emerald-700">
                {data.verification.verifiedBlocks}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Failed Verifications</div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-rose-700">
                {data.verification.tamperedBlocks.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Latest Block #</div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
                #{data.chainStatus.latestBlockNumber}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Latest Block Hash</div>
              <div className="mt-2 font-mono text-xs font-semibold text-[#0A1628] break-all">
                {truncateHash(data.chainStatus.latestBlockHash, 10, 8)}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 rounded-xl bg-[#0A1628] text-slate-200 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">{data.chainStatus.mode}:</strong>{' '}
              {data.chainStatus.disclosure} Audit records are strictly append-only.
            </span>
          </div>

          {feedback && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {singleVerifyMsg && (
            <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-300 text-xs text-[#0A1628] font-mono">
              {singleVerifyMsg}
            </div>
          )}

          {drillResult && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <div className="font-semibold">
                Non-Destructive Tamper Detection Drill (In-Memory Clone Only — Live Ledger Unaltered)
              </div>
              <p>
                Simulated a ₹5,000 mutation on cloned Block #{drillResult.drillTargetBlock} ({drillResult.drillTargetTxId}).
                Verification engine immediately flagged{' '}
                <strong>{drillResult.detectionResult.tamperedBlocks.length}</strong>{' '}
                compromised downstream block(s):{' '}
                {drillResult.detectionResult.tamperedBlocks
                  .map((t) => `#${t.blockNumber} (${t.reason})`)
                  .join(' | ')}
              </p>
            </div>
          )}

          {/* Block Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Block #</th>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Previous Hash</th>
                    <th className="py-3 px-4">Current Block Hash</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Verify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {data.blocks.map((b) => (
                    <tr key={b.blockNumber} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-[#0A1628]">
                        #{b.blockNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#0A1628]">
                        {b.transactionId}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium">
                        {formatINR(b.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {truncateHash(b.previousBlockHash, 8, 6)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {truncateHash(b.currentBlockHash, 8, 6)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(b.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator
                          status={b.verified ? 'Verified' : 'Tampered'}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleVerifySingle(b.transactionId)}
                          className="px-2.5 py-1 rounded border border-slate-300 text-xs font-medium text-[#0A1628] hover:bg-slate-100"
                        >
                          Verify
                        </button>
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
