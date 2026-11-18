import React, { useCallback, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { AdminShell } from '../../components/AdminShell';
import { BankNotification } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime } from '../../utils/format';

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<BankNotification[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [category, setCategory] = useState<'System' | 'Security' | 'Savings' | 'Transfer'>('System');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(async () => {
    const res = await apiRequest<{
      notifications: BankNotification[];
      contactInquiries: ContactInquiry[];
    }>('/api/admin/notifications');
    setNotifications(res.notifications);
    setInquiries(res.contactInquiries);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFeedback('');
    try {
      await apiRequest('/api/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'ALL_CUSTOMERS',
          category,
          title,
          message,
        }),
      });
      setTitle('');
      setMessage('');
      setFeedback('Broadcast notification sent to all customer portals (audit logged).');
      await loadData();
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminShell
      pageTitle="Notifications & Support Desk"
      breadcrumb="Admin Console / Notifications"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0A1628] mb-4">
            Broadcast Customer Notification
          </h2>
          {feedback && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {feedback}
            </div>
          )}
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as 'System' | 'Security' | 'Savings' | 'Transfer'
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="System">System</option>
                <option value="Security">Security</option>
                <option value="Savings">Savings</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Scheduled Ledger Audit Notice"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a clear notice for all BLOCKBANK customers..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send Broadcast'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Dispatched Notifications ({notifications.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-[#0A1628]">
                      {n.category} · Target: {n.userId}
                    </span>
                    <span>{formatDateTime(n.createdAt)}</span>
                  </div>
                  <div className="font-semibold text-sm text-[#0A1628] mt-1">
                    {n.title}
                  </div>
                  <p className="text-slate-600 mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-[#0A1628]">
                Public Contact Inquiries ({inquiries.length})
              </h2>
            </div>
            {inquiries.length === 0 ? (
              <div className="p-6 text-xs text-slate-500">
                No contact form submissions yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-4 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span className="font-semibold text-[#0A1628]">
                        {inq.name} ({inq.email})
                      </span>
                      <span>{formatDateTime(inq.createdAt)}</span>
                    </div>
                    <div className="font-semibold text-sm text-[#0A1628] mt-1">
                      {inq.subject}
                    </div>
                    <p className="text-slate-600 mt-0.5">{inq.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
