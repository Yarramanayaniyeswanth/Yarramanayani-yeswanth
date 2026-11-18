import { useCallback, useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { CustomerShell } from '../../components/CustomerShell';
import { BankNotification } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime } from '../../utils/format';

export function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<BankNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ notifications: BankNotification[] }>(
        '/api/customer/notifications'
      );
      setNotifications(res.notifications);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    await apiRequest(`/api/customer/notifications/${id}/read`, {
      method: 'PATCH',
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = async () => {
    await apiRequest('/api/customer/notifications/read-all', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <CustomerShell
      pageTitle="Notifications"
      breadcrumb="Customer Portal / Notifications"
      unreadCount={unreadCount}
      headerAction={
        unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0A1628] hover:bg-slate-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        ) : undefined
      }
    >
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No notifications available.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                n.read ? 'bg-white' : 'bg-emerald-50/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <Bell
                  className={`w-4 h-4 mt-1 shrink-0 ${
                    n.read ? 'text-slate-400' : 'text-emerald-600'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#0A1628]">
                      {n.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateTime(n.createdAt)}</span>
                    {!n.read && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-700">
                          Unread
                        </span>
                      </>
                    )}
                  </div>
                  <div className="font-semibold text-sm text-[#0A1628] mt-1">
                    {n.title}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                </div>
              </div>

              {!n.read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </CustomerShell>
  );
}
