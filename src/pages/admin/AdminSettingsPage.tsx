import React, { useEffect, useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ChainStatusInfo, PlatformSettings } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime } from '../../utils/format';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [chainStatus, setChainStatus] = useState<ChainStatusInfo | null>(null);
  const [yieldPct, setYieldPct] = useState('6.25');
  const [maxTransfer, setMaxTransfer] = useState('100000');
  const [dupWindow, setDupWindow] = useState('30');
  const [autoCycle, setAutoCycle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ settings: PlatformSettings; chainStatus: ChainStatusInfo }>(
      '/api/admin/settings'
    ).then((res) => {
      setSettings(res.settings);
      setChainStatus(res.chainStatus);
      setYieldPct(String(res.settings.simulatedAnnualYieldPct));
      setMaxTransfer(String(res.settings.maxSingleTransferInr));
      setDupWindow(String(res.settings.strictDuplicateCheckWindowSec));
      setAutoCycle(res.settings.autoSavingsCycleEnabled);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    setError('');
    try {
      const res = await apiRequest<{ settings: PlatformSettings }>(
        '/api/admin/settings',
        {
          method: 'PATCH',
          body: JSON.stringify({
            simulatedAnnualYieldPct: Number(yieldPct),
            maxSingleTransferInr: Number(maxTransfer),
            strictDuplicateCheckWindowSec: Number(dupWindow),
            autoSavingsCycleEnabled: autoCycle,
          }),
        }
      );
      setSettings(res.settings);
      setFeedback('Platform settings updated and recorded in audit log.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      pageTitle="Administrator Settings"
      breadcrumb="Admin Console / Settings"
    >
      <div className="max-w-3xl space-y-6">
        {chainStatus && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0A1628]">
              Blockchain & Ethereum Testnet Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-500">Active Mode</div>
                <div className="font-semibold text-[#0A1628] mt-0.5">
                  {chainStatus.mode}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Network / Provider</div>
                <div className="font-semibold text-[#0A1628] mt-0.5">
                  {chainStatus.networkName}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Contract Address</div>
                <div className="font-mono text-slate-700 mt-0.5">
                  {chainStatus.contractAddress || 'Not configured (Local simulation)'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Latest Block Height</div>
                <div className="font-mono font-bold text-emerald-700 mt-0.5">
                  #{chainStatus.latestBlockNumber}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              {chainStatus.disclosure}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#0A1628]">
              Sandbox Banking & Risk Parameters
            </h2>
            {settings && (
              <span className="text-xs text-slate-500">
                Updated {formatDateTime(settings.updatedAt)} by {settings.updatedBy}
              </span>
            )}
          </div>

          {feedback && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {feedback}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Simulated Annual Savings Yield (%)
              </label>
              <input
                type="number"
                step="0.05"
                min={0}
                max={20}
                value={yieldPct}
                onChange={(e) => setYieldPct(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Max Single Demo Transfer (₹ INR)
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                value={maxTransfer}
                onChange={(e) => setMaxTransfer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Duplicate Transfer Check Window (Seconds)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={dupWindow}
                onChange={(e) => setDupWindow(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <input
                id="autoCycle"
                type="checkbox"
                checked={autoCycle}
                onChange={(e) => setAutoCycle(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <label htmlFor="autoCycle" className="text-sm font-medium text-[#0A1628]">
                Enable Automatic Savings Engine
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#0A1628] text-white text-sm font-semibold hover:bg-[#11223D] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
