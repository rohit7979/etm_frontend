import { useEffect, useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  CheckCircle2, Clock, TrendingUp, ClipboardList,
  BookOpen, Tag, Calendar, PlayCircle, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyStats } from '@/services/assignment.api';
import { fetchAssignments } from '@/services/assignment.api';
import type { MyStats, Assignment, AssignmentStatus } from '@/types';

// ─── Palette ──────────────────────────────────────────────────────────────────
const COLOR = {
  indigo: '#4f46e5',
  green:  '#22c55e',
  amber:  '#f59e0b',
  red:    '#ef4444',
  sky:    '#0ea5e9',
  slate:  '#64748b',
};

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  completed:   COLOR.green,
  in_progress: COLOR.amber,
  pending:     COLOR.slate,
};

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  completed:   'Completed',
  in_progress: 'In Progress',
  pending:     'Pending',
};

const BAR_PALETTE = [
  COLOR.indigo, COLOR.sky, COLOR.green, COLOR.amber, COLOR.red, '#8b5cf6', '#ec4899',
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
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

// ─── Chart Card ───────────────────────────────────────────────────────────────
const ChartCard = ({
  icon: Icon, title, children,
}: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) => (
  <div className="emp-card">
    <div className="emp-card-header">
      <Icon size={17} className="emp-card-icon" />
      <h2 className="emp-card-title">{title}</h2>
    </div>
    {children}
  </div>
);

// ─── SVG Completion Ring ──────────────────────────────────────────────────────
const CompletionRing = ({ rate, completed, total }: { rate: number; completed: number; total: number }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - rate / 100);
  const color = rate >= 80 ? COLOR.green : rate >= 50 ? COLOR.amber : COLOR.indigo;

  return (
    <div className="myp-ring-card">
      <div className="myp-ring-wrap">
        <svg viewBox="0 0 120 120" className="myp-ring-svg">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div className="myp-ring-center">
          <span className="myp-ring-pct" style={{ color }}>{rate}%</span>
          <span className="myp-ring-sub">Complete</span>
        </div>
      </div>
      <p className="myp-ring-label">Overall Progress</p>
      <p className="myp-ring-hint">{completed} of {total} trainings done</p>
    </div>
  );
};

// ─── Status badge (recent list) ───────────────────────────────────────────────
const StatusBadge = ({ status }: { status: AssignmentStatus }) => {
  const iconMap: Record<AssignmentStatus, React.ElementType> = {
    completed: CheckCircle2, in_progress: PlayCircle, pending: AlertCircle,
  };
  const Icon = iconMap[status] ?? AlertCircle;
  return (
    <span className={`emp-badge ${status === 'completed' ? 'badge-success' : status === 'in_progress' ? 'badge-warning' : 'badge-muted'}`}>
      <Icon size={11} /> {STATUS_LABELS[status]}
    </span>
  );
};

// ─── Custom Pie Tooltip ───────────────────────────────────────────────────────
const PieTip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="adm-tooltip">
      <p className="adm-tooltip-label">{STATUS_LABELS[payload[0].name as AssignmentStatus] ?? payload[0].name}</p>
      <p className="adm-tooltip-value">{payload[0].value} assignment{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyProgressPage = () => {
  const { user } = useAuth();
  const [myStats, setMyStats]       = useState<MyStats | null>(null);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([fetchMyStats(), fetchAssignments()])
      .then(([stats, assignments]) => {
        setMyStats(stats);
        setAllAssignments(assignments);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derived data for charts
  const pieData = useMemo(() => {
    if (!myStats) return [];
    return [
      { name: 'completed',   value: myStats.completed  },
      { name: 'in_progress', value: myStats.inProgress },
      { name: 'pending',     value: myStats.pending    },
    ].filter((d) => d.value > 0);
  }, [myStats]);

  const categoryData = useMemo(() => {
    const map = new Map<string, { completed: number; inProgress: number; pending: number }>();
    allAssignments.forEach((a) => {
      const cat = a.training?.category ?? 'Other';
      const cur = map.get(cat) ?? { completed: 0, inProgress: 0, pending: 0 };
      if (a.status === 'completed')   cur.completed++;
      if (a.status === 'in_progress') cur.inProgress++;
      if (a.status === 'pending')     cur.pending++;
      map.set(cat, cur);
    });
    return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }));
  }, [allAssignments]);

  const totalHours = useMemo(
    () => allAssignments.reduce((s, a) => s + (a.training?.durationHours ?? 0), 0),
    [allAssignments]
  );

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading your progress…</p>
      </div>
    );
  }

  const rate = myStats?.completionRate ?? 0;

  return (
    <div className="emp-page">
      {/* ── Header ── */}
      <div className="emp-header">
        <div>
          <h1 className="emp-title">My Progress</h1>
          <p className="emp-subtitle">
            Welcome, <strong>{user?.name}</strong> — here's a full view of your training journey.
          </p>
        </div>
      </div>

      {/* ── Overview: Ring + Stats ── */}
      <div className="emp-overview">
        <CompletionRing
          rate={rate}
          completed={myStats?.completed ?? 0}
          total={myStats?.total ?? 0}
        />
        <div className="emp-stats-grid">
          <StatCard label="Total Assigned" value={myStats?.total ?? 0}        icon={ClipboardList} color={COLOR.indigo} sub="All programmes" />
          <StatCard label="Completed"      value={myStats?.completed ?? 0}    icon={CheckCircle2}  color={COLOR.green}  sub="Successfully finished" />
          <StatCard label="In Progress"    value={myStats?.inProgress ?? 0}   icon={TrendingUp}    color={COLOR.amber}  sub="Currently active" />
          <StatCard label="Total Hours"    value={`${totalHours}h`}           icon={Clock}         color={COLOR.sky}    sub="Training time" />
        </div>
      </div>

      {/* ── Charts Row ── */}
      {(myStats?.total ?? 0) > 0 && (
        <div className="adm-grid-2">

          {/* Status Pie */}
          <ChartCard icon={TrendingUp} title="My Status Breakdown">
            <div className="adm-chart-donut-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={STATUS_COLORS[d.name as AssignmentStatus]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="adm-pie-legend">
                {pieData.map((d) => (
                  <div key={d.name} className="adm-pie-legend-item">
                    <span className="adm-pie-legend-dot" style={{ background: STATUS_COLORS[d.name as AssignmentStatus] }} />
                    <span className="adm-pie-legend-label">{STATUS_LABELS[d.name as AssignmentStatus]}</span>
                    <span className="adm-pie-legend-count">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Category Bar */}
          <ChartCard icon={BookOpen} title="Progress by Category">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="completed"   name="Completed"   fill={COLOR.green}  radius={[4,4,0,0]} stackId="a">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="adm-empty-chart"><p>No category data yet.</p></div>
            )}
          </ChartCard>
        </div>
      )}

      {/* ── Recent Assignments ── */}
      <div className="emp-card">
        <div className="emp-card-header">
          <BookOpen size={17} className="emp-card-icon" />
          <h2 className="emp-card-title">Recent Activity</h2>
        </div>

        {(myStats?.recentAssignments ?? []).length === 0 ? (
          <div className="emp-empty">
            <ClipboardList size={40} className="emp-empty-icon" />
            <p className="emp-empty-title">No training activity yet</p>
            <p className="emp-empty-sub">Your recent training assignments will appear here.</p>
          </div>
        ) : (
          <div className="emp-training-list">
            {myStats!.recentAssignments.map((a) => (
              <div key={a._id} className="emp-training-item">
                <div
                  className="emp-training-color-bar"
                  style={{
                    background:
                      a.status === 'completed' ? COLOR.green
                      : a.status === 'in_progress' ? COLOR.amber
                      : '#cbd5e1',
                  }}
                />
                <div className="emp-training-body">
                  <div className="emp-training-top">
                    <p className="emp-training-title">{a.training?.title ?? 'Unknown'}</p>
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

      {/* ── All Assignments Table ── */}
      {allAssignments.length > 0 && (
        <div className="emp-card">
          <div className="emp-card-header">
            <ClipboardList size={17} className="emp-card-icon" />
            <h2 className="emp-card-title">All My Assignments ({allAssignments.length})</h2>
          </div>
          <div className="myp-table-wrap">
            <table className="asgn-table">
              <thead>
                <tr>
                  <th>Training</th>
                  <th><Tag size={12} /> Category</th>
                  <th><Clock size={12} /> Duration</th>
                  <th>Status</th>
                  <th><Calendar size={12} /> Assigned</th>
                </tr>
              </thead>
              <tbody>
                {allAssignments.map((a) => (
                  <tr key={a._id}>
                    <td><p className="asgn-training-title">{a.training?.title ?? '—'}</p></td>
                    <td><span className="asgn-category">{a.training?.category ?? '—'}</span></td>
                    <td><span className="asgn-duration">{a.training?.durationHours ?? '—'}h</span></td>
                    <td>
                      <span className={`asgn-badge ${a.status === 'completed' ? 'badge-success' : a.status === 'in_progress' ? 'badge-warning' : 'badge-muted'}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td>
                      <span className="asgn-date">
                        {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProgressPage;
