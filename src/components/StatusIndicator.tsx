import { CheckCircle2, Clock, PauseCircle, ShieldAlert, XCircle } from 'lucide-react';

interface StatusIndicatorProps {
  status: string;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  switch (status) {
    case 'Successful':
    case 'Verified':
    case 'Active':
    case 'Valid':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{status}</span>
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{status}</span>
        </span>
      );
    case 'Paused':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <PauseCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{status}</span>
        </span>
      );
    case 'Failed':
    case 'Tampered':
    case 'Deactivated':
    case 'Suspended':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{status}</span>
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{status}</span>
        </span>
      );
    default:
      return (
        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
          {status}
        </span>
      );
  }
}
