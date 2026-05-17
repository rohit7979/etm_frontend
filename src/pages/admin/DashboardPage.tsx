import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Users, BookOpen, ClipboardList, TrendingUp,
  Award, CheckCircle2, AlertCircle, BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminDashboard, fetchAnalytics } from '@/services/user.api';
import type { AdminDashboard, AnalyticsData } from '@/types';

// ─── Palette ──────────────────────────────────────────────────────────────────
const COLOR = {
  indigo: '#4f46e5',
  violet: '#7c3aed',
  green:  '#22c55e',
  amber:  '#f59e0b',
  red:    '#ef4444',
  sky:    '#0ea5e9',
  slate:  '#64748b',
};

const STATUS_COLORS: Record<string, string> = {
  completed:   COLOR.green,
  in_progress: COLOR.amber,
  pending:     COLOR.red,
};

const STATUS_LABELS: Record<string, string> = {
  completed:   'Completed',
  in_progress: 'In Progress',
  pending:     'Pending',
};

const BAR_COLORS = [COLOR.indigo, COLOR.sky, COLOR.violet, COLOR.amber, COLOR.green, COLOR.red];

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}

const StatCard = ({ label, value, icon: Icon, color, sub }: StatCardProps) => (
  <div className="adm-stat-card">
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

// ─── Chart Card wrapper ───────────────────────────────────────────────────────
const ChartCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="adm-card">
    <div className="adm-card-header">
      <Icon size={17} className="adm-card-icon" />
      <h2 className="adm-card-title">{title}</h2>
    </div>
    {children}
  </div>
);

// ─── Custom Tooltip for Pie ───────────────────────────────────────────────────
const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="adm-tooltip">
      <p className="adm-tooltip-label">{STATUS_LABELS[name] ?? name}</p>
      <p className="adm-tooltip-value">{value} assignments</p>
    </div>
  );
};

// ─── Custom Legend for Pie ────────────────────────────────────────────────────
const PieLegend = ({ data }: { data: { status: string; count: number }[] }) => (
  <div className="adm-pie-legend">
    {data.map((d) => (
      <div key={d.status} className="adm-pie-legend-item">
        <span className="adm-pie-legend-dot" style={{ background: STATUS_COLORS[d.status] }} />
        <span className="adm-pie-legend-label">{STATUS_LABELS[d.status] ?? d.status}</span>
        <span className="adm-pie-legend-count">{d.count}</span>
      </div>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [db, an] = await Promise.all([fetchAdminDashboard(), fetchAnalytics()]);
        setDashboard(db);
        setAnalytics(an);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adm-loading">
        <AlertCircle size={40} style={{ color: COLOR.red, marginBottom: '0.75rem' }} />
        <p className="loading-text" style={{ color: COLOR.red }}>
          Failed to load dashboard. Please refresh.
        </p>
      </div>
    );
  }

  // Normalise pie data — ensure all 3 slices exist even if count is 0
  const pieData = (['completed', 'in_progress', 'pending'] as const).map((s) => ({
    status: s,
    count: analytics?.statusBreakdown.find((x) => x.status === s)?.count ?? 0,
  }));

  const hasAnalytics = analytics !== null;

  return (
    <div className="adm-page">
      {/* ── Header ── */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Admin Dashboard</h1>
          <p className="adm-subtitle">
            Welcome back, <strong>{user?.name}</strong> — here's an overview of all training activity.
          </p>
        </div>
        <div className="adm-header-badge">
          <Award size={16} />
          Administrator
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="adm-stats-grid">
        <StatCard label="Total Trainings"   value={dashboard?.totalTrainings ?? 0}       icon={BookOpen}      color={COLOR.indigo} sub="All programs" />
        <StatCard label="Total Assignments" value={dashboard?.totalAssignments ?? 0}      icon={ClipboardList} color={COLOR.sky}    sub="Across all employees" />
        <StatCard label="Completed"         value={dashboard?.completedAssignments ?? 0}  icon={CheckCircle2}  color={COLOR.green}  sub={`${dashboard?.avgCompletionRate ?? 0}% avg rate`} />
        <StatCard label="In Progress"       value={dashboard?.inProgressAssignments ?? 0} icon={TrendingUp}    color={COLOR.amber}  sub="Currently active" />
        <StatCard label="Pending"           value={dashboard?.pendingAssignments ?? 0}    icon={AlertCircle}   color={COLOR.red}    sub="Not yet started" />
        <StatCard label="Total Employees"   value={dashboard?.totalEmployees ?? 0}        icon={Users}         color={COLOR.violet} sub={`${dashboard?.activeEmployees ?? 0} with assignments`} />
      </div>

      {/* ── Row 1: Status Pie + Monthly Trend ── */}
      <div className="adm-grid-2">

        {/* Status Donut */}
        <ChartCard icon={BarChart3} title="Assignment Status Breakdown">
          {hasAnalytics ? (
            <div className="adm-chart-donut-wrap">
              <ResponsiveContainer width="100%" height={200}>
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
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={pieData} />
            </div>
          ) : (
            <p className="adm-empty">No data available</p>
          )}
        </ChartCard>

        {/* Monthly Trend Area Chart */}
        <ChartCard icon={TrendingUp} title="Monthly Completions (Last 6 Months)">
          {hasAnalytics && analytics.monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.monthlyTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLOR.indigo} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLOR.indigo} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: number) => [v, 'Completed']}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke={COLOR.indigo}
                  strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={{ r: 4, fill: COLOR.indigo, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="adm-empty-chart">
              <p>No completion data yet for the last 6 months.</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Category Bar + Top Employees ── */}
      <div className="adm-grid-2">

        {/* Category Breakdown Bar Chart */}
        <ChartCard icon={BookOpen} title="Assignments by Training Category">
          {hasAnalytics && analytics.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.categoryBreakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="completed"   name="Completed"    fill={COLOR.green}  radius={[4,4,0,0]} stackId="a" />
                <Bar dataKey="inProgress"  name="In Progress"  fill={COLOR.amber}  radius={[0,0,0,0]} stackId="a" />
                <Bar dataKey="pending"     name="Pending"      fill={COLOR.red}    radius={[4,4,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="adm-empty-chart">
              <p>No category data available yet.</p>
            </div>
          )}
        </ChartCard>

        {/* Top Employees Horizontal Bar */}
        <ChartCard icon={Users} title="Top 5 Employees by Completion Rate">
          {hasAnalytics && analytics.topEmployees.length > 0 ? (
            <div className="adm-top-employees">
              {analytics.topEmployees.map((emp, i) => (
                <div key={emp.name} className="adm-top-emp-row">
                  <div className="adm-top-emp-rank" style={{ background: BAR_COLORS[i] + '18', color: BAR_COLORS[i] }}>
                    {i + 1}
                  </div>
                  <div className="adm-top-emp-info">
                    <p className="adm-top-emp-name">{emp.name}</p>
                    <div className="adm-top-emp-bar-bg">
                      <div
                        className="adm-top-emp-bar-fill"
                        style={{ width: `${emp.completionRate}%`, background: BAR_COLORS[i] }}
                      />
                    </div>
                  </div>
                  <div className="adm-top-emp-meta">
                    <span className="adm-top-emp-pct" style={{ color: BAR_COLORS[i] }}>
                      {emp.completionRate}%
                    </span>
                    <span className="adm-top-emp-count">{emp.completed}/{emp.total}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="adm-empty-chart">
              <p>No employee data available yet.</p>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
