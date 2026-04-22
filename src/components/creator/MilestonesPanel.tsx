import React, { useEffect, useState } from 'react';
import {
  Flag, Loader2, Plus, Send, DollarSign, Calendar, CheckCircle2, X, Circle, Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  listForApplication, createMilestone, submitMilestone, releaseMilestone,
  MilestoneDTO, MilestoneStatus,
} from '../../api/milestones';
import { cn } from '../../lib/utils';

type ViewerRole = 'agency' | 'creator';

interface Props {
  applicationId: string;
  viewerRole: ViewerRole;
  /** Optional callback so parent can refresh metadata (e.g. campaign appCount) */
  onChanged?: () => void;
}

const fmt$ = (cents: number) => {
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const STATUS_META: Record<MilestoneStatus, { label: string; cls: string }> = {
  PENDING:     { label: 'Pending',     cls: 'bg-text-faint/14 text-text-mute' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-iris-soft text-iris' },
  SUBMITTED:   { label: 'Submitted',   cls: 'bg-amber/14 text-amber' },
  APPROVED:    { label: 'Approved',    cls: 'bg-up/14 text-up' },
  RELEASED:    { label: 'Released',    cls: 'bg-up/14 text-up' },
};

const MilestonesPanel: React.FC<Props> = ({ applicationId, viewerRole, onChanged }) => {
  const [items, setItems] = useState<MilestoneDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Agency add form
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle]     = useState('');
  const [amount, setAmount]   = useState('');
  const [dueAt, setDueAt]     = useState('');
  const [saving, setSaving]   = useState(false);

  const [pending, setPending] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listForApplication(applicationId));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load milestones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    setSaving(true);
    setError('');
    try {
      const created = await createMilestone(applicationId, {
        title: title.trim(),
        amountCents: Math.round(parseFloat(amount) * 100),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        position: items.length,
      });
      setItems(prev => [...prev, created]);
      setTitle(''); setAmount(''); setDueAt('');
      setAddOpen(false);
      onChanged?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not create milestone.');
    } finally {
      setSaving(false);
    }
  };

  const act = async (id: string, kind: 'submit' | 'release') => {
    setPending(id);
    setError('');
    try {
      const updated = kind === 'submit'
        ? await submitMilestone(id)
        : await releaseMilestone(id);
      setItems(prev => prev.map(m => m.id === id ? updated : m));
      onChanged?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || `Could not ${kind} milestone.`);
    } finally {
      setPending(null);
    }
  };

  const total    = items.reduce((s, m) => s + m.amountCents, 0);
  const released = items.filter(m => m.status === 'RELEASED').reduce((s, m) => s + m.amountCents, 0);

  return (
    <div className="space-y-3">
      {/* Header with totals */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Flag size={14} className="text-iris" strokeWidth={2} />
          <span className="font-sans text-[13px] font-semibold text-text">
            Milestones
          </span>
          {items.length > 0 && (
            <span className="font-sans text-[11.5px] text-text-mute tabular-nums">
              · {fmt$(released)} / {fmt$(total)} released
            </span>
          )}
        </div>
        {viewerRole === 'agency' && !addOpen && (
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={12} strokeWidth={2.5} /> Add milestone
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 font-sans text-[12px] text-down">
          {error}
        </div>
      )}

      {/* Add form (agency) */}
      {viewerRole === 'agency' && addOpen && (
        <form onSubmit={handleAdd} className="surface-sunk p-3 space-y-2">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Deliverable title (e.g. Reel #1)"
            required
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#0d0f13] border border-line rounded-xl px-3 py-2 flex-1">
              <DollarSign size={13} className="text-text-mute" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Amount"
                className="flex-1 bg-transparent text-[13px] text-text focus:outline-none tabular-nums"
                required
              />
            </div>
            <div className="flex items-center gap-1.5 bg-[#0d0f13] border border-line rounded-xl px-3 py-2">
              <Calendar size={13} className="text-text-mute" />
              <input
                type="date"
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
                className="bg-transparent text-[12.5px] text-text focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setAddOpen(false); setError(''); }}>
              <X size={11} strokeWidth={2.25} /> Cancel
            </Button>
            <Button type="submit" variant="iris" size="sm" disabled={saving || !title.trim() || !amount}>
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} strokeWidth={2.5} />}
              Save
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="py-6 text-center text-text-mute text-[12px]">
          <Loader2 size={12} className="animate-spin inline-block mr-1.5 align-middle" />
          Loading milestones…
        </div>
      ) : items.length === 0 ? (
        <div className="surface-sunk p-5 text-center">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-iris-soft text-iris mb-2">
            <Flag size={16} strokeWidth={1.75} />
          </div>
          <p className="font-sans text-[12.5px] text-text">No milestones yet</p>
          <p className="font-sans text-[11px] text-text-mute mt-0.5">
            {viewerRole === 'agency'
              ? 'Break the deliverable into paid steps to track progress.'
              : 'The agency will add milestones once the work is scoped.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(m => {
            const meta = STATUS_META[m.status];
            const isSubmittable = viewerRole === 'creator' && (m.status === 'PENDING' || m.status === 'IN_PROGRESS');
            const isReleasable  = viewerRole === 'agency'  && m.status === 'SUBMITTED';
            const isDone        = m.status === 'RELEASED';
            return (
              <li
                key={m.id}
                className={cn(
                  'surface-sunk p-3 flex items-start gap-3 transition-colors',
                  isDone && 'bg-up/5 border-up/20',
                )}
              >
                <div className={cn('mt-0.5 w-5 h-5 shrink-0 rounded-full grid place-items-center', isDone ? 'bg-up text-white' : 'bg-surface-raised border border-line text-text-faint')}>
                  {isDone ? <Check size={12} strokeWidth={2.5} /> : <Circle size={10} strokeWidth={2} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-sans text-[13px] font-semibold text-text">{m.title}</span>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold', meta.cls)}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 font-sans text-[11.5px] text-text-mute">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <DollarSign size={10} /> {fmt$(m.amountCents)}
                    </span>
                    {m.dueAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={10} /> {new Date(m.dueAt).toLocaleDateString()}
                      </span>
                    )}
                    {m.releasedAt && (
                      <span className="inline-flex items-center gap-1 text-up">
                        <CheckCircle2 size={10} /> Paid {new Date(m.releasedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {(isSubmittable || isReleasable) && (
                    <div className="mt-2 flex items-center gap-2">
                      {isSubmittable && (
                        <Button variant="iris" size="sm" disabled={pending === m.id} onClick={() => act(m.id, 'submit')}>
                          {pending === m.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} strokeWidth={2.25} />}
                          Mark as submitted
                        </Button>
                      )}
                      {isReleasable && (
                        <Button variant="iris" size="sm" disabled={pending === m.id} onClick={() => act(m.id, 'release')}>
                          {pending === m.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} strokeWidth={2.25} />}
                          Approve &amp; release
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MilestonesPanel;
