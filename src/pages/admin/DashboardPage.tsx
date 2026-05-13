import { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import type { Training, Assignment, EmployeeProgress } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalTrainings: number;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  pendingAssignments: number;
  totalEmployees: number;
  avgCompletionRate: number;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) => (
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

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: 'Completed', cls: 'badge-success' },
    in_progress: { label: 'In Progress', cls: 'badge-warning' },
    pending: { label: 'Pending', cls: 'badge-muted' },
  };
  const s = map[status] ?? { label: status, cls: 'badge-muted' };
  return <span className={`adm-badge ${s.cls}`}>{s.label}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrainings, setRecentTrainings] = useState<Training[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [topEmployees, setTopEmployees] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [trainingsRes, assignmentsRes, progressRes, statsRes] = await Promise.all([
          api.get<Training[]>('/trainings'),
          api.get<{ count: number; assignments: Assignment[] }>('/assignments'),
          api.get<{ summary: Array<{ employee: { name: string; email: string }; total: number; completed: number; completionRate: string }> }>('/assignments/progress'),
          api.get<{ totalEmployees: number; totalAdmins: number; totalAssignments: number; completedAssignments: number; inProgressAssignments: number; pendingAssignments: number }>('/users/stats'),
        ]);

        const trainings: Training[] = trainingsRes.data;
        const assignments: Assignment[] = assignmentsRes.data.assignments;
        const summary = progressRes.data.summary;

        const completed = assignments.filter((a) => a.status === 'completed').length;
        const inProg = assignments.filter((a) => a.status === 'in_progress').length;
        const pending = assignments.filter((a) => a.status === 'pending').length;
        // Use accurate count from /users/stats (all registered employees, not just those with assignments)
        const totalEmployees = statsRes.data.totalEmployees;
        const avgRate =
          summary.length > 0
            ? Math.round(
                summary.reduce((s, p) => s + parseFloat(p.completionRate), 0) / summary.length
              )
            : 0;

        setStats({
          totalTrainings: trainings.length,
          totalAssignments: assignments.length,
          completedAssignments: completed,
          inProgressAssignments: inProg,
          pendingAssignments: pending,
          totalEmployees,
          avgCompletionRate: avgRate,
        });

        setRecentTrainings(trainings.slice(0, 5));
        setRecentAssignments(assignments.slice(0, 5));
        // Map summary to EmployeeProgress shape
        setTopEmployees(
          summary
            .map((s) => ({
              employeeId: s.employee.email,
              employeeName: s.employee.name,
              employeeEmail: s.employee.email,
              total: s.total,
              completed: s.completed,
              completionRate: Math.round(parseFloat(s.completionRate)),
            }))
            .sort((a, b) => b.completionRate - a.completionRate)
            .slice(0, 5)
        );
      } catch {
        // silently handle - stats stay null
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {/* ── Header ── */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Admin Dashboard</h1>
          <p className="adm-subtitle">
            Welcome back, <strong>{user?.name}</strong> — here's what's happening today.
          </p>
        </div>
        <div className="adm-header-badge">
          <Award size={16} />
          Administrator
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="adm-stats-grid">
        <StatCard
          label="Total Trainings"
          value={stats?.totalTrainings ?? 0}
          icon={BookOpen}
          color="#4f46e5"
          sub="All training programs"
        />
        <StatCard
          label="Total Assignments"
          value={stats?.totalAssignments ?? 0}
          icon={ClipboardList}
          color="#0ea5e9"
          sub="Across all employees"
        />
        <StatCard
          label="Completed"
          value={stats?.completedAssignments ?? 0}
          icon={CheckCircle2}
          color="#22c55e"
          sub={`${stats?.avgCompletionRate ?? 0}% avg completion`}
        />
        <StatCard
          label="In Progress"
          value={stats?.inProgressAssignments ?? 0}
          icon={TrendingUp}
          color="#f59e0b"
          sub="Currently active"
        />
        <StatCard
          label="Pending"
          value={stats?.pendingAssignments ?? 0}
          icon={AlertCircle}
          color="#ef4444"
          sub="Not yet started"
        />
        <StatCard
          label="Active Employees"
          value={stats?.totalEmployees ?? 0}
          icon={Users}
          color="#8b5cf6"
          sub="With assignments"
        />
      </div>

      {/* ── Two-column row ── */}
      <div className="adm-grid-2">
        {/* Recent Trainings */}
        <div className="adm-card">
          <div className="adm-card-header">
            <BookOpen size={18} className="adm-card-icon" />
            <h2 className="adm-card-title">Recent Trainings</h2>
          </div>
          {recentTrainings.length === 0 ? (
            <p className="adm-empty">No trainings found. Create your first training.</p>
          ) : (
            <div className="adm-list">
              {recentTrainings.map((t) => (
                <div key={t._id} className="adm-list-item">
                  <div className="adm-list-dot" style={{ background: '#4f46e5' }} />
                  <div className="adm-list-body">
                    <p className="adm-list-title">{t.title}</p>
                    <p className="adm-list-sub">
                      <span className="adm-chip">{t.category}</span>
                      <Clock size={11} />
                      {t.durationHours}h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Assignments */}
        <div className="adm-card">
          <div className="adm-card-header">
            <ClipboardList size={18} className="adm-card-icon" />
            <h2 className="adm-card-title">Recent Assignments</h2>
          </div>
          {recentAssignments.length === 0 ? (
            <p className="adm-empty">No assignments yet.</p>
          ) : (
            <div className="adm-list">
              {recentAssignments.map((a) => (
                <div key={a._id} className="adm-list-item">
                  <div
                    className="adm-list-dot"
                    style={{
                      background:
                        a.status === 'completed'
                          ? '#22c55e'
                          : a.status === 'in_progress'
                          ? '#f59e0b'
                          : '#94a3b8',
                    }}
                  />
                  <div className="adm-list-body">
                    <p className="adm-list-title">{a.training?.title ?? '—'}</p>
                    <p className="adm-list-sub">
                      <span>{a.employee?.name ?? '—'}</span>
                      <StatusBadge status={a.status} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Employee Progress ── */}
      <div className="adm-card">
        <div className="adm-card-header">
          <BarChart3 size={18} className="adm-card-icon" />
          <h2 className="adm-card-title">Top Employee Progress</h2>
        </div>
        {topEmployees.length === 0 ? (
          <p className="adm-empty">No progress data available yet.</p>
        ) : (
          <div className="adm-progress-table">
            {topEmployees.map((emp) => (
              <div key={emp.employeeId} className="adm-progress-row">
                <div className="adm-progress-avatar">
                  {emp.employeeName.charAt(0).toUpperCase()}
                </div>
                <div className="adm-progress-info">
                  <p className="adm-progress-name">{emp.employeeName}</p>
                  <p className="adm-progress-email">{emp.employeeEmail}</p>
                </div>
                <div className="adm-progress-bar-wrap">
                  <div className="adm-progress-bar-bg">
                    <div
                      className="adm-progress-bar-fill"
                      style={{ width: `${emp.completionRate}%` }}
                    />
                  </div>
                  <span className="adm-progress-pct">{emp.completionRate}%</span>
                </div>
                <div className="adm-progress-count">
                  {emp.completed}/{emp.total}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;