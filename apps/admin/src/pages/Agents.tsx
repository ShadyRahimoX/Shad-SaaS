import React, { useEffect, useState } from 'react';
import {
  adminAgentsApi,
  type AdminAgent,
  type AgentsStats,
  type AgentStatusFilter,
  type AgentSortBy,
} from '../lib/agents';
import { AgentCreateForm } from '../components/AgentCreateForm';
import { AgentEditModal } from '../components/AgentEditModal';
import {
  UserPlus,
  Search,
  Loader2,
  AlertCircle,
  HelpCircle,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Radio,
  Percent,
  User,
  CheckCircle2,
  XCircle,
  Power,
  ArrowRight,
  ArrowLeft,
  FileText,
} from 'lucide-react';

export const Agents: React.FC = () => {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [stats, setStats] = useState<AgentsStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>('all');
  const [sortBy, setSortBy] = useState<AgentSortBy>('newest');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AdminAgent | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentsData = async (
    targetPage: number,
    targetStatus: AgentStatusFilter,
    targetSort: AgentSortBy,
    targetSearch: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminAgentsApi.list({
          page: targetPage,
          limit,
          status: targetStatus,
          sortBy: targetSort,
          search: targetSearch || undefined,
        }),
        adminAgentsApi.getStats(),
      ]);

      if (listRes.success && listRes.data) {
        setAgents(listRes.data.agents);
        setTotal(listRes.data.total);
      } else {
        setError(listRes.error?.message || 'فشل جلب قائمة الوكلاء');
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsData(page, statusFilter, sortBy, appliedSearch);
  }, [page, statusFilter, sortBy, appliedSearch]);

  const handleStatusChange = (nextStatus: AgentStatusFilter) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleSortChange = (nextSort: AgentSortBy) => {
    setSortBy(nextSort);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const handleOpenEdit = (agent: AdminAgent) => {
    setEditingAgent(agent);
    setEditModalOpen(true);
  };

  const handleToggleActive = async (agent: AdminAgent) => {
    setTogglingId(agent.id);
    try {
      const res = await adminAgentsApi.update(agent.id, { active: !agent.active });
      if (res.success) {
        fetchAgentsData(page, statusFilter, sortBy, appliedSearch);
      } else {
        alert(res.error?.message || 'فشل تغيير حالة الوكيل');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تحديث حالة الوكيل');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (agent: AdminAgent) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف الوكيل "${agent.name}" نهائياً؟`);
    if (!confirmed) return;

    try {
      const res = await adminAgentsApi.remove(agent.id);
      if (res.success) {
        fetchAgentsData(page, statusFilter, sortBy, appliedSearch);
      } else {
        alert(res.error?.message || 'فشل حذف الوكيل');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حذف الوكيل');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <UserPlus className="w-7 h-7 text-primary" />
            <span>إدارة الوكلاء</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            إضافة وتعديل الوكلاء المعتمدين، عناوينهم، أرقام التواصل، ونسب العمولة
          </p>
        </div>

        {/* Summary Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-card border border-border px-3.5 py-2 rounded-2xl shadow-xs">
            <span>إجمالي الوكلاء:</span>
            <span className="font-mono text-foreground font-black">{stats?.total ?? total}</span>
          </div>
          {stats && (
            <>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-card border border-border px-3.5 py-2 rounded-2xl shadow-xs">
                <span>متوسط العمولة:</span>
                <span className="font-mono text-primary font-black" dir="ltr">
                  {stats.avgCommissionPercent}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-card border border-border px-3.5 py-2 rounded-2xl shadow-xs">
                <span>مرتبط بمستخدم:</span>
                <span className="font-mono text-foreground font-black">{stats.linkedToUsers}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Create Form (صورة #4 من الدفعة 3) */}
      <AgentCreateForm
        onSuccess={() => {
          fetchAgentsData(1, statusFilter, sortBy, appliedSearch);
          setPage(1);
        }}
      />

      {/* Filters & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Status Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleStatusChange('all')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>الكل</span>
            {stats && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  statusFilter === 'all'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {stats.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('active')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>نشط</span>
            {stats && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  statusFilter === 'active'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {stats.active}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('inactive')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>معطّل</span>
            {stats && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  statusFilter === 'inactive'
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {stats.inactive}
              </span>
            )}
          </button>
        </div>

        {/* Sort + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as AgentSortBy)}
            className="h-10 px-3.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="name">الاسم (أبجدياً)</option>
            <option value="commission-desc">العمولة (الأعلى أولاً)</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف أو النداء..."
                className="w-full h-10 pr-9 pl-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0"
            >
              بحث
            </button>
          </form>
        </div>
      </div>

      {/* Agents List */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل قائمة الوكلاء...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : agents.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3 shadow-xs">
          <HelpCircle className="w-14 h-14 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">لا يوجد وكلاء مطابقون</h3>
          <p className="text-xs text-muted-foreground">
            لم يتم العثور على أي وكلاء. يمكنك إضافة وكيل جديد من النموذج أعلاه.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              data-agent-row
              className={`p-4 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !agent.active ? 'opacity-75 bg-muted/20' : ''
              }`}
            >
              {/* Left: Agent Details */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-extrabold text-sm text-foreground truncate">
                    {agent.name}
                  </h3>

                  {/* Active Status Badge */}
                  {agent.active ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>نشط</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                      <XCircle className="w-3 h-3" />
                      <span>معطّل</span>
                    </span>
                  )}

                  {/* Commission Badge */}
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-mono"
                    dir="ltr"
                  >
                    <Percent className="w-3 h-3" />
                    <span>{Number(agent.commissionPercent || 0).toFixed(2)}%</span>
                  </span>

                  {/* Linked User Badge */}
                  {(agent.username || agent.userId) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <User className="w-3 h-3" />
                      <span dir="ltr">
                        {agent.username ? `@${agent.username}` : agent.userId?.slice(0, 8)}
                      </span>
                    </span>
                  )}
                </div>

                {/* Info Meta Row: CallSign, Phone, Address, Notes */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  {agent.callSign && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                      <Radio className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                      <span>النداء: {agent.callSign}</span>
                    </span>
                  )}

                  {agent.phone && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-foreground/80">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span dir="ltr">{agent.phone}</span>
                    </span>
                  )}

                  {agent.address && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{agent.address}</span>
                    </span>
                  )}

                  {agent.notes && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-xs">{agent.notes}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Actions (تعديل / تعطيل-تفعيل / حذف) */}
              <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(agent)}
                  className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="تعديل بيانات الوكيل"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                <button
                  type="button"
                  disabled={togglingId === agent.id}
                  onClick={() => handleToggleActive(agent)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    agent.active
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                  title={agent.active ? 'تعطيل الوكيل' : 'تفعيل الوكيل'}
                >
                  {togglingId === agent.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Power className="w-3.5 h-3.5" />
                  )}
                  <span>{agent.active ? 'تعطيل' : 'تفعيل'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(agent)}
                  className="px-3 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="حذف الوكيل نهائياً"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-xs text-muted-foreground">
              عرض <span className="font-bold text-foreground">{(page - 1) * limit + 1}</span> إلى{' '}
              <span className="font-bold text-foreground">{Math.min(page * limit, total)}</span> من{' '}
              <span className="font-bold text-foreground">{total}</span> وكيل
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono font-bold">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>التالي</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      <AgentEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        agent={editingAgent}
        onSuccess={() => {
          fetchAgentsData(page, statusFilter, sortBy, appliedSearch);
        }}
      />
    </div>
  );
};

export default Agents;
