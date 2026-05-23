import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare, Send, Trash2, Loader2,
  CornerDownRight, X,
} from 'lucide-react';
import { fetchComments, addComment, deleteComment } from '@/services/comment.api';
import { useAuth } from '@/contexts/AuthContext';
import type { Comment } from '@/types';

interface CommentSectionProps {
  assignmentId: string;
}

const CommentSection = ({ assignmentId }: CommentSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [replyTo, setReplyTo]   = useState<Comment | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // ── Load comments ──
  useEffect(() => {
    setLoading(true);
    fetchComments(assignmentId)
      .then(setComments)
      .catch(() => toast.error('Could not load comments.'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  // ── Auto-scroll on new message ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // ── Actions ──
  const handleReply = (c: Comment) => {
    setReplyTo(c);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const newComment = await addComment(assignmentId, text.trim(), replyTo?._id);
      setComments((prev) => [...prev, newComment]);
      setText('');
      setReplyTo(null);
    } catch {
      toast.error('Failed to post comment.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(assignmentId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      toast.error('Failed to delete comment.');
    }
  };

  // Admins can delete anyone's comment; others only their own
  const canDelete = (c: Comment) =>
    user?.role === 'admin' || c.author?.id === user?.id;

  // ── Loading ──
  if (loading) {
    return (
      <div className="kb-comments-loading">
        <Loader2 size={18} className="kb-spin" />
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="kb-comment-section">

      {/* ── Heading ── */}
      <h4 className="kb-comment-heading">
        <MessageSquare size={14} />
        Comments ({comments.length})
      </h4>

      {/* ── Chat thread ── */}
      <div className="kb-chat-thread custom-scrollbar">
        {comments.length === 0 ? (
          <p className="kb-comment-empty">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => {
            const isOwn    = c.author?.id === user?.id;
            const initial  = (c.author?.name ?? '?')[0].toUpperCase();
            const isAdmin  = c.author?.role === 'admin';

            return (
              <div
                key={c._id}
                className={`kb-chat-row ${isOwn ? 'kb-chat-row-own' : ''}`}
              >
                {/* Avatar */}
                <div
                  className="kb-chat-avatar"
                  style={
                    isOwn
                      ? { background: '#4f46e5', color: '#fff' }
                      : isAdmin
                      ? { background: '#c52031', color: '#fff' }
                      : { background: '#e5e7eb', color: '#374151' }
                  }
                >
                  {initial}
                </div>

                {/* Bubble group: name + box + footer */}
                <div className="kb-chat-group">

                  {/* Sender name + role badge */}
                  <div className={`kb-chat-sender ${isOwn ? 'kb-chat-sender-own' : ''}`}>
                    <span className="kb-chat-sender-name">
                      {isOwn ? 'You' : (c.author?.name ?? 'Unknown')}
                    </span>
                    {isAdmin && (
                      <span className="kb-chat-admin-tag">Admin</span>
                    )}
                  </div>

                  {/* Message box */}
                  <div className={`kb-chat-box ${isOwn ? 'kb-chat-box-own' : ''}`}>

                    {/* Reply quote preview */}
                    {c.replyTo && (
                      <div className={`kb-chat-quote ${isOwn ? 'kb-chat-quote-own' : ''}`}>
                        <span className="kb-chat-quote-author">
                          {c.replyTo.author?.name ?? 'Unknown'}
                        </span>
                        <span className="kb-chat-quote-text">
                          {c.replyTo.text.length > 65
                            ? c.replyTo.text.slice(0, 65) + '…'
                            : c.replyTo.text}
                        </span>
                      </div>
                    )}

                    {/* Message text */}
                    <p className="kb-chat-text">{c.text}</p>
                  </div>

                  {/* Footer: time + Reply + Delete */}
                  <div className={`kb-chat-footer ${isOwn ? 'kb-chat-footer-own' : ''}`}>
                    <span className="kb-chat-time">
                      {new Date(c.createdAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <button
                      className="kb-chat-reply-btn"
                      onClick={() => handleReply(c)}
                      title="Reply"
                    >
                      <CornerDownRight size={10} /> Reply
                    </button>
                    {canDelete(c) && (
                      <button
                        className="kb-chat-del-btn"
                        onClick={() => handleDelete(c._id)}
                        title="Delete"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── "Replying to …" chip ── */}
      {replyTo && (
        <div className="kb-reply-context">
          <CornerDownRight size={12} />
          <span>
            Replying to <strong>{replyTo.author?.name ?? 'Unknown'}</strong>
          </span>
          <button
            className="kb-reply-context-clear"
            onClick={() => setReplyTo(null)}
            title="Cancel reply"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="kb-chat-input-bar">
        <textarea
          ref={inputRef}
          className="kb-chat-input"
          placeholder={
            replyTo
              ? `Reply to ${replyTo.author?.name ?? 'comment'}…`
              : 'Type a message…'
          }
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="kb-chat-send-btn"
          onClick={handleSend}
          disabled={sending || !text.trim()}
          title="Send (Enter)"
        >
          {sending
            ? <Loader2 size={16} className="kb-spin" />
            : <Send size={16} />}
        </button>
      </div>

    </div>
  );
};

export default CommentSection;
