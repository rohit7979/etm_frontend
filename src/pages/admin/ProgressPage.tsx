import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3, Users, CheckCircle2, TrendingUp,
  Search, X, ArrowUpDown, AlertCircle, GraduationCap,
} from 'lucide-react';
import { fetchProgressSummary } from '@/services/assignment.api';
import { fetchEmployees } from '@/services/user.api';
import type { Employee, EmployeeProgress } from '@/types';

// ─── Merged row type ──────────────────────────────────────────────────────────
interface ProgressRow {
  name: string;
  email: string;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number; // numeric 0-100
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseRate = (rate: string): number => parseFloat(rate.replace('%', '')) || 0;

const rateColor = (rate: number): string => {
  if (rate >= 80) return '#22c55e';
  if (rate >= 50) return '#f59e0b';
  return '#ef4444';
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
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

// ─── Progress Card ────────────────────────────────────────────────────────────
const ProgressCard = ({ row, rank }: { row: ProgressRow; rank: number }) => {
  const color = rateColor(row.completionRate);
  const completedW  = row.total ? (row.completed  / row.total) * 100 : 0;
  const inProgressW = row.total ? (row.inProgress / row.total) * 100 : 0;

  return (
    <div className="prg-card">
      {/* Left — avatar + name */}
      <div className="prg-card-left">
        <div className="prg-avatar" style={{ background: `hsl(${(rank * 47) % 360} 65% 55%)` }}>
          {row.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="prg-name-wrap">
          <p className="prg-name">{row.name}</p>
          <p className="prg-email">{row.email}</p>
        </div>
      </div>

      {/* Centre — stacked bar + counts */}
      <div className="prg-bar-section">
        {row.total === 0 ? (
          <p className="prg-no-tasks">No assignments</p>
        ) : (
          <>
            {/* Stacked progress bar */}
            <div className="prg-bar-bg">
              <div className="prg-bar-fill prg-bar-completed"  style={{ width: `${completedW}%` }} />
              <div className="prg-bar-fill prg-bar-inprogress" style={{ width: `${inProgressW}%` }} />
            </div>

            {/* Mini legend */}
            <div className="prg-counts">
              <span className="prg-count-item prg-count-done">
                <span className="prg-dot" style={{ background: '#22c55e' }} />
                {row.completed} done
              </span>
              <span className="prg-count-item">
                <span className="prg-dot" style={{ background: '#f59e0b' }} />
                {row.inProgress} active
              </span>
              <span className="prg-count-item">
                <span className="prg-dot" style={{ background: '#e5e7eb' }} />
                {row.pending} pending
              </span>
              <span className="prg-count-total">{row.total} total</span>
            </div>
          </>
        )}
      </div>

      {/* Right — completion rate */}
      <div className="prg-rate-wrap">
        <span className="prg-rate" style={{ color }}>
          {row.completionRate}%
        </span>
        <span className="prg-rate-label">complete</span>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
type SortKey = 'rate-desc' | 'rate-asc' | 'name-asc' | 'total-desc';

export const ProgressPage = () => {
  const [rows, setRows]     = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState<SortKey>('rate-desc');

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch progress summary (only employees with assignments)
        // AND full employee list so we can show employees with 0 assignments too
        const [summary, allEmployees] = await Promise.all([
          fetchProgressSummary(),
          fetchEmployees(),
        ]);

        // Build a map from email → progress row
        const map = new Map<string, ProgressRow>();

        summary.forEach((p: EmployeeProgress) => {
          map.set(p.employee.email, {
            name:           p.employee.name,
            email:          p.employee.email,
            total:          p.total,
            completed:      p.completed,
            inProgress:     p.in_progress,
            pending:        p.pending,
            completionRate: parseRate(p.completionRate),
          });
        });

        // Add employees who have no assignments yet
        allEmployees.forEach((e: Employee) => {
          if (!map.has(e.email)) {
            map.set(e.email, {
              name:           e.name,
              email:          e.email,
              total:          0,
              completed:      0,
              inProgress:     0,
              pending:        0,
              completionRate: 0,
            });
          }
        });

        setRows(Array.from(map.values()));
      } catch {
        toast.error('Failed to load progress data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Summary stats
  const stats = useMemo(() => {
    const withTasks = rows.filter((r) => r.total > 0);
    const avgRate = withTasks.length
      ? Math.round(withTasks.reduce((s, r) => s + r.completionRate, 0) / withTasks.length)
      : 0;
    return {
      total:        rows.length,
      avgRate,
      fullyDone:    rows.filter((r) => r.completionRate === 100 && r.total > 0).length,
      totalAssign:  rows.reduce((s, r) => s + r.total, 0),
    };
  }, [rows]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = rows.filter(
      (r) => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
    return result.sort((a, b) => {
      if (sort === 'rate-desc')  return b.completionRate - a.completionRate;
      if (sort === 'rate-asc')   return a.completionRate - b.completionRate;
      if (sort === 'name-asc')   return a.name.localeCompare(b.name);
      if (sort === 'total-desc') return b.total - a.total;
      return 0;
    });
  }, [rows, search, sort]);

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading progress data…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {/* ── Header ── */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Employee Progress</h1>
          <p className="adm-subtitle">
            Completion tracking across all {stats.total} employee{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="adm-stats-grid">
        <StatCard label="Total Employees"   value={stats.total}        icon={Users}        color="#4f46e5" sub="All registered" />
        <StatCard label="Avg Completion"    value={`${stats.avgRate}%`} icon={TrendingUp}   color="#f59e0b" sub="Across active employees" />
        <StatCard label="Fully Completed"   value={stats.fullyDone}    icon={CheckCircle2} color="#22c55e" sub="100% rate" />
        <StatCard label="Total Assignments" value={stats.totalAssign}  icon={BarChart3}    color="#0ea5e9" sub="All programmes" />
      </div>

      {/* ── Filters ── */}
      <div className="prg-filter-bar">
        {/* Search */}
        <div className="trn-search-wrap" style={{ maxWidth: 340 }}>
          <Search size={15} className="trn-search-icon" />
          <input
            className="trn-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="trn-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="prg-sort-wrap">
          <ArrowUpDown size={14} className="prg-sort-icon" />
          <select
            className="prg-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="rate-desc">Completion Rate ↓</option>
            <option value="rate-asc">Completion Rate ↑</option>
            <option value="name-asc">Name A → Z</option>
            <option value="total-desc">Most Assignments</option>
          </select>
        </div>

        <span className="prg-count-badge">
          {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Progress List ── */}
      {filtered.length === 0 ? (
        <div className="trn-empty">
          <GraduationCap size={48} className="trn-empty-icon" />
          <p className="trn-empty-title">No employees match your search</p>
          <p className="trn-empty-sub">Try a different name or email.</p>
        </div>
      ) : (
        <div className="prg-list">
          {filtered.map((row, i) => (
            <ProgressCard key={row.email} row={row} rank={i} />
          ))}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="prg-legend">
        <AlertCircle size={13} className="prg-legend-icon" />
        <span>
          Bar colours: <span style={{ color: '#22c55e', fontWeight: 700 }}>■ Completed</span>{' '}
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>■ In Progress</span>{' '}
          <span style={{ color: '#e5e7eb', fontWeight: 700 }}>■ Pending</span>
        </span>
        <span className="prg-legend-sep">·</span>
        <span>
          Rate colours: <span style={{ color: '#22c55e', fontWeight: 700 }}>≥80%</span>{' '}
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>50–79%</span>{' '}
          <span style={{ color: '#ef4444', fontWeight: 700 }}>&lt;50%</span>
        </span>
      </div>
    </div>
  );
};
