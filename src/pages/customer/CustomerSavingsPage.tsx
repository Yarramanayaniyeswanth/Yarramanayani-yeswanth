import React, { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Edit3, Pause, Play, Plus, RefreshCw } from 'lucide-react';
import { CustomerShell } from '../../components/CustomerShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import { SavingsCadence, SavingsHistoryEntry, SavingsRule } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR, formatShortDate } from '../../utils/format';

interface SavingsPayload {
  rules: SavingsRule[];
  history: SavingsHistoryEntry[];
  vaultBalance: number;
  checkingBalance: number;
  simulatedAnnualYieldPct: number;
}

export function CustomerSavingsPage() {
  const [data, setData] = useState<SavingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [simulating, setSimulating] = useState(false);

  // Create / Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [cadence, setCadence] = useState<SavingsCadence>('Daily');
  const [amount, setAmount] = useState('100');
  const [targetAmount, setTargetAmount] = useState('25000');
  const [savingRule, setSavingRule] = useState(false);

  const loadSavings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<SavingsPayload>('/api/customer/savings');
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load savings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavings();
  }, [loadSavings]);

  const openCreateForm = () => {
    setEditingRuleId(null);
    setGoalName('');
    setCadence('Daily');
    setAmount('100');
    setTargetAmount('25000');
    setShowForm(true);
  };

  const openEditForm = (rule: SavingsRule) => {
    setEditingRuleId(rule.id);
    setGoalName(rule.goalName);
    setCadence(rule.cadence);
    setAmount(String(rule.amount));
    setTargetAmount(String(rule.targetAmount));
    setShowForm(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    setSavingRule(true);
    try {
      if (editingRuleId) {
        await apiRequest(`/api/customer/savings/rules/${editingRuleId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            goalName,
            cadence,
            amount: Number(amount),
            targetAmount: Number(targetAmount),
          }),
        });
        setFeedback('Savings rule updated.');
      } else {
        await apiRequest('/api/customer/savings/rules', {
          method: 'POST',
          body: JSON.stringify({
            goalName,
            cadence,
            amount: Number(amount),
            targetAmount: Number(targetAmount),
          }),
        });
        setFeedback('New automatic savings rule created.');
      }
      setShowForm(false);
      await loadSavings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule.');
    } finally {
      setSavingRule(false);
    }
  };

  const handleToggleRule = async (rule: SavingsRule) => {
    setError('');
    setFeedback('');
    const nextStatus = rule.status === 'Active' ? 'Paused' : 'Active';
    try {
      await apiRequest(`/api/customer/savings/rules/${rule.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setFeedback(`Rule "${rule.goalName}" is now ${nextStatus}.`);
      await loadSavings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update rule.');
    }
  };

  const handleSimulateCycle = async (ruleId?: string) => {
    setError('');
    setFeedback('');
    setSimulating(true);
    try {
      const res = await apiRequest<{
        simulatedCount: number;
        totalMoved: number;
      }>('/api/customer/savings/simulate', {
        method: 'POST',
        body: JSON.stringify(ruleId ? { ruleId } : {}),
      });
      setFeedback(
        `Simulated ${res.simulatedCount} scheduled savings deposit(s) totaling ${formatINR(res.totalMoved)} into your test Auto-Savings Vault.`
      );
      await loadSavings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Savings simulation failed.'
      );
    } finally {
      setSimulating(false);
    }
  };

  const totalTarget =
    data?.rules.reduce((sum, r) => sum + r.targetAmount, 0) || 0;
  const totalSavedInRules =
    data?.rules.reduce((sum, r) => sum + r.savedAmount, 0) || 0;
  const overallProgress =
    totalTarget > 0
      ? Math.min(100, Math.round((totalSavedInRules / totalTarget) * 100))
      : 0;

  const nextActiveRule = data?.rules
    .filter((r) => r.status === 'Active')
    .sort(
      (a, b) =>
        new Date(a.nextScheduledAt).getTime() -
        new Date(b.nextScheduledAt).getTime()
    )[0];

  const chartData = [...(data?.history || [])]
    .reverse()
    .map((h) => ({
      date: formatShortDate(h.executedAt),
      balance: h.balanceAfter,
      deposit: h.amount,
    }));

  return (
    <CustomerShell
      pageTitle="Automatic Savings"
      breadcrumb="Customer Portal / Savings"
      headerAction={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSimulateCycle()}
            disabled={simulating || !data?.rules.some((r) => r.status === 'Active')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-[#0A1628] hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span>Run Scheduled Cycle</span>
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-500 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Savings Rule</span>
          </button>
        </div>
      }
    >
      <div className="mb-6 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
        Simulation Mode: Automatic savings rules transfer test INR balances from your Checking account to your Auto-Savings Vault and log each sweep in the cryptographic hash chain.
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}
      {feedback && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {feedback}
        </div>
      )}

      {/* Rule Creation / Edit Panel */}
      {showForm && (
        <form
          onSubmit={handleSaveRule}
          className="mb-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#0A1628]">
              {editingRuleId ? 'Edit Savings Rule' : 'Configure New Automatic Savings Rule'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Savings Goal Name
              </label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Education Corpus"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frequency
              </label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as SavingsCadence)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Savings Amount (₹)
              </label>
              <input
                type="number"
                required
                min={10}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Goal (₹)
              </label>
              <input
                type="number"
                required
                min={10}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingRule}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
            >
              {savingRule ? 'Saving...' : editingRuleId ? 'Update Rule' : 'Save Rule'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading || !data ? (
        <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-6">
          {/* Summary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Total Saved Amount</div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-emerald-700">
                {formatINR(data.vaultBalance)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Simulated yield: {data.simulatedAnnualYieldPct}% p.a.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Combined Savings Target</div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
                {formatINR(totalTarget)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Across {data.rules.length} configured goal(s)
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Overall Goal Progress</div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#0A1628]">
                {overallProgress}%
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Next Scheduled Savings</div>
              <div className="mt-2 text-base font-bold text-[#0A1628]">
                {nextActiveRule
                  ? formatShortDate(nextActiveRule.nextScheduledAt)
                  : 'Paused / None'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {nextActiveRule
                  ? `${nextActiveRule.cadence} · ${formatINR(nextActiveRule.amount)}`
                  : 'Activate a rule to schedule'}
              </div>
            </div>
          </div>

          {/* Chart & Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-bold text-[#0A1628] mb-1">
                Savings Growth History
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Cumulative Auto-Savings Vault balance across simulated sweeps
              </p>
              {chartData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-slate-500">
                  Run a scheduled savings simulation to populate your growth chart.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val) => [formatINR(Number(val ?? 0)), 'Vault Balance']}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#059669"
                        fill="#D1FAE5"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Active & Paused Rules
              </h2>

              {data.rules.length === 0 ? (
                <p className="text-sm text-slate-500 py-6">
                  Create your first savings rule to start automating test deposits.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.rules.map((rule) => {
                    const pct = Math.min(
                      100,
                      Math.round((rule.savedAmount / rule.targetAmount) * 100)
                    );
                    return (
                      <div
                        key={rule.id}
                        className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-sm text-[#0A1628]">
                              {rule.goalName}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {rule.cadence} ·{' '}
                              <span className="font-mono tabular-nums font-medium text-[#0A1628]">
                                {formatINR(rule.amount)}
                              </span>{' '}
                              / cycle
                            </div>
                          </div>
                          <StatusIndicator status={rule.status} />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span className="font-mono tabular-nums">
                              {formatINR(rule.savedAmount, false)} saved
                            </span>
                            <span className="font-mono tabular-nums">
                              Target {formatINR(rule.targetAmount, false)} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleRule(rule)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {rule.status === 'Active' ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>Resume</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditForm(rule)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {rule.status === 'Active' && (
                            <button
                              type="button"
                              disabled={simulating}
                              onClick={() => handleSimulateCycle(rule.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#0A1628] text-white text-xs font-medium hover:bg-[#11223D] disabled:opacity-40 ml-auto"
                            >
                              Simulate Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Savings History Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Savings Execution History
              </h2>
            </div>
            {data.history.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No automatic savings transfers executed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Executed At</th>
                      <th className="py-3 px-4">Goal</th>
                      <th className="py-3 px-4">Cadence</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Vault Balance</th>
                      <th className="py-3 px-4">Ledger Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data.history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {formatDateTime(h.executedAt)}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0A1628]">
                          {h.goalName}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {h.cadence}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700 whitespace-nowrap">
                          +{formatINR(h.amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#0A1628] whitespace-nowrap">
                          {formatINR(h.balanceAfter)}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {h.transactionId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </CustomerShell>
  );
}
