import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { CustomerShell } from '../../components/CustomerShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import { BankAccount, CustomerUser } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR } from '../../utils/format';

export function CustomerAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ accounts: BankAccount[]; user: CustomerUser | null }>(
      '/api/customer/accounts'
    )
      .then((res) => {
        setAccounts(res.accounts);
        setUser(res.user);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <CustomerShell
      pageTitle="Accounts & Balances"
      breadcrumb="Customer Portal / Accounts"
      headerAction={
        <Link
          to="/dashboard/transfer"
          className="px-4 py-2 rounded-lg bg-[#0A1628] text-white text-xs sm:text-sm font-semibold hover:bg-[#11223D] whitespace-nowrap"
        >
          New Demo Transfer
        </Link>
      }
    >
      {loading ? (
        <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-6">
          {user && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500">Account Holder</div>
                <div className="font-display text-lg font-bold text-[#0A1628] mt-0.5">
                  {user.fullName}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {user.email} · {user.phone} · {user.city}
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <div className="text-slate-500">Account Tier</div>
                  <div className="font-semibold text-[#0A1628] mt-0.5">
                    {user.accountTier}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">KYC Verification</div>
                  <div className="mt-0.5">
                    <StatusIndicator status={user.kycStatus} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      <h2 className="font-display text-lg font-bold text-[#0A1628]">
                        {acc.accountType}
                      </h2>
                    </div>
                    <StatusIndicator status={acc.status} />
                  </div>

                  <div className="mt-5 font-mono tabular-nums text-3xl font-bold text-[#0A1628]">
                    {formatINR(acc.balance)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Available Test Balance:{' '}
                    <span className="font-mono tabular-nums">
                      {formatINR(acc.availableBalance)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500">Masked Account Number</div>
                    <div className="font-mono font-semibold text-[#0A1628] mt-0.5">
                      {acc.accountNumberMasked}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">IFSC Code</div>
                    <div className="font-mono font-semibold text-[#0A1628] mt-0.5">
                      {acc.ifscCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Home Branch</div>
                    <div className="font-medium text-slate-700 mt-0.5">
                      {acc.branchName}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Last Updated</div>
                    <div className="font-medium text-slate-700 mt-0.5">
                      {formatDateTime(acc.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sensitive account numbers are masked across all customer views and API responses. Demo balances operate strictly in simulation mode.
            </span>
          </div>
        </div>
      )}
    </CustomerShell>
  );
}
