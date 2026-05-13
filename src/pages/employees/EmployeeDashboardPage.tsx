import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  PlayCircle,
  AlertCircle,
  GraduationCap,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import type { Assignment } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MyStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
  totalHours: number;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const EmpStatCard = ({
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
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    completed: { label: 'Completed', cls: 'badge-success', icon: CheckCircle2 },
    in_progress: { label: 'In Progress', cls: 'badge-warning', icon: PlayCircle },
    pending: { label: 'Pending', cls: 'badge-muted', icon: AlertCircle },
  };
  const s = map[status] ?? { label: status, cls: 'badge-muted', icon: AlertCircle };
  const Icon = s.icon;
  return (
    <span className={`emp-badge ${s.cls}`}>
      <Icon size={11} />
      {s.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // GET /assignments returns only the current user's assignments when role=employee
        const { data } = await api.get<{ count: number; assignments: Assignment[] }>('/assignments');
        const myAssignments = data.assignments;
        setAssignments(myAssignments);

        const total = myAssignments.length;
        const completed = myAssignments.filter((a) => a.status === 'completed').length;
        const inProgress = myAssignments.filter((a) => a.status === 'in_progress').length;
        const pending = myAssignments.filter((a) => a.status === 'pending').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const totalHours = myAssignments.reduce((s, a) => s + (a.training?.durationHours ?? 0), 0);

        setStats({ total, completed, inProgress, pending, completionRate, totalHours });
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading your dashboard…</p>
      </div>
    );
  }

  const completionRate = stats?.completionRate ?? 0;
  const circumference = 2 * Math.PI * 50;

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
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - completionRate / 100)}`}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="emp-ring-center">
              <span className="emp-ring-pct">{completionRate}%</span>
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
          <EmpStatCard
            label="Total Assigned"
            value={stats?.total ?? 0}
            icon={ClipboardList}
            color="#4f46e5"
            sub="Training programs"
          />
          <EmpStatCard
            label="Completed"
            value={stats?.completed ?? 0}
            icon={CheckCircle2}
            color="#22c55e"
            sub="Successfully finished"
          />
          <EmpStatCard
            label="In Progress"
            value={stats?.inProgress ?? 0}
            icon={TrendingUp}
            color="#f59e0b"
            sub="Currently active"
          />
          <EmpStatCard
            label="Total Hours"
            value={`${stats?.totalHours ?? 0}h`}
            icon={Clock}
            color="#0ea5e9"
            sub="Total training time"
          />
        </div>
      </div>

      {/* ── My Trainings List ── */}
      <div className="emp-card">
        <div className="emp-card-header">
          <BookOpen size={18} className="emp-card-icon" />
          <h2 className="emp-card-title">My Training Assignments</h2>
        </div>

        {assignments.length === 0 ? (
          <div className="emp-empty">
            <GraduationCap size={48} className="emp-empty-icon" />
            <p className="emp-empty-title">No assignments yet</p>
            <p className="emp-empty-sub">Your manager will assign training programs to you soon.</p>
          </div>
        ) : (
          <div className="emp-training-list">
            {assignments.map((a) => (
              <div key={a._id} className="emp-training-item">
                <div
                  className="emp-training-color-bar"
                  style={{
                    background:
                      a.status === 'completed'
                        ? '#22c55e'
                        : a.status === 'in_progress'
                        ? '#f59e0b'
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
                      <span className="emp-chip">{a.training.category}</span>
                    )}
                    {a.training?.durationHours && (
                      <span className="emp-meta-item">
                        <Clock size={12} />
                        {a.training.durationHours}h
                      </span>
                    )}
                    {a.completedAt && (
                      <span className="emp-meta-item">
                        <Calendar size={12} />
                        Completed {new Date(a.completedAt).toLocaleDateString()}
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
