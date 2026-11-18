import { useEffect, useState } from 'react';
import { CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import { CustomerShell } from '../../components/CustomerShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import {
  BlockchainRecord,
  ChainStatusInfo,
  ChainVerificationResult,
} from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR, truncateHash } from '../../utils/format';

interface ExplorerPayload {
  chainStatus: ChainStatusInfo;
  verification: ChainVerificationResult;
  blocks: BlockchainRecord[];
}

export function CustomerBlockchainPage() {
  const [data, setData] = useState<ExplorerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<BlockchainRecord | null>(null);
  const [singleCheck, setSingleCheck] = useState<{
    valid: boolean;
    reason: string;
    recomputedBlockHash: string;
  } | null>(null);

  useEffect(() => {
    apiRequest<ExplorerPayload>('/api/customer/blockchain')
      .then((res) => {
        setData(res);
        if (res.blocks.length > 0) setSelectedBlock(res.blocks[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInspectBlock = async (block: BlockchainRecord) => {
    setSelectedBlock(block);
    setSingleCheck(null);
    const res = await apiRequest<{
      verification: {
        valid: boolean;
        reason: string;
        recomputedBlockHash: string;
      };
    }>(`/api/customer/blockchain/verify/${block.transactionId}`, {
      method: 'POST',
    });
    setSingleCheck(res.verification);
  };

  const filteredBlocks =
    data?.blocks.filter((b) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        b.transactionId.toLowerCase().includes(q) ||
        b.currentBlockHash.toLowerCase().includes(q) ||
        String(b.blockNumber) === q
      );
    }) || [];

  return (
    <CustomerShell
      pageTitle="Blockchain Audit Explorer"
      breadcrumb="Customer Portal / Blockchain Audit"
    >
      {loading || !data ? (
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-6">
          {/* Chain Mode & Integrity Banner */}
          <div className="bg-[#0A1628] text-white rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{data.chainStatus.mode}</span>
              </div>
              <h2 className="font-display text-lg font-bold mt-1">
                {data.chainStatus.networkName}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {data.chainStatus.disclosure}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 shrink-0 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-slate-400">Latest Block</div>
                <div className="font-mono tabular-nums text-lg font-bold text-white mt-0.5">
                  #{data.chainStatus.latestBlockNumber}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-slate-400">Chain Integrity</div>
                <div className="font-mono tabular-nums text-sm font-bold text-emerald-400 mt-1">
                  {data.verification.verifiedBlocks}/{data.verification.totalBlocks} Verified
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Blocks Table */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-display text-base font-bold text-[#0A1628]">
                  Ledger Blocks
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter block # or Tx ID..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-4">Block</th>
                      <th className="py-2.5 px-4">Transaction ID</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4">Block Hash</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredBlocks.map((block) => (
                      <tr
                        key={block.blockNumber}
                        onClick={() => handleInspectBlock(block)}
                        className={`cursor-pointer hover:bg-slate-50 ${
                          selectedBlock?.blockNumber === block.blockNumber
                            ? 'bg-emerald-50/60'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#0A1628]">
                          #{block.blockNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {block.transactionId}
                          {block.isOwnTransaction && (
                            <span className="ml-2 text-[11px] font-sans font-semibold text-emerald-700">
                              (Yours)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#0A1628]">
                          {formatINR(block.amount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {truncateHash(block.currentBlockHash, 8, 6)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusIndicator
                            status={block.verified ? 'Verified' : 'Tampered'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Block Detail Inspector */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-[#0A1628]">
                Block Inspector
              </h3>

              {selectedBlock ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Block Number</span>
                    <span className="font-mono font-bold text-[#0A1628]">
                      #{selectedBlock.blockNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-mono font-semibold text-[#0A1628]">
                      {selectedBlock.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp</span>
                    <span className="text-slate-700">
                      {formatDateTime(selectedBlock.timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sender Ref</span>
                    <span className="font-mono text-slate-700">
                      {selectedBlock.senderRef}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receiver Ref</span>
                    <span className="font-mono text-slate-700">
                      {selectedBlock.receiverRef}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-slate-500 mb-1">Transaction Hash</div>
                    <div className="font-mono text-[11px] break-all bg-slate-50 p-2 rounded border border-slate-200">
                      {selectedBlock.transactionHash}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Previous Block Hash</div>
                    <div className="font-mono text-[11px] break-all bg-slate-50 p-2 rounded border border-slate-200">
                      {selectedBlock.previousBlockHash}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Current Block Hash</div>
                    <div className="font-mono text-[11px] break-all bg-slate-50 p-2 rounded border border-slate-200">
                      {selectedBlock.currentBlockHash}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInspectBlock(selectedBlock)}
                    className="w-full py-2 px-4 rounded-lg bg-[#0A1628] text-white text-xs font-semibold hover:bg-[#11223D]"
                  >
                    Re-Verify Cryptographic Digest
                  </button>

                  {singleCheck && (
                    <div
                      className={`p-3 rounded-lg border text-xs ${
                        singleCheck.valid
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {singleCheck.valid ? 'Integrity Verified' : 'Tampering Detected'}
                        </span>
                      </div>
                      <p className="mt-1">{singleCheck.reason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Select any block row to inspect its cryptographic hashes.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </CustomerShell>
  );
}
