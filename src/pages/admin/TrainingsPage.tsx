import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Pencil, Trash2, Clock, Tag,
  Search, X, Loader2, AlertCircle, FolderOpen,
} from 'lucide-react';
import {
  fetchTrainings,
  createTraining,
  updateTraining,
  deleteTraining,
} from '@/services/training.api';
import type { Training } from '@/types';

// ─── Validation ───────────────────────────────────────────────────────────────
const trainingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  category: z.string().min(2, 'Category is required').max(60, 'Category too long'),
  durationHours: z
    .number({ message: 'Duration must be a number' })
    .min(0.5, 'Minimum 0.5 hours')
    .max(500, 'Maximum 500 hours'),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

// ─── Category colour chips ────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  '#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const getCategoryColor = (cat: string) =>
  CATEGORY_COLORS[Math.abs([...cat].reduce((a, c) => a + c.charCodeAt(0), 0)) % CATEGORY_COLORS.length];

// ─── Training Card ────────────────────────────────────────────────────────────
interface TrainingCardProps {
  training: Training;
  onEdit: (t: Training) => void;
  onDelete: (t: Training) => void;
}

const TrainingCard = ({ training, onEdit, onDelete }: TrainingCardProps) => {
  const color = getCategoryColor(training.category);
  return (
    <div className="trn-card">
      <div className="trn-card-top" style={{ borderLeftColor: color }}>
        <div className="trn-card-title-row">
          <h3 className="trn-card-title">{training.title}</h3>
          <div className="trn-card-actions">
            <button className="trn-icon-btn trn-icon-btn-edit" onClick={() => onEdit(training)} title="Edit">
              <Pencil size={14} />
            </button>
            <button className="trn-icon-btn trn-icon-btn-delete" onClick={() => onDelete(training)} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <p className="trn-card-desc">{training.description}</p>
      </div>
      <div className="trn-card-footer">
        <span className="trn-chip" style={{ background: color + '18', color }}>
          <Tag size={11} />
          {training.category}
        </span>
        <span className="trn-meta">
          <Clock size={12} />
          {training.durationHours}h
        </span>
        <span className="trn-meta">
          by {training.createdBy?.name ?? 'Admin'}
        </span>
      </div>
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  mode: 'create' | 'edit';
  initial?: Training | null;
  onClose: () => void;
  onSaved: (t: Training) => void;
}

const TrainingModal = ({ mode, initial, onClose, onSaved }: ModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      category: initial?.category ?? '',
      durationHours: initial?.durationHours ?? undefined,
    },
  });

  const onSubmit = async (data: TrainingFormData) => {
    try {
      let saved: Training;
      if (mode === 'edit' && initial) {
        saved = await updateTraining(initial._id, data);
        toast.success('Training updated successfully.');
      } else {
        saved = await createTraining(data);
        toast.success('Training created successfully.');
      }
      onSaved(saved);
    } catch {
      toast.error(mode === 'edit' ? 'Failed to update training.' : 'Failed to create training.');
    }
  };

  return (
    <div className="trn-overlay" onClick={onClose}>
      <div className="trn-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="trn-modal-header">
          <div className="trn-modal-title-wrap">
            <BookOpen size={18} className="trn-modal-icon" />
            <h2 className="trn-modal-title">
              {mode === 'create' ? 'Add New Training' : 'Edit Training'}
            </h2>
          </div>
          <button className="trn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="trn-modal-form" noValidate>
          {/* Title */}
          <div className="trn-field">
            <label className="trn-label">Title <span className="trn-required">*</span></label>
            <input
              className={`trn-input ${errors.title ? 'trn-input-error' : ''}`}
              placeholder="e.g. React Fundamentals"
              {...register('title')}
            />
            {errors.title && <p className="trn-error">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="trn-field">
            <label className="trn-label">Description <span className="trn-required">*</span></label>
            <textarea
              className={`trn-input trn-textarea ${errors.description ? 'trn-input-error' : ''}`}
              placeholder="Describe the training program and its objectives…"
              rows={3}
              {...register('description')}
            />
            {errors.description && <p className="trn-error">{errors.description.message}</p>}
          </div>

          {/* Category + Duration row */}
          <div className="trn-field-row">
            <div className="trn-field">
              <label className="trn-label">Category <span className="trn-required">*</span></label>
              <input
                className={`trn-input ${errors.category ? 'trn-input-error' : ''}`}
                placeholder="e.g. Technical, Compliance"
                {...register('category')}
              />
              {errors.category && <p className="trn-error">{errors.category.message}</p>}
            </div>
            <div className="trn-field trn-field-sm">
              <label className="trn-label">Duration (hrs) <span className="trn-required">*</span></label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className={`trn-input ${errors.durationHours ? 'trn-input-error' : ''}`}
                placeholder="e.g. 8"
                {...register('durationHours', { valueAsNumber: true })}
              />
              {errors.durationHours && <p className="trn-error">{errors.durationHours.message}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="trn-modal-actions">
            <button type="button" className="trn-btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="trn-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 size={15} className="trn-spinner" /> Saving…</>
              ) : mode === 'create' ? (
                <><Plus size={15} /> Create Training</>
              ) : (
                <><Pencil size={15} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
interface DeleteConfirmProps {
  training: Training;
  onCancel: () => void;
  onConfirmed: (id: string) => void;
}

const DeleteConfirm = ({ training, onCancel, onConfirmed }: DeleteConfirmProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTraining(training._id);
      toast.success('Training deleted.');
      onConfirmed(training._id);
    } catch {
      toast.error('Failed to delete training.');
      setLoading(false);
    }
  };

  return (
    <div className="trn-overlay" onClick={onCancel}>
      <div className="trn-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="trn-confirm-icon">
          <AlertCircle size={28} color="#ef4444" />
        </div>
        <h3 className="trn-confirm-title">Delete Training?</h3>
        <p className="trn-confirm-body">
          "<strong>{training.title}</strong>" will be permanently removed. This cannot be undone.
        </p>
        <div className="trn-modal-actions">
          <button className="trn-btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="trn-btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? <><Loader2 size={15} className="trn-spinner" /> Deleting…</> : <><Trash2 size={15} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const TrainingsPage = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Training | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Training | null>(null);

  useEffect(() => {
    fetchTrainings()
      .then(setTrainings)
      .catch(() => toast.error('Failed to load trainings.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = trainings.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setModal('create'); };
  const openEdit = (t: Training) => { setEditTarget(t); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditTarget(null); };

  const handleSaved = (saved: Training) => {
    setTrainings((prev) => {
      const idx = prev.findIndex((t) => t._id === saved._id);
      return idx >= 0
        ? prev.map((t) => (t._id === saved._id ? saved : t))
        : [saved, ...prev];
    });
    closeModal();
  };

  const handleDeleted = (id: string) => {
    setTrainings((prev) => prev.filter((t) => t._id !== id));
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p className="loading-text">Loading trainings…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {/* ── Header ── */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Training Programs</h1>
          <p className="adm-subtitle">
            {trainings.length} program{trainings.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button className="trn-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          Add Training
        </button>
      </div>

      {/* ── Search ── */}
      <div className="trn-search-wrap">
        <Search size={15} className="trn-search-icon" />
        <input
          className="trn-search"
          placeholder="Search by title or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="trn-search-clear" onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="trn-empty">
          <FolderOpen size={48} className="trn-empty-icon" />
          <p className="trn-empty-title">
            {search ? 'No trainings match your search' : 'No training programs yet'}
          </p>
          <p className="trn-empty-sub">
            {search ? 'Try a different keyword.' : 'Click "Add Training" to create the first one.'}
          </p>
          {!search && (
            <button className="trn-btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
              <Plus size={15} /> Add Training
            </button>
          )}
        </div>
      ) : (
        <div className="trn-grid">
          {filtered.map((t) => (
            <TrainingCard key={t._id} training={t} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {(modal === 'create' || modal === 'edit') && (
        <TrainingModal
          mode={modal}
          initial={editTarget}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          training={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirmed={handleDeleted}
        />
      )}
    </div>
  );
};
