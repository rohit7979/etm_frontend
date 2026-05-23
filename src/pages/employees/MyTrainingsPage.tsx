import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Clock, Tag, ChevronRight, ChevronLeft,
  CheckCircle2, MessageSquare, X,
  Loader2, GraduationCap, AlertCircle,
} from 'lucide-react';
import { fetchAssignments, updateAssignmentStatus } from '@/services/assignment.api';
import CommentSection from '@/components/shared/CommentSection';
import type { Assignment, AssignmentStatus } from '@/types';

// ─── Column config ────────────────────────────────────────────────────────────
const COLUMNS: { status: AssignmentStatus; label: string; color: string; bg: string }[] = [
  { status: 'pending',     label: 'To Do',       color: '#64748b', bg: '#f8fafc' },
  { status: 'in_progress', label: 'In Progress',  color: '#f59e0b', bg: '#fffbeb' },
  { status: 'completed',   label: 'Completed',    color: '#22c55e', bg: '#f0fdf4' },
];

// Next / previous status for move buttons
const NEXT: Partial<Record<AssignmentStatus, AssignmentStatus>> = {
  pending:     'in_progress',
  in_progress: 'completed',
};
const PREV: Partial<Record<AssignmentStatus, AssignmentStatus>> = {
  in_progress: 'pending',
  completed:   'in_progress',
};

// ─── Card Detail Modal ────────────────────────────────────────────────────────
const CardModal = ({
  assignment,
  onClose,
  onStatusChange,
}: {
  assignment: Assignment;
  onClose: () => void;
  onStatusChange: (id: string, status: AssignmentStatus) => void;
}) => {
  const [saving, setSaving] = useState(false);

  const moveStatus = async (newStatus: AssignmentStatus) => {
    setSaving(true);
    try {
      await updateAssignmentStatus(assignment._id, newStatus);
      onStatusChange(assignment._id, newStatus);
      toast.success(
        `Moved to ${
          newStatus === 'in_progress' ? 'In Progress'
          : newStatus === 'completed'  ? 'Completed'
          : 'To Do'
        }.`
      );
      onClose();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const col = COLUMNS.find((c) => c.status === assignment.status)!;

  return (
    <div className="trn-overlay" onClick={onClose}>
      <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="kb-modal-header" style={{ borderLeftColor: col.color }}>
          <div className="kb-modal-header-top">
            <span
              className="kb-modal-status-chip"
              style={{ background: col.color + '18', color: col.color }}
            >
              {col.label}
            </span>
            <button className="trn-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <h2 className="kb-modal-title">{assignment.training?.title}</h2>
          <div className="kb-modal-meta">
            <span className="kb-meta-chip">
              <Tag size={11} /> {assignment.training?.category}
            </span>
            <span className="kb-meta-chip">
              <Clock size={11} /> {assignment.training?.durationHours}h
            </span>
            <span className="kb-meta-chip">
              Assigned by {assignment.assignedBy?.name ?? 'Admin'}
            </span>
          </div>
        </div>

        <div className="kb-modal-body">
          {/* Description */}
          {assignment.training?.description && (
            <div className="kb-modal-section">
              <p className="kb-modal-desc">{assignment.training.description}</p>
            </div>
          )}

          {/* Move actions */}
          <div className="kb-modal-actions">
            {PREV[assignment.status] && (
              <button
                className="kb-move-btn kb-move-btn-back"
                onClick={() => moveStatus(PREV[assignment.status]!)}
                disabled={saving}
              >
                {saving
                  ? <Loader2 size={14} className="kb-spin" />
                  : <ChevronLeft size={14} />}
                Move Back
              </button>
            )}
            {NEXT[assignment.status] && (
              <button
                className="kb-move-btn kb-move-btn-forward"
                onClick={() => moveStatus(NEXT[assignment.status]!)}
                disabled={saving}
              >
                {saving ? <Loader2 size={14} className="kb-spin" /> : null}
                {assignment.status === 'pending' ? 'Start Training' : 'Mark Completed'}
                {!saving && <ChevronRight size={14} />}
              </button>
            )}
            {assignment.status === 'completed' && (
              <span className="kb-done-badge">
                <CheckCircle2 size={14} /> Completed!
              </span>
            )}
          </div>

          {/* Shared comment section (reply support built-in) */}
          <CommentSection assignmentId={assignment._id} />
        </div>
      </div>
    </div>
  );
};

// ─── Kanban Card ──────────────────────────────────────────────────────────────
const KanbanCard = ({
  assignment,
  onMove,
  onOpen,
}: {
  assignment: Assignment;
  onMove: (id: string, status: AssignmentStatus) => void;
  onOpen: (a: Assignment) => void;
}) => {
  const [saving, setSaving] = useState(false);

  const quickMove = async (e: React.MouseEvent, newStatus: AssignmentStatus) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await updateAssignmentStatus(assignment._id, newStatus);
      onMove(assignment._id, newStatus);
    } catch {
      toast.error('Failed to move card.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kb-card" onClick={() => onOpen(assignment)}>
      {/* Title */}
      <p className="kb-card-title">{assignment.training?.title ?? 'Untitled'}</p>

      {/* Description preview */}
      {assignment.training?.description && (
        <p className="kb-card-desc">{assignment.training.description}</p>
      )}

      {/* Chips */}
      <div className="kb-card-chips">
        {assignment.training?.category && (
          <span className="kb-chip-cat"><Tag size={10} /> {assignment.training.category}</span>
        )}
        {assignment.training?.durationHours && (
          <span className="kb-chip-dur"><Clock size={10} /> {assignment.training.durationHours}h</span>
        )}
      </div>

      {/* Footer: move buttons + comment hint */}
      <div className="kb-card-footer" onClick={(e) => e.stopPropagation()}>
        <button className="kb-card-comment" onClick={() => onOpen(assignment)}>
          <MessageSquare size={12} /> Details
        </button>
        <div className="kb-card-moves">
          {PREV[assignment.status] && (
            <button
              className="kb-move-sm kb-move-sm-back"
              onClick={(e) => quickMove(e, PREV[assignment.status]!)}
              disabled={saving}
              title="Move back"
            >
              <ChevronLeft size={13} />
            </button>
          )}
          {NEXT[assignment.status] && (
            <button
              className="kb-move-sm kb-move-sm-fwd"
              onClick={(e) => quickMove(e, NEXT[assignment.status]!)}
              disabled={saving}
              title="Move forward"
            >
              {saving ? <Loader2 size={13} className="kb-spin" /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Kanban Column ────────────────────────────────────────────────────────────
const KanbanColumn = ({
  col,
  cards,
  onMove,
  onOpen,
}: {
  col: typeof COLUMNS[number];
  cards: Assignment[];
  onMove: (id: string, status: AssignmentStatus) => void;
  onOpen: (a: Assignment) => void;
}) => (
  <div className="kb-column">
    {/* Column header */}
    <div className="kb-col-header" style={{ borderTopColor: col.color }}>
      <div className="kb-col-title-row">
        <span className="kb-col-title">{col.label}</span>
        <span
          className="kb-col-count"
          style={{ background: col.color + '20', color: col.color }}
        >
          {cards.length}
        </span>
      </div>
    </div>

    {/* Cards */}
    <div className="kb-col-body" style={{ background: col.bg }}>
      {cards.length === 0 ? (
        <div className="kb-col-empty">
          <AlertCircle size={28} />
          <p>No tasks here</p>
        </div>
      ) : (
        cards.map((a) => (
          <KanbanCard key={a._id} assignment={a} onMove={onMove} onOpen={onOpen} />
        ))
      )}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyTrainingsPage = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Assignment | null>(null);

  useEffect(() => {
    fetchAssignments()
      .then(setAssignments)
      .catch(() => toast.error('Failed to load your trainings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleMove = (id: string, status: AssignmentStatus) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a._id === id
          ? { ...a, status, completedAt: status === 'completed' ? new Date().toISOString() : null }
          : a
      )
    );
  };

  const handleStatusChange = (id: string, status: AssignmentStatus) => {
    handleMove(id, status);
    setSelected((prev) => (prev?._id === id ? { ...prev, status } : prev));
  };

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading your trainings…</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="adm-page">
        <div className="adm-header">
          <h1 className="adm-title">My Trainings</h1>
        </div>
        <div className="trn-empty">
          <GraduationCap size={52} className="trn-empty-icon" />
          <p className="trn-empty-title">No trainings assigned yet</p>
          <p className="trn-empty-sub">Your manager will assign training programs to you soon.</p>
        </div>
      </div>
    );
  }

  const byStatus = (status: AssignmentStatus) =>
    assignments.filter((a) => a.status === status);

  return (
    <div className="kb-page">
      {/* Header */}
      <div className="adm-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="adm-title">My Trainings</h1>
          <p className="adm-subtitle">
            {assignments.length} assigned · drag cards or use arrows to update progress
          </p>
        </div>
        <div className="kb-summary-chips">
          {COLUMNS.map((col) => (
            <span
              key={col.status}
              className="kb-summary-chip"
              style={{ background: col.color + '15', color: col.color }}
            >
              {byStatus(col.status).length} {col.label}
            </span>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kb-board">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            col={col}
            cards={byStatus(col.status)}
            onMove={handleMove}
            onOpen={setSelected}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <CardModal
          assignment={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default MyTrainingsPage;
