import React, { useEffect, useState } from 'react';
import { CustomerShell } from '../../components/CustomerShell';
import { StatusIndicator } from '../../components/StatusIndicator';
import { useAuth } from '../../context/AuthContext';
import { CustomerUser } from '../../types';
import { apiRequest } from '../../utils/api';
import { formatDateTime } from '../../utils/format';

export function CustomerProfilePage() {
  const { customer, refreshSession } = useAuth();
  const [fullName, setFullName] = useState(customer?.fullName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [city, setCity] = useState(customer?.city || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName);
      setPhone(customer.phone);
      setCity(customer.city);
    }
  }, [customer]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await apiRequest<{ user: CustomerUser }>('/api/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, phone, city }),
      });
      await refreshSession();
      setMessage('Profile updated and logged in audit trail.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerShell
      pageTitle="Customer Profile"
      breadcrumb="Customer Portal / Profile"
    >
      <div className="max-w-2xl space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0A1628]">
                {customer?.fullName}
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                {customer?.email} · {customer?.accountTier}
              </div>
            </div>
            {customer && <StatusIndicator status={customer.kycStatus} />}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-500">Customer ID</div>
              <div className="font-mono font-medium text-[#0A1628] mt-0.5">
                {customer?.id}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Last Sign-In</div>
              <div className="font-medium text-[#0A1628] mt-0.5">
                {customer ? formatDateTime(customer.lastLoginAt) : '—'}
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <h3 className="font-display text-base font-bold text-[#0A1628]">
            Update Contact Information
          </h3>

          {message && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#0A1628] text-white text-sm font-semibold hover:bg-[#11223D] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </CustomerShell>
  );
}
