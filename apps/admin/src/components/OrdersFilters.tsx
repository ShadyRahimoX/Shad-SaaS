import React from 'react';
import { type OrdersStats } from '../lib/orders';
import { Search } from 'lucide-react';

interface OrdersFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  stats: OrdersStats | null;
}

interface StatusTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}

const StatusTab: React.FC<StatusTabProps> = ({ active, onClick, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
      active
        ? 'bg-primary text-primary-foreground shadow-xs'
        : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
  >
    <span>{label}</span>
    {typeof count === 'number' && (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
          active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  status,
  onStatusChange,
  search,
  onSearchChange,
  onSearchSubmit,
  stats,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(e);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <StatusTab
          active={status === 'all'}
          onClick={() => onStatusChange('all')}
          label="الكل"
          count={stats?.total}
        />
        <StatusTab
          active={status === 'accept'}
          onClick={() => onStatusChange('accept')}
          label="مكتمل"
          count={stats?.accept}
        />
        <StatusTab
          active={status === 'waiting'}
          onClick={() => onStatusChange('waiting')}
          label="الانتظار"
          count={stats?.waiting}
        />
        <StatusTab
          active={status === 'reject'}
          onClick={() => onStatusChange('reject')}
          label="مرفوض"
          count={stats?.reject}
        />
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث برقم الطلب أو اسم المستخدم أو البريد..."
            className="w-full h-11 pr-10 pl-4 rounded-2xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <button
          type="submit"
          className="h-11 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer"
        >
          بحث
        </button>
      </form>
    </div>
  );
};

export default OrdersFilters;
