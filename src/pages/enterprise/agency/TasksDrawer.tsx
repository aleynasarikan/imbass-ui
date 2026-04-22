import React, { useEffect, useState } from 'react';
import { ClipboardList, X, Loader2, Plus, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Avatar, AvatarFallback } from '../../../components/ui/Avatar';
import {
  createTask, getTasks, updateTaskStatus,
  AgencyTask, TaskStatus, RosterMember,
} from '../../../api/agency';
import { cn } from '../../../lib/utils';

interface Props {
  member: RosterMember;
  onClose: () => void;
}

const STATUS_META: Record<TaskStatus, { label: string; cls: string }> = {
  TODO:        { label: 'To do',       cls: 'bg-text-faint/14 text-text-mute' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-iris-soft text-iris' },
  REVIEW:      { label: 'Review',      cls: 'bg-amber/14 text-amber' },
  DONE:        { label: 'Done',        cls: 'bg-up/14 text-up' },
  CANCELLED:   { label: 'Cancelled',   cls: 'bg-down/14 text-down' },
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  TODO:        'IN_PROGRESS',
  IN_PROGRESS: 'REVIEW',
  REVIEW:      'DONE',
  DONE:        'TODO',
  CANCELLED:   'TODO',
};

const TasksDrawer: React.FC<Props> = ({ member, onClose }) => {
  const [tasks, setTasks]   = useState<AgencyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle]   = useState('');
  const [dueAt, setDueAt]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fetchTasks = async () => {
    try {
      const data = await getTasks({ creatorId: member.creator_id });
      setTasks(data);
    } catch {
      setError('Could not load tasks.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchTasks(); }, [member.creator_id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload: any = { title: title.trim(), creatorId: member.creator_id };
      if (dueAt) payload.dueAt = new Date(dueAt).toISOString();
      const created = await createTask(payload);
      setTasks(prev => [created, ...prev]);
      setTitle('');
      setDueAt('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save task.');
    } finally {
      setSaving(false);
    }
  };

  const advance = async (t: AgencyTask) => {
    const next = NEXT_STATUS[t.status];
    try {
      const updated = await updateTaskStatus(t.id, next);
      setTasks(prev => prev.map(x => x.id === t.id ? updated : x));
    } catch { /* silent */ }
  };

  const relTime = (d: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    const now = new Date();
    const diff = dt.getTime() - now.getTime();
    const days = Math.round(diff / 86400000);
    if (days === 0) return 'today';
    if (days > 0)  return `in ${days}d`;
    return `${-days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex animate-fade-in isolate">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="ml-auto relative w-full max-w-[460px] h-full bg-surface border-l border-line shadow-float flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-line flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-1 ring-white/10">
            <AvatarFallback className="bg-iris-grad text-white text-[13px] font-semibold">
              {member.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <ClipboardList size={13} className="text-iris" strokeWidth={2} />
              <span className="font-sans text-[11px] uppercase tracking-wide text-iris font-semibold">Tasks</span>
            </div>
            <h2 className="font-display text-[16px] font-semibold text-text truncate">{member.full_name}</h2>
            <p className="font-sans text-[11.5px] text-text-mute truncate">
              Track what needs to happen with this creator.
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
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="New task title…"
            className="w-full bg-surface-sunk border border-line rounded-xl px-3.5 py-2.5 font-sans text-[13px] text-text placeholder:text-text-faint focus:outline-none focus:border-iris/40 transition"
          />
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 bg-surface-sunk border border-line rounded-xl px-3 py-2 flex-1">
              <Calendar size={13} className="text-text-mute" />
              <input
                type="date"
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
                className="flex-1 bg-transparent text-[12.5px] text-text focus:outline-none"
              />
            </div>
            <Button type="submit" variant="iris" size="sm" disabled={saving || !title.trim()}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} strokeWidth={2.5} />}
              Add
            </Button>
          </div>
          {error && <p className="mt-2 font-sans text-[11.5px] text-down">{error}</p>}
        </form>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="py-10 text-center text-text-mute">
              <Loader2 size={16} className="animate-spin inline-block mr-2 align-middle" />
              Loading tasks…
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-iris-soft text-iris mb-3">
                <ClipboardList size={18} strokeWidth={1.75} />
              </div>
              <p className="font-sans text-[13px] text-text">No tasks yet</p>
              <p className="font-sans text-[11.5px] text-text-mute mt-1">Create one above.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map(t => {
                const meta = STATUS_META[t.status];
                return (
                  <li key={t.id} className="surface-sunk p-3 flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => advance(t)}
                      title={`Advance status → ${NEXT_STATUS[t.status]}`}
                      className={cn('mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0 hover:opacity-80 transition', meta.cls)}
                    >
                      {meta.label}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-sans text-[13px] text-text font-medium">{t.title}</div>
                      {t.description && (
                        <p className="font-sans text-[11.5px] text-text-mute mt-1 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 font-sans text-[11px] text-text-mute">
                        {t.due_at && (
                          <>
                            <Calendar size={10} strokeWidth={2} />
                            <span>{relTime(t.due_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

export default TasksDrawer;
