import { useEffect, useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import { BankAccount } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime, formatINR } from '../../utils/format';

export function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ accounts: BankAccount[] }>('/api/admin/accounts')
      .then((res) => setAccounts(res.accounts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      pageTitle="Accounts Directory"
      breadcrumb="Admin Console / Accounts"
    >
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading accounts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Masked Account</th>
                  <th className="py-3 px-4">Account Holder</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">IFSC / Branch</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[#0A1628] whitespace-nowrap">
                      {a.accountNumberMasked}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0A1628]">
                        {a.ownerName}
                      </div>
                      <div className="text-xs text-slate-500">{a.ownerEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {a.accountType}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div className="font-mono">{a.ifscCode}</div>
                      <div className="text-slate-400">{a.branchName}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0A1628] whitespace-nowrap">
                      {formatINR(a.balance)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusIndicator status={a.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(a.updatedAt)}
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
