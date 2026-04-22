import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Loader2, Users as UsersIcon, Clock, DollarSign,
  ArrowRight, X, Check, XCircle, Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import {
  listMarketplace, createCampaign, listApplicationsForCampaign, reviewApplication,
  CampaignDTO, ApplicationDTO,
} from '../../api/campaigns';
import { xpToLevel } from '../../components/creator/CreatorLevelBadge';
import MilestonesPanel from '../../components/creator/MilestonesPanel';
import { cn } from '../../lib/utils';

const fmtBudget = (c: number) => !c ? '—' : c >= 100_000_000 ? `$${(c / 100_000_000).toFixed(1)}M` : c >= 100_000 ? `$${(c / 100_000).toFixed(0)}K` : `$${(c / 100).toFixed(0)}`;

const AgencyCampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [q, setQ]                 = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'DRAFT' | 'SETTLED'>('all');
  const [openNew,  setOpenNew]    = useState(false);
  const [openDetail, setOpenDetail] = useState<CampaignDTO | null>(null);

  const fetchOwn = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Public marketplace list is filtered server-side to ACTIVE+is_public only,
      // so for DRAFT/SETTLED we fall back to a dedicated call — but for MVP the
      // filter below keeps only this user's campaigns from the marketplace view.
      const list = await listMarketplace({ limit: 100 });
      setCampaigns(list.filter(c => c.ownerId === user.id));
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchOwn(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return campaigns.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!term) return true;
      return c.title.toLowerCase().includes(term) || (c.description || '').toLowerCase().includes(term);
    });
  }, [campaigns, q, statusFilter]);

  const totalApps = campaigns.reduce((s, c) => s + c.applicationCount, 0);
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;

  /* Role gate — rendered after all hooks to keep hook order stable */
  if (user && user.role !== 'AGENCY') {
    return (
      <div className="animate-fade-in min-h-[calc(100vh-2rem)] flex items-center justify-center">
        <div className="surface p-8 max-w-[420px] text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-iris-soft text-iris mb-4">
            <Sparkles size={20} strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-[22px] font-semibold text-text mb-2">For agencies</h1>
          <p className="font-sans text-[13.5px] text-text-mute mb-6">
            Creating campaigns and reviewing applications is reserved for agency workspaces.
          </p>
          <Button variant="outline" onClick={() => navigate('/marketplace')}>
            Browse marketplace instead
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)]">
      <div className="surface p-5 lg:p-7 min-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 font-sans text-[13px] text-text-mute">
              <span>Workspace</span>
              <span className="text-text-faint">›</span>
              <span className="text-text font-medium">Campaigns</span>
            </div>
            <h1 className="font-display text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
              Your campaigns
            </h1>
            <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
              Draft briefs, publish to the marketplace, review applications.
            </p>
          </div>

          <Button variant="iris" onClick={() => setOpenNew(true)}>
            <Plus size={13} strokeWidth={2.25} /> New campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <StatMini label="Active"                value={`${activeCount}`} sub="currently accepting" />
          <StatMini label="Total applications"    value={`${totalApps}`}    sub="across all campaigns" />
          <StatMini label="Published"             value={`${campaigns.filter(c => c.isPublic).length}`} sub="visible in marketplace" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <div className="flex items-center gap-2 bg-surface-sunk border border-line focus-within:border-iris/40 rounded-full px-3.5 h-10 flex-1 min-w-[240px] max-w-[420px]">
            <Search size={14} className="text-text-faint" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search your campaigns…"
              className="flex-1 bg-transparent text-[13.5px] text-text placeholder:text-text-faint focus:outline-none"
            />
          </div>
          <div className="inline-flex items-center gap-1 p-1 bg-surface-sunk border border-line rounded-full">
            {(['all', 'ACTIVE', 'DRAFT', 'SETTLED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1 rounded-full font-sans text-[12px] font-medium transition',
                  statusFilter === s
                    ? 'bg-[#0d0f13] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                    : 'text-text-mute hover:text-text',
                )}
              >
                {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 text-center text-text-mute">
            <Loader2 size={16} className="animate-spin inline-block mr-2 align-middle" />
            Loading campaigns…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="font-display text-[16px] font-semibold text-text mb-1">
              {campaigns.length === 0 ? 'No campaigns yet' : 'No match'}
            </div>
            <p className="font-sans text-[13px] text-text-mute mb-4 max-w-[360px] mx-auto">
              {campaigns.length === 0
                ? 'Draft your first campaign — choose a brief, set a budget, and publish it when ready.'
                : 'Try a different filter.'}
            </p>
            {campaigns.length === 0 && (
              <Button variant="iris" size="sm" onClick={() => setOpenNew(true)}>
                <Plus size={12} strokeWidth={2.25} /> Create first campaign
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpenDetail(c)}
                className="surface-sunk p-4 text-left group hover:bg-surface-soft hover:border-line-strong transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <StatusTag status={c.status} isPublic={c.isPublic} />
                  <ArrowRight size={14} className="text-text-faint opacity-0 group-hover:opacity-100 transition" />
                </div>
                <h3 className="font-display text-[15px] font-bold text-text leading-tight mb-1 line-clamp-2 min-h-[40px]">{c.title}</h3>
                <p className="font-sans text-[12.5px] text-text-mute line-clamp-2 mb-3 min-h-[34px]">{c.brief || c.description || '—'}</p>
                <div className="flex items-center justify-between pt-3 border-t border-line font-sans text-[11.5px] text-text-mute">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <DollarSign size={11} /> <span className="text-text font-semibold">{fmtBudget(c.budgetCents)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <UsersIcon size={11} /> {c.applicationCount} {c.applicationCount === 1 ? 'app' : 'apps'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {c.deadlineAt ? new Date(c.deadlineAt).toLocaleDateString() : 'Rolling'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {openNew && <NewCampaignModal onClose={() => setOpenNew(false)} onCreated={() => { setOpenNew(false); void fetchOwn(); }} />}
      {openDetail && (
        <CampaignApplicationsDrawer
          campaign={openDetail}
          onClose={() => setOpenDetail(null)}
          onReviewed={() => void fetchOwn()}
        />
      )}
    </div>
  );
};

/* ─── bits ─── */

const StatMini: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
  <div className="surface-sunk p-4">
    <div className="font-sans text-[11px] uppercase tracking-wider text-text-mute">{label}</div>
    <div className="font-display text-[22px] font-semibold text-text tabular-nums leading-none mt-1">{value}</div>
    <div className="font-sans text-[11.5px] text-text-mute mt-1">{sub}</div>
  </div>
);

const StatusTag: React.FC<{ status: CampaignDTO['status']; isPublic: boolean }> = ({ status, isPublic }) => {
  const map = {
    ACTIVE:    isPublic ? 'bg-up/14 text-up' : 'bg-iris-soft text-iris',
    DRAFT:     'bg-amber/14 text-amber',
    SETTLED:   'bg-iris-soft text-iris',
    CANCELLED: 'bg-down/14 text-down',
  }[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold', map)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status.charAt(0) + status.slice(1).toLowerCase()}{status === 'ACTIVE' && !isPublic && ' · private'}
    </span>
  );
};

/* ─── New campaign modal ─── */

const NewCampaignModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [niche, setNiche] = useState('');
  const [brief, setBrief] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [publishNow, setPublishNow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (p: string) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createCampaign({
        title: title.trim(),
        brief: brief.trim() || undefined,
        niche: niche.trim() || undefined,
        platforms,
        budgetCents: budget ? Math.round(parseFloat(budget) * 100) : undefined,
        deadlineAt: deadline ? new Date(deadline).toISOString() : undefined,
        isPublic: publishNow,
        status: publishNow ? 'ACTIVE' : 'DRAFT',
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 animate-fade-in isolate">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={submit} className="relative surface w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-5 pb-3 border-b border-line flex items-start justify-between">
          <div>
            <h2 className="font-display text-[18px] font-semibold text-text">New campaign</h2>
            <p className="font-sans text-[12.5px] text-text-mute mt-0.5">
              Publish it now for creators to apply, or save as draft.
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full bg-surface-sunk border border-line text-text-mute hover:text-text">
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <Field label="Title" required>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Summer drop — Instagram reels" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Niche">
              <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Fashion, Tech, Beauty…" />
            </Field>
            <Field label="Budget (USD)">
              <Input type="number" min="0" step="10" value={budget} onChange={e => setBudget(e.target.value)} placeholder="5000" />
            </Field>
          </div>
          <Field label="Deadline">
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </Field>
          <Field label="Platforms">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['INSTAGRAM', 'YOUTUBE', 'TIKTOK'].map(p => {
                const active = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(p)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-[12.5px] font-medium transition-all',
                      active
                        ? 'bg-iris-soft border-iris/40 text-iris'
                        : 'bg-surface-sunk border-line text-text-soft hover:text-text hover:border-line-strong',
                    )}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Brief">
            <textarea
              rows={4}
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Deliverables, tone, do's and don'ts…"
              className="w-full bg-surface-sunk border border-line rounded-xl px-4 py-2 font-sans text-[13.5px] text-text placeholder:text-text-faint focus:outline-none focus:border-iris/40 resize-none"
            />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={publishNow} onChange={e => setPublishNow(e.target.checked)} className="w-4 h-4" />
            <span className="font-sans text-[13px] text-text-soft">
              Publish now — <span className="text-text-mute">visible in the creator marketplace</span>
            </span>
          </label>
          {error && <p className="font-sans text-[12px] text-down">{error}</p>}
        </div>

        <div className="px-6 py-3 border-t border-line flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="iris" size="sm" disabled={saving || !title.trim()}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} strokeWidth={2.5} />}
            {publishNow ? 'Create & publish' : 'Save draft'}
          </Button>
        </div>
      </form>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required }) => (
  <label className="block">
    <div className="font-sans text-[12px] text-text-soft font-semibold mb-1.5">
      {label}{required && <span className="text-iris ml-1">*</span>}
    </div>
    {children}
  </label>
);

/* ─── Applications review drawer ─── */

const CampaignApplicationsDrawer: React.FC<{
  campaign: CampaignDTO;
  onClose: () => void;
  onReviewed: () => void;
}> = ({ campaign, onClose, onReviewed }) => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<ApplicationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      setApps(await listApplicationsForCampaign(campaign.id));
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void fetch(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [campaign.id]);

  const review = async (appId: string, action: 'accept' | 'reject') => {
    setPending(appId);
    try {
      const updated = await reviewApplication(appId, action);
      setApps(prev => prev.map(a => a.id === appId ? { ...a, ...updated } : a));
      onReviewed();
    } catch { /* ignore */ }
    finally { setPending(null); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex animate-fade-in isolate">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="ml-auto relative w-full max-w-[560px] h-full bg-surface border-l border-line shadow-float flex flex-col">
        <div className="px-6 pt-5 pb-3 border-b border-line flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <StatusTag status={campaign.status} isPublic={campaign.isPublic} />
              {campaign.niche && (
                <span className="inline-flex px-2 py-0.5 rounded-full bg-iris-soft text-iris text-[10.5px] font-medium">
                  {campaign.niche}
                </span>
              )}
            </div>
            <h2 className="font-display text-[18px] font-semibold text-text truncate">{campaign.title}</h2>
            <p className="font-sans text-[11.5px] text-text-mute mt-0.5">
              {apps.length} application{apps.length === 1 ? '' : 's'} · budget {fmtBudget(campaign.budgetCents)}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full bg-surface-sunk border border-line text-text-mute hover:text-text transition">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-10 text-center text-text-mute">
              <Loader2 size={16} className="animate-spin inline-block mr-2 align-middle" />
              Loading applications…
            </div>
          ) : apps.length === 0 ? (
            <div className="py-10 text-center">
              <div className="font-sans text-[13px] text-text">No applications yet</div>
              <p className="font-sans text-[11.5px] text-text-mute mt-1">
                Share this brief with your roster or wait for creators to discover it.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {apps.map(a => (
                <li key={a.id} className="surface-sunk p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10 ring-1 ring-white/10">
                      <AvatarFallback className="bg-iris-grad text-white text-[13px] font-semibold">
                        {a.creator?.fullName.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => a.creator?.slug && navigate(`/u/${a.creator.slug}`)}
                        disabled={!a.creator?.slug}
                        className="font-sans text-[13.5px] font-semibold text-text hover:text-iris transition-colors text-left"
                      >
                        {a.creator?.fullName || '—'}
                      </button>
                      <div className="font-sans text-[11.5px] text-text-mute">
                        {a.creator?.niche || '—'} · LVL {xpToLevel(a.creator?.xp || 0)} · Trust {a.creator?.trustScore ?? 0}
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold',
                      a.status === 'PENDING'  ? 'bg-amber/14 text-amber' :
                      a.status === 'ACCEPTED' ? 'bg-up/14 text-up' :
                      a.status === 'REJECTED' ? 'bg-down/14 text-down' :
                                                'bg-text-faint/14 text-text-mute',
                    )}>
                      {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {a.pitch && (
                    <p className="font-sans text-[12.5px] text-text-soft leading-relaxed whitespace-pre-wrap mb-3 p-3 rounded-xl bg-[#0d0f13]/50 border border-line">
                      {a.pitch}
                    </p>
                  )}
                  {a.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="iris" size="sm" onClick={() => review(a.id, 'accept')} disabled={pending === a.id}>
                        {pending === a.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
                        Accept
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => review(a.id, 'reject')} disabled={pending === a.id}>
                        <XCircle size={12} strokeWidth={2.25} /> Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-sans text-[11.5px] text-text-mute">
                        Reviewed {a.reviewedAt ? new Date(a.reviewedAt).toLocaleDateString() : ''}
                      </span>
                      {a.status === 'ACCEPTED' && (
                        <Button
                          variant={expanded === a.id ? 'iris' : 'outline'}
                          size="sm"
                          onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                        >
                          {expanded === a.id ? 'Hide milestones' : 'Manage milestones'}
                        </Button>
                      )}
                    </div>
                  )}

                  {a.status === 'ACCEPTED' && expanded === a.id && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <MilestonesPanel
                        applicationId={a.id}
                        viewerRole="agency"
                        onChanged={onReviewed}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

export default AgencyCampaignsPage;
