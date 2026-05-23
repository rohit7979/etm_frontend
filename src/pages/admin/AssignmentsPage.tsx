import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ClipboardList, Plus, Trash2, X, Loader2,
  AlertCircle, CheckCircle2, PlayCircle, Clock,
  User, BookOpen, Search, Filter, MessageSquare, Tag,
} from 'lucide-react';
import CommentSection from '@/components/shared/CommentSection';
import {
  fetchAssignments,
  createAssignment,
  updateAssignmentStatus,
  deleteAssignment,
} from '@/services/assignment.api';
import { fetchEmployees } from '@/services/user.api';
import { fetchTrainings } from '@/services/training.api';
import type { Assignment, AssignmentStatus, Employee, Training } from '@/types';

// ─── Validation ───────────────────────────────────────────────────────────────
const assignSchema = z.object({
  employeeId: z.string().min(1, 'Please select an employee'),
  trainingId: z.string().min(1, 'Please select a training'),
});
type AssignFormData = z.infer<typeof assignSchema>;

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_META: Record<AssignmentStatus, { label: string; cls: string; icon: React.ElementType }> = {
  completed:   { label: 'Completed',   cls: 'badge-success',  icon: CheckCircle2 },
  in_progress: { label: 'In Progress', cls: 'badge-warning',  icon: PlayCircle   },
  pending:     { label: 'Pending',     cls: 'badge-muted',    icon: Clock        },
};

const StatusBadge = ({ status }: { status: AssignmentStatus }) => {
  const { label, cls, icon: Icon } = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={`asgn-badge ${cls}`}>
      <Icon size={11} /> {label}
    </span>
  );
};

// ─── Assign Modal ─────────────────────────────────────────────────────────────
interface AssignModalProps {
  employees: Employee[];
  trainings: Training[];
  onClose: () => void;
  onAssigned: (a: Assignment) => void;
}

const AssignModal = ({ employees, trainings, onClose, onAssigned }: AssignModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssignFormData>({ resolver: zodResolver(assignSchema) });

  const onSubmit = async (data: AssignFormData) => {
    try {
      const assignment = await createAssignment(data);
      toast.success('Training assigned successfully.');
      onAssigned(assignment);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to assign training.';
      toast.error(msg);
    }
  };

  return (
    <div className="trn-overlay" onClick={onClose}>
      <div className="trn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trn-modal-header">
          <div className="trn-modal-title-wrap">
            <ClipboardList size={18} className="trn-modal-icon" />
            <h2 className="trn-modal-title">Assign Training</h2>
          </div>
          <button className="trn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="trn-modal-form" noValidate>
          {/* Employee */}
          <div className="trn-field">
            <label className="trn-label">
              Employee <span className="trn-required">*</span>
            </label>
            <select className={`trn-input asgn-select ${errors.employeeId ? 'trn-input-error' : ''}`} {...register('employeeId')}>
              <option value="">— Select employee —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.email})
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="trn-error">{errors.employeeId.message}</p>}
          </div>

          {/* Training */}
          <div className="trn-field">
            <label className="trn-label">
              Training Program <span className="trn-required">*</span>
            </label>
            <select className={`trn-input asgn-select ${errors.trainingId ? 'trn-input-error' : ''}`} {...register('trainingId')}>
              <option value="">— Select training —</option>
              {trainings.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} · {t.category} · {t.durationHours}h
                </option>
              ))}
            </select>
            {errors.trainingId && <p className="trn-error">{errors.trainingId.message}</p>}
          </div>

          <div className="trn-modal-actions">
            <button type="button" className="trn-btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="trn-btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 size={15} className="trn-spinner" /> Assigning…</>
                : <><Plus size={15} /> Assign</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────
interface DeleteConfirmProps {
  assignment: Assignment;
  onCancel: () => void;
  onConfirmed: (id: string) => void;
}

const DeleteConfirm = ({ assignment, onCancel, onConfirmed }: DeleteConfirmProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAssignment(assignment._id);
      toast.success('Assignment removed.');
      onConfirmed(assignment._id);
    } catch {
      toast.error('Failed to remove assignment.');
      setLoading(false);
    }
  };

  return (
    <div className="trn-overlay" onClick={onCancel}>
      <div className="trn-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="trn-confirm-icon">
          <AlertCircle size={28} color="#ef4444" />
        </div>
        <h3 className="trn-confirm-title">Remove Assignment?</h3>
        <p className="trn-confirm-body">
          Remove <strong>{assignment.training?.title}</strong> from{' '}
          <strong>{assignment.employee?.name}</strong>? This cannot be undone.
        </p>
        <div className="trn-modal-actions">
          <button className="trn-btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="trn-btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? <><Loader2 size={15} className="trn-spinner" /> Removing…</> : <><Trash2 size={15} /> Remove</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Assignment Comment Modal ─────────────────────────────────────────────────
const AssignmentCommentModal = ({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) => (
  <div className="trn-overlay" onClick={onClose}>
    <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="kb-modal-header" style={{ borderLeftColor: '#c52031' }}>
        <div className="kb-modal-header-top">
          <StatusBadge status={assignment.status} />
          <button className="trn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <h2 className="kb-modal-title">{assignment.training?.title ?? '—'}</h2>
        <div className="kb-modal-meta">
          <span className="kb-meta-chip">
            <User size={11} /> {assignment.employee?.name ?? '—'}
          </span>
          <span className="kb-meta-chip">
            <Tag size={11} /> {assignment.training?.category ?? '—'}
          </span>
          <span className="kb-meta-chip">
            <Clock size={11} /> {assignment.training?.durationHours ?? '—'}h
          </span>
        </div>
      </div>

      {/* Comment section */}
      <div className="kb-modal-body">
        <CommentSection assignmentId={assignment._id} />
      </div>
    </div>
  </div>
);

// ─── Status Dropdown (inline update) ─────────────────────────────────────────
const StatusSelect = ({
  assignment,
  onChange,
}: {
  assignment: Assignment;
  onChange: (id: string, status: AssignmentStatus) => void;
}) => {
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as AssignmentStatus;
    setSaving(true);
    try {
      await updateAssignmentStatus(assignment._id, newStatus);
      onChange(assignment._id, newStatus);
      toast.success('Status updated.');
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      className="asgn-status-select"
      value={assignment.status}
      onChange={handleChange}
      disabled={saving}
    >
      <option value="pending">Pending</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | AssignmentStatus;

export const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [trainings, setTrainings]     = useState<Training[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState<Assignment | null>(null);
  const [commentTarget, setCommentTarget] = useState<Assignment | null>(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    Promise.all([fetchAssignments(), fetchEmployees(), fetchTrainings()])
      .then(([a, e, t]) => { setAssignments(a); setEmployees(e); setTrainings(t); })
      .catch(() => toast.error('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assignments.filter((a) => {
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchSearch =
        !q ||
        a.employee?.name.toLowerCase().includes(q) ||
        a.training?.title.toLowerCase().includes(q) ||
        a.training?.category?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [assignments, search, statusFilter]);

  const handleAssigned = (a: Assignment) => {
    setAssignments((prev) => [a, ...prev]);
    setShowModal(false);
  };

  const handleDeleted = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a._id !== id));
    setDeleteTarget(null);
  };

  const handleStatusChange = (id: string, status: AssignmentStatus) => {
    setAssignments((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status, completedAt: status === 'completed' ? new Date().toISOString() : null } : a))
    );
  };

  // Summary counts
  const counts = useMemo(() => ({
    total:       assignments.length,
    completed:   assignments.filter((a) => a.status === 'completed').length,
    inProgress:  assignments.filter((a) => a.status === 'in_progress').length,
    pending:     assignments.filter((a) => a.status === 'pending').length,
  }), [assignments]);

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading assignments…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {/* ── Header ── */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Assignments</h1>
          <p className="adm-subtitle">{counts.total} total · {counts.completed} completed · {counts.inProgress} in progress · {counts.pending} pending</p>
        </div>
        <button className="trn-btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Assign Training
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="asgn-filters">
        {/* Search */}
        <div className="trn-search-wrap">
          <Search size={15} className="trn-search-icon" />
          <input
            className="trn-search"
            placeholder="Search employee or training…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="trn-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="asgn-filter-pills">
          <Filter size={14} className="asgn-filter-icon" />
          {(['all', 'pending', 'in_progress', 'completed'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={`asgn-pill ${statusFilter === s ? 'asgn-pill-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : STATUS_META[s as AssignmentStatus].label}
              {s === 'all'
                ? ` (${counts.total})`
                : s === 'completed'
                ? ` (${counts.completed})`
                : s === 'in_progress'
                ? ` (${counts.inProgress})`
                : ` (${counts.pending})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="trn-empty">
          <ClipboardList size={48} className="trn-empty-icon" />
          <p className="trn-empty-title">
            {search || statusFilter !== 'all' ? 'No assignments match your filter' : 'No assignments yet'}
          </p>
          <p className="trn-empty-sub">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or status filter.'
              : 'Click "Assign Training" to get started.'}
          </p>
        </div>
      ) : (
        <div className="asgn-table-wrap">
          <table className="asgn-table">
            <thead>
              <tr>
                <th><User size={13} /> Employee</th>
                <th><BookOpen size={13} /> Training</th>
                <th>Category</th>
                <th><Clock size={13} /> Duration</th>
                <th>Status</th>
                <th>Assigned On</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a._id}>
                  {/* Employee */}
                  <td>
                    <div className="asgn-emp-cell">
                      <div className="asgn-avatar">
                        {a.employee?.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="asgn-emp-name">{a.employee?.name ?? '—'}</p>
                        <p className="asgn-emp-email">{a.employee?.email ?? ''}</p>
                      </div>
                    </div>
                  </td>

                  {/* Training */}
                  <td>
                    <p className="asgn-training-title">{a.training?.title ?? '—'}</p>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="asgn-category">
                      {a.training?.category ?? '—'}
                    </span>
                  </td>

                  {/* Duration */}
                  <td>
                    <span className="asgn-duration">{a.training?.durationHours ?? '—'}h</span>
                  </td>

                  {/* Status — inline editable */}
                  <td>
                    <StatusSelect assignment={a} onChange={handleStatusChange} />
                  </td>

                  {/* Date */}
                  <td>
                    <span className="asgn-date">
                      {new Date(a.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="asgn-actions">
                      <button
                        className="trn-icon-btn"
                        onClick={() => setCommentTarget(a)}
                        title="View / add comments"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button
                        className="trn-icon-btn trn-icon-btn-delete"
                        onClick={() => setDeleteTarget(a)}
                        title="Remove assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {showModal && (
        <AssignModal
          employees={employees}
          trainings={trainings}
          onClose={() => setShowModal(false)}
          onAssigned={handleAssigned}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          assignment={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirmed={handleDeleted}
        />
      )}
      {commentTarget && (
        <AssignmentCommentModal
          assignment={commentTarget}
          onClose={() => setCommentTarget(null)}
        />
      )}
    </div>
  );
};
