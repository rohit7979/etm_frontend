import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Users, BookOpen, ClipboardList, TrendingUp,
  Award, CheckCircle2, AlertCircle, BarChart3,
  Plus, RefreshCw, Clock, ArrowUpRight, Activity,
  Sparkles, X, Loader2, PlayCircle, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminDashboard, fetchAnalytics, fetchEmployees } from '@/services/user.api';
import { fetchTrainings, createTraining } from '@/services/training.api';
import { fetchAssignments, createAssignment } from '@/services/assignment.api';
import type { AdminDashboard, AnalyticsData, Assignment, Employee, Training } from '@/types';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const COLOR = {
  primary: '#c52031',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
  sky: '#0284c7',
  slate: '#64748b',
};

const STATUS_COLORS: Record<string, string> = {
  completed: COLOR.green,
  in_progress: COLOR.amber,
  pending: COLOR.red,
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
};

const BAR_COLORS = [COLOR.indigo, COLOR.sky, COLOR.violet, COLOR.amber, COLOR.green];

// ─── Quick Create Training Modal ──────────────────────────────────────────────
interface QuickCreateTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickCreateTrainingModal = ({ isOpen, onClose, onSuccess }: QuickCreateTrainingModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [durationHours, setDurationHours] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category.trim() || !durationHours) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await createTraining({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        durationHours: Number(durationHours),
      });
      toast.success('Training program created successfully!');
      setTitle('');
      setDescription('');
      setCategory('');
      setDurationHours('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create training.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="trn-overlay" onClick={onClose}>
      <div className="trn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trn-modal-header">
          <div className="trn-modal-title-wrap">
            <BookOpen size={18} className="trn-modal-icon" style={{ color: COLOR.primary }} />
            <h2 className="trn-modal-title">Create New Training Task</h2>
          </div>
          <button className="trn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="trn-modal-form">
          <div className="trn-field">
            <label className="trn-label">
              Training Title <span className="trn-required">*</span>
            </label>
            <input
              type="text"
              className="trn-input"
              placeholder="e.g. Advanced TypeScript & React 19"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="trn-field">
            <label className="trn-label">
              Description <span className="trn-required">*</span>
            </label>
            <textarea
              className="trn-input trn-textarea"
              placeholder="Provide an overview of learning goals, resources, or tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="trn-field">
              <label className="trn-label">
                Category <span className="trn-required">*</span>
              </label>
              <input
                type="text"
                className="trn-input"
                placeholder="e.g. Engineering, Sales"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div className="trn-field">
              <label className="trn-label">
                Est. Hours <span className="trn-required">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="trn-input"
                placeholder="e.g. 4"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="trn-modal-actions mt-4">
            <button type="button" className="trn-btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="trn-btn-primary"
              style={{ background: COLOR.primary }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="trn-spinner" /> Creating…
                </>
              ) : (
                <>
                  <Plus size={15} /> Create Training
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Quick Assign Modal ───────────────────────────────────────────────────────
interface QuickAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickAssignModal = ({ isOpen, onClose, onSuccess }: QuickAssignModalProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedTrn, setSelectedTrn] = useState('');
  const [loadingLists, setLoadingLists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingLists(true);
      Promise.all([fetchEmployees(), fetchTrainings()])
        .then(([emps, trns]) => {
          setEmployees(emps);
          setTrainings(trns);
        })
        .catch(() => toast.error('Could not load employees or trainings.'))
        .finally(() => setLoadingLists(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !selectedTrn) {
      toast.error('Please select both an employee and a training program.');
      return;
    }

    setSubmitting(true);
    try {
      await createAssignment({
        employeeId: selectedEmp,
        trainingId: selectedTrn,
      });
      toast.success('Training assigned successfully!');
      setSelectedEmp('');
      setSelectedTrn('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign training.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="trn-overlay" onClick={onClose}>
      <div className="trn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trn-modal-header">
          <div className="trn-modal-title-wrap">
            <ClipboardList size={18} className="trn-modal-icon" style={{ color: COLOR.sky }} />
            <h2 className="trn-modal-title">Assign Training to Employee</h2>
          </div>
          <button className="trn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loadingLists ? (
          <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-[#c52031]" size={24} />
            <p className="text-xs">Loading available employees and trainings…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="trn-modal-form">
            <div className="trn-field">
              <label className="trn-label">
                Select Employee <span className="trn-required">*</span>
              </label>
              <select
                className="trn-input asgn-select"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                required
              >
                <option value="">— Choose an employee —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="trn-field">
              <label className="trn-label">
                Select Training Program <span className="trn-required">*</span>
              </label>
              <select
                className="trn-input asgn-select"
                value={selectedTrn}
                onChange={(e) => setSelectedTrn(e.target.value)}
                required
              >
                <option value="">— Choose a training module —</option>
                {trainings.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} · {t.category} ({t.durationHours}h)
                  </option>
                ))}
              </select>
            </div>

            <div className="trn-modal-actions mt-4">
              <button type="button" className="trn-btn-ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="trn-btn-primary"
                style={{ background: COLOR.sky }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="trn-spinner" /> Assigning…
                  </>
                ) : (
                  <>
                    <Plus size={15} /> Confirm Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Stat Card Component ──────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
  onClick?: () => void;
}

const StatCard = ({ label, value, icon: Icon, color, sub, onClick }: StatCardProps) => (
  <div
    className={`adm-stat-card ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}`}
    onClick={onClick}
  >
    <div className="adm-stat-icon-wrap" style={{ background: color + '18', color }}>
      <Icon size={22} />
    </div>
    <div className="adm-stat-body">
      <p className="adm-stat-label">{label}</p>
      <p className="adm-stat-value">{value}</p>
      {sub && <p className="adm-stat-sub">{sub}</p>}
    </div>
  </div>
);

// ─── Chart Card Component ─────────────────────────────────────────────────────
const ChartCard = ({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="adm-card">
    <div className="adm-card-header justify-between">
      <div className="flex items-center gap-2">
        <Icon size={17} className="adm-card-icon" />
        <h2 className="adm-card-title">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);

// ─── Main Admin Dashboard Page ────────────────────────────────────────────────
const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    try {
      const [db, an, asgns] = await Promise.all([
        fetchAdminDashboard(),
        fetchAnalytics(),
        fetchAssignments().catch(() => []),
      ]);

      setDashboard(db);
      setAnalytics(an);
      setRecentAssignments(asgns.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading dashboard analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adm-loading">
        <AlertCircle size={44} style={{ color: COLOR.red, marginBottom: '0.75rem' }} />
        <p className="loading-text font-semibold text-gray-800">
          Failed to load dashboard metrics.
        </p>
        <p className="text-xs text-gray-500 max-w-sm text-center mb-4">
          Please make sure your company session is active or retry.
        </p>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-[#c52031] text-white text-xs font-semibold rounded-lg shadow-sm hover:opacity-95 transition"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // Normalise pie data
  const pieData = (['completed', 'in_progress', 'pending'] as const).map((s) => ({
    status: s,
    count: analytics?.statusBreakdown?.find((x) => x.status === s)?.count ?? 0,
  }));

  const hasAnalytics = analytics !== null;

  return (
    <div className="adm-page space-y-6">
      {/* ── Top Header with Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Company Training Hub
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#c52031]/10 text-[#c52031]">
              <ShieldCheck size={13} /> {user?.company?.name || 'Company Admin'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Welcome back, <strong>{user?.name}</strong>. Real-time overview of training velocity, tasks, and completion metrics.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#c52031] text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-[#a31a28] transition-all"
          >
            <Plus size={15} />
            <span>Create Task</span>
          </button>

          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition-all"
          >
            <ClipboardList size={15} />
            <span>Assign Training</span>
          </button>

          <button
            onClick={() => navigate('/admin/employees')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-all"
          >
            <Users size={15} />
            <span>Manage Employees</span>
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#c52031]' : ''} />
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="adm-stats-grid">
        <StatCard
          label="Total Trainings"
          value={dashboard?.totalTrainings ?? 0}
          icon={BookOpen}
          color={COLOR.indigo}
          sub="Programs catalog"
          onClick={() => navigate('/admin/trainings')}
        />
        <StatCard
          label="Total Assignments"
          value={dashboard?.totalAssignments ?? 0}
          icon={ClipboardList}
          color={COLOR.sky}
          sub="Across all employees"
          onClick={() => navigate('/admin/assignments')}
        />
        <StatCard
          label="Completed"
          value={dashboard?.completedAssignments ?? 0}
          icon={CheckCircle2}
          color={COLOR.green}
          sub={`${dashboard?.avgCompletionRate ?? 0}% overall rate`}
          onClick={() => navigate('/admin/progress')}
        />
        <StatCard
          label="In Progress"
          value={dashboard?.inProgressAssignments ?? 0}
          icon={TrendingUp}
          color={COLOR.amber}
          sub="Active learners"
        />
        <StatCard
          label="Pending / To-Do"
          value={dashboard?.pendingAssignments ?? 0}
          icon={AlertCircle}
          color={COLOR.red}
          sub="Awaiting start"
        />
        <StatCard
          label="Total Employees"
          value={dashboard?.totalEmployees ?? 0}
          icon={Users}
          color={COLOR.violet}
          sub={`${dashboard?.activeEmployees ?? 0} enrolled`}
          onClick={() => navigate('/admin/employees')}
        />
      </div>

      {/* ── Row 1: Charts (Status Donut + Monthly Velocity) ── */}
      <div className="adm-grid-2">
        {/* Status Donut */}
        <ChartCard
          icon={BarChart3}
          title="Training Status Distribution"
          action={
            <span className="text-[11px] font-medium text-gray-400">
              {dashboard?.totalAssignments ?? 0} total tasks
            </span>
          }
        >
          {hasAnalytics && (dashboard?.totalAssignments ?? 0) > 0 ? (
            <div className="adm-chart-donut-wrap">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} assignments`,
                      STATUS_LABELS[name] || name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="adm-pie-legend">
                {pieData.map((d) => (
                  <div key={d.status} className="adm-pie-legend-item">
                    <span
                      className="adm-pie-legend-dot"
                      style={{ background: STATUS_COLORS[d.status] }}
                    />
                    <span className="adm-pie-legend-label">
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                    <span className="adm-pie-legend-count font-semibold text-gray-700">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <Sparkles size={28} className="text-gray-300" />
              <p className="text-xs">No assignments yet. Assign tasks to view distribution.</p>
              <button
                onClick={() => setShowAssignModal(true)}
                className="mt-1 text-xs font-semibold text-[#c52031] hover:underline"
              >
                + Assign your first task
              </button>
            </div>
          )}
        </ChartCard>

        {/* Monthly Trend Area Chart */}
        <ChartCard
          icon={TrendingUp}
          title="Completions Trend (Last 6 Months)"
          action={
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Monthly completions
            </span>
          }
        >
          {hasAnalytics && analytics.monthlyTrends?.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart
                data={analytics.monthlyTrends}
                margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: any) => [v, 'Completed Tasks']}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <p className="text-xs">No completion data recorded yet in the last 6 months.</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Category Breakdown + Top Employees ── */}
      <div className="adm-grid-2">
        {/* Category Stacked Bar */}
        <ChartCard
          icon={BookOpen}
          title="Assignments by Category"
          action={
            <span className="text-[11px] font-medium text-gray-400">
              {analytics?.categoryBreakdown?.length ?? 0} categories
            </span>
          }
        >
          {hasAnalytics && analytics.categoryBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={analytics.categoryBreakdown}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="completed" name="Completed" fill={COLOR.green} radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="inProgress" name="In Progress" fill={COLOR.amber} radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="pending" name="Pending" fill={COLOR.red} radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <p className="text-xs">No category analytics recorded yet.</p>
            </div>
          )}
        </ChartCard>

        {/* Top 5 Performers Leaderboard */}
        <ChartCard
          icon={Award}
          title="Top Performers (Leaderboard)"
          action={
            <button
              onClick={() => navigate('/admin/progress')}
              className="text-xs font-semibold text-[#c52031] flex items-center gap-1 hover:underline"
            >
              View all <ArrowUpRight size={13} />
            </button>
          }
        >
          {hasAnalytics && analytics.topEmployees?.length > 0 ? (
            <div className="space-y-3 py-1">
              {analytics.topEmployees.map((emp, i) => (
                <div
                  key={emp.name + i}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-xs"
                    style={{ background: BAR_COLORS[i % BAR_COLORS.length] + '20', color: BAR_COLORS[i % BAR_COLORS.length] }}
                  >
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-gray-800 truncate">{emp.name}</p>
                      <span
                        className="text-xs font-bold"
                        style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}
                      >
                        {emp.completionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${emp.completionRate}%`,
                          background: BAR_COLORS[i % BAR_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-400 shrink-0 font-medium">
                    {emp.completed}/{emp.total} done
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <p className="text-xs">Leaderboard will appear as employees complete tasks.</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 3: Recent Activity Stream ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#c52031]" />
            <h2 className="text-sm font-bold text-gray-900">Recent Assignments & Activity</h2>
          </div>
          <button
            onClick={() => navigate('/admin/assignments')}
            className="text-xs font-semibold text-[#c52031] flex items-center gap-1 hover:underline"
          >
            All Assignments <ArrowUpRight size={13} />
          </button>
        </div>

        {recentAssignments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentAssignments.map((a) => (
              <div
                key={a._id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 px-2 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {a.employee?.name?.slice(0, 2).toUpperCase() || 'EM'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">
                      {a.employee?.name || 'Employee'}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate max-w-sm">
                      {a.training?.title || 'Training Program'} · {a.training?.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      a.status === 'completed'
                        ? 'bg-green-50 text-green-700'
                        : a.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {a.status === 'completed' ? (
                      <CheckCircle2 size={11} />
                    ) : a.status === 'in_progress' ? (
                      <PlayCircle size={11} />
                    ) : (
                      <Clock size={11} />
                    )}
                    {STATUS_LABELS[a.status] || a.status}
                  </span>

                  <span className="text-[10px] text-gray-400">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs">
            No recent activity yet. Create a training and assign it to an employee to get started!
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <QuickCreateTrainingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => loadData(true)}
      />

      <QuickAssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={() => loadData(true)}
      />
    </div>
  );
};

export default AdminDashboardPage;
