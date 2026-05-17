import { useEffect, useState } from 'react';
import {
  BookOpen, CheckCircle2, Clock, TrendingUp,
  PlayCircle, AlertCircle, GraduationCap, Calendar,
  ClipboardList, Tag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyStats } from '@/services/assignment.api';
import type { MyStats, AssignmentStatus } from '@/types';

// ─── Palette ──────────────────────────────────────────────────────────────────
const COLOR = {
  indigo: '#4f46e5',
  green:  '#22c55e',
  amber:  '#f59e0b',
  sky:    '#0ea5e9',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const EmpStatCard = ({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) => (
  <div className="emp-stat-card">
    <div className="emp-stat-icon" style={{ background: color + '1a', color }}>
      <Icon size={20} />
    </div>
    <div>
      <p className="emp-stat-label">{label}</p>
      <p className="emp-stat-value">{value}</p>
      {sub && <p className="emp-stat-sub">{sub}</p>}
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: AssignmentStatus }) => {
  const map: Record<AssignmentStatus, { label: string; cls: string; icon: React.ElementType }> = {
    completed:   { label: 'Completed',   cls: 'badge-success', icon: CheckCircle2 },
    in_progress: { label: 'In Progress', cls: 'badge-warning', icon: PlayCircle   },
    pending:     { label: 'Pending',     cls: 'badge-muted',   icon: AlertCircle  },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return (
    <span className={`emp-badge ${s.cls}`}>
      <Icon size={11} /> {s.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats]   = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading your dashboard…</p>
      </div>
    );
  }

  const rate        = stats?.completionRate ?? 0;
  const circumference = 2 * Math.PI * 50;
  const ringColor   = rate >= 80 ? COLOR.green : rate >= 50 ? COLOR.amber : COLOR.indigo;

  return (
    <div className="emp-page">
      {/* ── Header ── */}
      <div className="emp-header">
        <div>
          <h1 className="emp-title">My Dashboard</h1>
          <p className="emp-subtitle">
            Welcome back, <strong>{user?.name}</strong>! Track your training progress below.
          </p>
        </div>
        <div className="emp-header-badge">
          <GraduationCap size={16} />
          Employee
        </div>
      </div>

      {/* ── Progress Ring + Stats ── */}
      <div className="emp-overview">
        {/* Ring */}
        <div className="emp-ring-card">
          <div className="emp-ring-wrap">
            <svg viewBox="0 0 120 120" className="emp-ring-svg">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - rate / 100)}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="emp-ring-center">
              <span className="emp-ring-pct" style={{ color: ringColor }}>{rate}%</span>
              <span className="emp-ring-sub">Complete</span>
            </div>
          </div>
          <p className="emp-ring-label">Overall Completion</p>
          <p className="emp-ring-hint">
            {stats?.completed ?? 0} of {stats?.total ?? 0} trainings done
          </p>
        </div>

        {/* Stats */}
        <div className="emp-stats-grid">
          <EmpStatCard label="Total Assigned" value={stats?.total ?? 0}      icon={ClipboardList} color={COLOR.indigo} sub="Training programs" />
          <EmpStatCard label="Completed"      value={stats?.completed ?? 0}  icon={CheckCircle2}  color={COLOR.green}  sub="Successfully finished" />
          <EmpStatCard label="In Progress"    value={stats?.inProgress ?? 0} icon={TrendingUp}    color={COLOR.amber}  sub="Currently active" />
          <EmpStatCard label="Pending"        value={stats?.pending ?? 0}    icon={Clock}         color={COLOR.sky}    sub="Not yet started" />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      {(stats?.total ?? 0) > 0 && (
        <div className="emp-quick-actions">
          <a href="/employee/my-trainings" className="emp-action-card emp-action-primary">
            <BookOpen size={20} />
            <div>
              <p className="emp-action-title">Open Kanban Board</p>
              <p className="emp-action-sub">Manage your training workflow</p>
            </div>
          </a>
          <a href="/employee/my-progress" className="emp-action-card emp-action-secondary">
            <TrendingUp size={20} />
            <div>
              <p className="emp-action-title">View Full Progress</p>
              <p className="emp-action-sub">Charts, categories & history</p>
            </div>
          </a>
        </div>
      )}

      {/* ── Recent Assignments ── */}
      <div className="emp-card">
        <div className="emp-card-header">
          <BookOpen size={18} className="emp-card-icon" />
          <h2 className="emp-card-title">Recent Training Activity</h2>
        </div>

        {(stats?.recentAssignments ?? []).length === 0 ? (
          <div className="emp-empty">
            <GraduationCap size={48} className="emp-empty-icon" />
            <p className="emp-empty-title">No assignments yet</p>
            <p className="emp-empty-sub">Your manager will assign training programs to you soon.</p>
          </div>
        ) : (
          <div className="emp-training-list">
            {stats!.recentAssignments.map((a) => (
              <div key={a._id} className="emp-training-item">
                <div
                  className="emp-training-color-bar"
                  style={{
                    background:
                      a.status === 'completed'   ? COLOR.green
                      : a.status === 'in_progress' ? COLOR.amber
                      : '#cbd5e1',
                  }}
                />
                <div className="emp-training-body">
                  <div className="emp-training-top">
                    <p className="emp-training-title">{a.training?.title ?? 'Unknown Training'}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.training?.description && (
                    <p className="emp-training-desc">{a.training.description}</p>
                  )}
                  <div className="emp-training-meta">
                    {a.training?.category && (
                      <span className="emp-chip"><Tag size={10} /> {a.training.category}</span>
                    )}
                    {a.training?.durationHours && (
                      <span className="emp-meta-item"><Clock size={12} /> {a.training.durationHours}h</span>
                    )}
                    {a.completedAt && (
                      <span className="emp-meta-item">
                        <Calendar size={12} />
                        Completed {new Date(a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;
