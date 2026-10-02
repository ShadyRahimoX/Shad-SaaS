import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = getStatusConfig(status);
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${sizeClass} ${config.classes}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

function getStatusConfig(status: string) {
  switch (status) {
    case 'accept':
    case 'approved':
      return {
        label: status === 'approved' ? 'مقبول' : 'مكتمل',
        classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    case 'waiting':
    case 'pending':
      return {
        label: 'في الانتظار',
        classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: <Clock className="w-3 h-3" />,
      };
    case 'reject':
    case 'rejected':
      return {
        label: 'مرفوض',
        classes: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        icon: <XCircle className="w-3 h-3" />,
      };
    case 'cancelled':
      return {
        label: 'ملغى',
        classes: 'bg-muted text-muted-foreground border-border',
        icon: <Ban className="w-3 h-3" />,
      };
    default:
      return {
        label: status,
        classes: 'bg-muted text-muted-foreground border-border',
        icon: <AlertCircle className="w-3 h-3" />,
      };
  }
}

export default StatusBadge;
