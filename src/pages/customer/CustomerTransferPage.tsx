import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CustomerShell } from '../../components/CustomerShell';
import { BankAccount, BankTransaction, BlockchainRecord } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR } from '../../utils/format';

interface RecipientOption {
  userId: string;
  fullName: string;
  city: string;
  accountRef: string;
}

export function CustomerTransferPage() {
  const [checkingAccount, setCheckingAccount] = useState<BankAccount | null>(null);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverRef, setReceiverRef] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'receipt'>('form');
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{
    transaction: BankTransaction;
    block: BlockchainRecord;
  } | null>(null);

  useEffect(() => {
    apiRequest<{
      accounts: BankAccount[];
      recipients: RecipientOption[];
    }>('/api/customer/accounts').then((res) => {
      const chk = res.accounts.find((a) => a.accountType === 'Checking') || null;
      setCheckingAccount(chk);
      setRecipients(res.recipients);
    });
  }, []);

  const handleRecipientPick = (uid: string) => {
    setSelectedRecipientId(uid);
    const found = recipients.find((r) => r.userId === uid);
    if (found) {
      setReceiverName(found.fullName);
      setReceiverRef(found.accountRef);
    } else {
      setReceiverName('');
      setReceiverRef('');
    }
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const num = Number(amount);
    if (!receiverName.trim() || !receiverRef.trim()) {
      setError('Receiver name and account reference are required.');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a valid transfer amount greater than ₹0.');
      return;
    }
    if (checkingAccount && num > checkingAccount.availableBalance) {
      setError(
        `Insufficient available balance (${formatINR(checkingAccount.availableBalance)}).`
      );
      return;
    }
    setStep('review');
  };

  const handleConfirmTransfer = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        transaction: BankTransaction;
        block: BlockchainRecord;
        updatedAccount: BankAccount;
      }>('/api/customer/transfer', {
        method: 'POST',
        body: JSON.stringify({
          recipientUserId: selectedRecipientId || undefined,
          receiverName: receiverName.trim(),
          receiverRef: receiverRef.trim(),
          amount: Number(amount),
          description: description.trim(),
          idempotencyKey,
        }),
      });
      setReceipt({ transaction: res.transaction, block: res.block });
      setCheckingAccount(res.updatedAccount);
      setStep('receipt');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed.');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedRecipientId('');
    setReceiverName('');
    setReceiverRef('');
    setAmount('');
    setDescription('');
    setReceipt(null);
    setIdempotencyKey(
      `idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    );
    setStep('form');
  };

  return (
    <CustomerShell
      pageTitle="Demo Money Transfer"
      breadcrumb="Customer Portal / Transfer"
    >
      <div className="max-w-3xl mx-auto">
        {/* Sandbox Notice */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">
              Source Checking Account ({checkingAccount?.accountNumberMasked || '••••'})
            </div>
            <div className="font-mono tabular-nums text-xl font-bold text-[#0A1628] mt-0.5">
              {checkingAccount ? formatINR(checkingAccount.availableBalance) : '—'}
            </div>
          </div>
          <div className="text-xs text-slate-500 text-right">
            Demo test balances only · Duplicate request guard active
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {step === 'form' && (
          <form
            onSubmit={handleReview}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5"
          >
            <h2 className="font-display text-lg font-bold text-[#0A1628]">
              1. Enter Transfer Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quick-Select Demo Beneficiary (Optional)
              </label>
              <select
                value={selectedRecipientId}
                onChange={(e) => handleRecipientPick(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">— Enter external / custom reference —</option>
                {recipients.map((r) => (
                  <option key={r.userId} value={r.userId}>
                    {r.fullName} ({r.accountRef}) · {r.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Receiver Name
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Receiver Account Reference
                </label>
                <input
                  type="text"
                  required
                  value={receiverRef}
                  onChange={(e) => setReceiverRef(e.target.value)}
                  placeholder="•••• •••• 3310 or EXT-REF-001"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Amount (INR ₹)
              </label>
              <input
                type="number"
                required
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500.00"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description / Remarks
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Consulting retainer or invoice settlement"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0A1628] text-white text-sm font-semibold hover:bg-[#11223D] transition-colors"
            >
              <span>Review Transfer Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'review' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0A1628]">
                2. Review & Confirm Demo Transaction
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Confirming creates an immutable Keccak-256 hash-chain record and deducts from your test checking balance.
              </p>
            </div>

            <div className="border-t border-b border-slate-200 py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">From Account</span>
                <span className="font-mono font-medium text-[#0A1628]">
                  {checkingAccount?.accountNumberMasked}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary</span>
                <span className="font-semibold text-[#0A1628]">
                  {receiverName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receiver Reference</span>
                <span className="font-mono text-[#0A1628]">{receiverRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remarks</span>
                <span className="text-slate-700">
                  {description || 'Demo transfer'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="font-semibold text-[#0A1628]">
                  Transfer Amount
                </span>
                <span className="font-mono tabular-nums text-lg font-bold text-emerald-700">
                  {formatINR(Number(amount))}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmTransfer}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {submitting ? 'Sealing Transaction...' : 'Confirm Demo Transaction'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep('form')}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Details
              </button>
            </div>
          </div>
        )}

        {step === 'receipt' && receipt && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-display text-xl font-bold text-[#0A1628]">
                  Demo Transaction Successful
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sealed in Block #{receipt.block.blockNumber} ·{' '}
                  {formatDateTime(receipt.transaction.createdAt)}
                </p>
              </div>
            </div>

            <div className="bg-[#F4F6F9] border border-slate-200 rounded-lg p-4 space-y-2.5 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-semibold text-[#0A1628]">
                  {receipt.transaction.id}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Amount Transferred</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  {formatINR(receipt.transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Recipient</span>
                <span className="font-medium text-[#0A1628]">
                  {receipt.transaction.receiverName} ({receipt.transaction.receiverRef})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transaction Keccak-256 Hash</span>
                </div>
                <div className="font-mono text-[11px] break-all text-slate-700">
                  {receipt.block.transactionHash}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Current Block Hash</div>
                <div className="font-mono text-[11px] break-all text-slate-700">
                  {receipt.block.currentBlockHash}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-lg bg-[#0A1628] text-white text-sm font-semibold hover:bg-[#11223D]"
              >
                Make Another Transfer
              </button>
              <Link
                to="/dashboard/blockchain"
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Inspect in Blockchain Explorer
              </Link>
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
