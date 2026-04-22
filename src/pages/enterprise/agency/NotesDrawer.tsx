import React, { useEffect, useState } from 'react';
import { MessageSquare, X, Pin, Loader2, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Avatar, AvatarFallback } from '../../../components/ui/Avatar';
import { addNote, getNotes, AgencyNote, RosterMember } from '../../../api/agency';
import { cn } from '../../../lib/utils';

interface Props {
  member: RosterMember;
  onClose: () => void;
}

const NotesDrawer: React.FC<Props> = ({ member, onClose }) => {
  const [notes, setNotes] = useState<AgencyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchNotes = async () => {
    try {
      const data = await getNotes(member.creator_id);
      setNotes(data);
    } catch {
      setError('Could not load notes.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchNotes(); }, [member.creator_id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    setError('');
    try {
      const created = await addNote(member.creator_id, draft.trim(), isPinned);
      setNotes(prev => [created, ...prev].sort((a,b) => Number(b.is_pinned) - Number(a.is_pinned)));
      setDraft('');
      setIsPinned(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex animate-fade-in isolate">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="ml-auto relative w-full max-w-[460px] h-full bg-surface border-l border-line shadow-float flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-line flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-1 ring-white/10">
            <AvatarFallback className="bg-iris-grad text-white text-[13px] font-semibold">
              {member.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={13} className="text-iris" strokeWidth={2} />
              <span className="font-sans text-[11px] uppercase tracking-wide text-iris font-semibold">Notes</span>
            </div>
            <h2 className="font-display text-[16px] font-semibold text-text truncate">{member.full_name}</h2>
            <p className="font-sans text-[11.5px] text-text-mute truncate">
              Internal notes — only visible to your agency team.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full bg-surface-sunk border border-line text-text-mute hover:text-text transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Composer */}
        <form onSubmit={submit} className="px-5 pt-4 pb-3 border-b border-line">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            placeholder="Write a note… deadlines, performance, preferences, anything."
            className="w-full bg-surface-sunk border border-line rounded-xl px-3.5 py-2.5 font-sans text-[13px] leading-relaxed text-text placeholder:text-text-faint focus:outline-none focus:border-iris/40 transition resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="sr-only"
              />
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-sans text-[11px] font-medium border transition-all',
                isPinned
                  ? 'bg-iris-soft border-iris/30 text-iris'
                  : 'bg-surface-sunk border-line text-text-mute hover:text-text',
              )}>
                <Pin size={10} strokeWidth={2.25} />
                {isPinned ? 'Pinned' : 'Pin to top'}
              </span>
            </label>
            <Button
              type="submit"
              variant="iris"
              size="sm"
              disabled={saving || !draft.trim()}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} strokeWidth={2.5} />}
              Save note
            </Button>
          </div>
          {error && (
            <p className="mt-2 font-sans text-[11.5px] text-down">{error}</p>
          )}
        </form>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="py-10 text-center text-text-mute">
              <Loader2 size={16} className="animate-spin inline-block mr-2 align-middle" />
              Loading notes…
            </div>
          ) : notes.length === 0 ? (
            <div className="py-10 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-iris-soft text-iris mb-3">
                <MessageSquare size={18} strokeWidth={1.75} />
              </div>
              <p className="font-sans text-[13px] text-text">No notes yet</p>
              <p className="font-sans text-[11.5px] text-text-mute mt-1">Start jotting things down above.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notes.map(n => (
                <li
                  key={n.id}
                  className={cn(
                    'surface-sunk p-3 relative',
                    n.is_pinned && 'border-iris/40 bg-iris-soft/20',
                  )}
                >
                  {n.is_pinned && (
                    <span className="absolute top-2 right-3 inline-flex items-center gap-0.5 text-iris text-[10px] font-semibold">
                      <Pin size={9} strokeWidth={2.5} /> pinned
                    </span>
                  )}
                  <p className="font-sans text-[13px] text-text leading-relaxed whitespace-pre-wrap">{n.body}</p>
                  <div className="flex items-center gap-1.5 mt-2 font-sans text-[11px] text-text-mute">
                    <span>{n.author_name || 'Agency'}</span>
                    <span className="text-text-faint">·</span>
                    <time>{new Date(n.created_at).toLocaleDateString()}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

export default NotesDrawer;
