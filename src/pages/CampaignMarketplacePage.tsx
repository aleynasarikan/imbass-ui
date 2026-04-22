import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Calendar, Users as UsersIcon, DollarSign, Clock,
  ArrowUpRight, Loader2, CheckCircle2, Send, X, Plus,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import {
  listMarketplace, applyToCampaign, listMyApplications,
  CampaignDTO, ApplicationDTO,
} from '../api/campaigns';
import MilestonesPanel from '../components/creator/MilestonesPanel';
import { cn } from '../lib/utils';

const fmtBudget = (cents: number, currency: string = 'USD'): string => {
  if (!cents) return '—';
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)} ${currency}`;
};

const fmtDeadline = (iso: string | null): string => {
  if (!iso) return 'Rolling';
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const days = Math.round(diff / 86400000);
  if (days < 0)  return 'Closed';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7)   return `${days} days`;
  if (days < 30)  return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
};

const CampaignMarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCreator = user?.role === 'INFLUENCER';

  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [myApps, setMyApps]       = useState<ApplicationDTO[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState('');
  const [nicheFilter, setNicheFilter]       = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [detail, setDetail]       = useState<CampaignDTO | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, apps] = await Promise.all([
          listMarketplace(),
          isCreator ? listMyApplications().catch(() => []) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setCampaigns(list);
        setMyApps(apps);
      } catch {
        if (!cancelled) setCampaigns([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isCreator]);

  const niches = useMemo(
    () => Array.from(new Set(campaigns.map(c => c.niche).filter(Boolean))).sort() as string[],
    [campaigns],
  );
  const appliedIds = useMemo(() => new Set(myApps.map(a => a.campaignId)), [myApps]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return campaigns.filter(c => {
      if (nicheFilter !== 'all' && c.niche !== nicheFilter) return false;
      if (platformFilter !== 'all' && !c.platforms.includes(platformFilter)) return false;
      if (!term) return true;
      return (
        c.title.toLowerCase().includes(term) ||
        (c.description || '').toLowerCase().includes(term) ||
        (c.ownerName || '').toLowerCase().includes(term) ||
        (c.brief || '').toLowerCase().includes(term)
      );
    });
  }, [campaigns, q, nicheFilter, platformFilter]);

  const refreshApps = async () => {
    if (!isCreator) return;
    try { setMyApps(await listMyApplications()); } catch { /* ignore */ }
  };

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)]">
      <div className="surface p-5 lg:p-7 min-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 font-sans text-[13px] text-text-mute">
              <span>Discover</span>
              <span className="text-text-faint">›</span>
              <span className="text-text font-medium">Campaign marketplace</span>
            </div>
            <h1 className="font-display text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
              Campaign marketplace
            </h1>
            <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
              {isCreator
                ? 'Open briefs from brands and agencies — find the right fit and pitch.'
                : 'Browse what other agencies are running. Post your own campaign from the dashboard.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-surface-sunk border border-line">
              <UsersIcon size={13} className="text-text-mute" />
              <span className="font-sans text-[12px] text-text-soft tabular-nums">
                <span className="text-text font-semibold">{filtered.length}</span> / {campaigns.length} open briefs
              </span>
            </div>
            {user?.role === 'AGENCY' && (
              <Button variant="iris" onClick={() => navigate('/dashboard')}>
                <Plus size={13} strokeWidth={2.25} /> Create campaign
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <div className="flex items-center gap-2 bg-surface-sunk border border-line focus-within:border-iris/40 rounded-full px-3.5 h-10 flex-1 min-w-[240px] max-w-[420px]">
            <Search size={14} className="text-text-faint" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search brief, brand, keyword…"
              className="flex-1 bg-transparent text-[13.5px] text-text placeholder:text-text-faint focus:outline-none"
            />
          </div>
          <Pill
            value={nicheFilter}
            onChange={setNicheFilter}
            options={[
              { value: 'all', label: 'All niches' },
              ...niches.map(n => ({ value: n, label: n })),
            ]}
          />
          <Pill
            value={platformFilter}
            onChange={setPlatformFilter}
            options={[
              { value: 'all',       label: 'All platforms' },
              { value: 'INSTAGRAM', label: 'Instagram' },
              { value: 'YOUTUBE',   label: 'YouTube' },
              { value: 'TIKTOK',    label: 'TikTok' },
            ]}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 size={18} className="animate-spin inline-block mr-2 align-middle text-text-mute" />
            <span className="font-sans text-[13px] text-text-mute">Loading marketplace…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="font-display text-[16px] font-semibold text-text mb-1">No open briefs</div>
            <p className="font-sans text-[13px] text-text-mute">
              {campaigns.length === 0
                ? 'Seed the DB or ask your agency to publish a campaign.'
                : 'Try clearing a filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c, i) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                applied={appliedIds.has(c.id)}
                onClick={() => setDetail(c)}
                delay={i * 30}
              />
            ))}
          </div>
        )}
      </div>

      {detail && (
        <CampaignDetailDrawer
          campaign={detail}
          isCreator={isCreator}
          alreadyApplied={appliedIds.has(detail.id)}
          myApplication={myApps.find(a => a.campaignId === detail.id) ?? null}
          onClose={() => setDetail(null)}
          onApplied={() => { void refreshApps(); }}
        />
      )}
    </div>
  );
};

/* ─── sub-components ─── */

const Pill: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}> = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="appearance-none h-10 pl-3.5 pr-8 rounded-full bg-surface-sunk border border-line hover:border-line-strong focus:border-iris/40 focus:outline-none text-[12.5px] font-medium text-text transition-colors cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  </div>
);

const CampaignCard: React.FC<{
  campaign: CampaignDTO; applied: boolean; onClick: () => void; delay: number;
}> = ({ campaign, applied, onClick, delay }) => (
  <button
    type="button"
    onClick={onClick}
    className="surface-sunk p-4 text-left group hover:bg-surface-soft hover:border-line-strong transition-all animate-rise-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-1 min-w-0">
        {campaign.niche && (
          <span className="inline-flex px-2 py-0.5 rounded-full bg-iris-soft text-iris text-[10.5px] font-medium">
            {campaign.niche}
          </span>
        )}
        {applied && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-up/14 text-up text-[10.5px] font-semibold">
            <CheckCircle2 size={10} strokeWidth={2.5} /> Applied
          </span>
        )}
      </div>
      <ArrowUpRight size={14} className="text-text-faint opacity-0 group-hover:opacity-100 transition" />
    </div>

    <h3 className="font-display text-[15px] font-bold text-text leading-tight tracking-[-0.015em] mb-2 line-clamp-2 min-h-[40px]">
      {campaign.title}
    </h3>
    <p className="font-sans text-[12.5px] text-text-mute line-clamp-2 min-h-[34px] mb-3">
      {campaign.brief || campaign.description || 'No brief provided.'}
    </p>

    <div className="flex items-center gap-1 mb-3 flex-wrap">
      {campaign.platforms.slice(0, 3).map(p => (
        <span
          key={p}
          className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-[#0d0f13] border border-line text-[10px] font-medium text-text-soft capitalize"
        >
          {p.toLowerCase()}
        </span>
      ))}
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-line font-sans text-[11.5px] text-text-mute">
      <span className="inline-flex items-center gap-1">
        <DollarSign size={11} strokeWidth={2} />
        <span className="text-text font-semibold tabular-nums">{fmtBudget(campaign.budgetCents, campaign.currency)}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock size={11} strokeWidth={2} />
        {fmtDeadline(campaign.deadlineAt)}
      </span>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <UsersIcon size={11} strokeWidth={2} /> {campaign.applicationCount}
      </span>
    </div>
  </button>
);

const CampaignDetailDrawer: React.FC<{
  campaign: CampaignDTO;
  isCreator: boolean;
  alreadyApplied: boolean;
  myApplication: ApplicationDTO | null;
  onClose: () => void;
  onApplied: () => void;
}> = ({ campaign, isCreator, alreadyApplied, myApplication, onClose, onApplied }) => {
  const [pitch, setPitch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [submitted, setSubmitted]   = useState(alreadyApplied);

  const handleApply = async () => {
    setError('');
    setSubmitting(true);
    try {
      await applyToCampaign(campaign.id, pitch.trim() || undefined);
      setSubmitted(true);
      onApplied();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      // Auth issues usually mean the dev-bypass token is in localStorage —
      // tell the user plainly instead of showing a cryptic 403 message.
      if (status === 401 || status === 403) {
        setError(
          msg?.includes('INFLUENCER')
            ? 'Only creator accounts can apply. Sign in as a creator to continue.'
            : 'Your session expired or the backend did not accept your token. Sign out and sign in again.'
        );
      } else if (status === 409) {
        setError(msg || 'You have already applied to this campaign.');
        setSubmitted(true);  // flip to success-ish state so the button doesn't stay live
      } else if (!err?.response) {
        setError('Could not reach the backend. Is the server running on :5002?');
      } else {
        setError(msg || 'Could not send application.');
      }
      // eslint-disable-next-line no-console
      console.error('[apply] failed', { status, msg, err });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex animate-fade-in isolate">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="ml-auto relative w-full max-w-[540px] h-full bg-surface border-l border-line shadow-float flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-line flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              {campaign.niche && (
                <span className="inline-flex px-2 py-0.5 rounded-full bg-iris-soft text-iris text-[10.5px] font-medium">
                  {campaign.niche}
                </span>
              )}
              <span className="font-sans text-[11.5px] text-text-mute">
                · {campaign.ownerName || 'Brand'}
              </span>
            </div>
            <h2 className="font-display text-[20px] font-semibold text-text leading-tight">{campaign.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full bg-surface-sunk border border-line text-text-mute hover:text-text transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2">
            <Metric icon={DollarSign} label="Budget"   value={fmtBudget(campaign.budgetCents, campaign.currency)} />
            <Metric icon={Clock}      label="Deadline" value={fmtDeadline(campaign.deadlineAt)} />
            <Metric icon={UsersIcon}  label="Applied"  value={`${campaign.applicationCount}`} />
          </div>

          {campaign.platforms.length > 0 && (
            <div>
              <div className="font-sans text-[11px] uppercase tracking-wider text-text-mute mb-2">Platforms</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {campaign.platforms.map(p => (
                  <span key={p} className="inline-flex items-center h-7 px-2.5 rounded-full bg-surface-sunk border border-line text-[12px] font-medium text-text capitalize">
                    {p.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {campaign.brief && (
            <div>
              <div className="font-sans text-[11px] uppercase tracking-wider text-text-mute mb-2">Brief</div>
              <p className="font-sans text-[13.5px] text-text-soft leading-relaxed whitespace-pre-wrap">
                {campaign.brief}
              </p>
            </div>
          )}

          {campaign.description && (
            <div>
              <div className="font-sans text-[11px] uppercase tracking-wider text-text-mute mb-2">About</div>
              <p className="font-sans text-[13.5px] text-text-soft leading-relaxed whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>
          )}

          <div>
            <div className="font-sans text-[11px] uppercase tracking-wider text-text-mute mb-2">Timeline</div>
            <div className="flex items-center gap-3 font-sans text-[13px] text-text-soft">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} className="text-text-faint" />
                Posted {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
              {campaign.deadlineAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} className="text-text-faint" />
                  Closes {new Date(campaign.deadlineAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Apply */}
          {isCreator && !submitted && (
            <div className="pt-3 border-t border-line">
              <div className="font-sans text-[11px] uppercase tracking-wider text-text-mute mb-2">Your pitch</div>
              <textarea
                value={pitch}
                onChange={e => setPitch(e.target.value)}
                rows={4}
                placeholder="Why you're a great fit — content ideas, past work, availability…"
                className="w-full bg-surface-sunk border border-line rounded-xl px-3.5 py-2.5 font-sans text-[13px] leading-relaxed text-text placeholder:text-text-faint focus:outline-none focus:border-iris/40 transition resize-none"
              />
            </div>
          )}

          {submitted && !myApplication && (
            <div className="p-4 rounded-xl border border-up/25 bg-up/10 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-up shrink-0" strokeWidth={2.25} />
              <p className="font-sans text-[13px] text-up">
                Application sent. The brand will review and notify you.
              </p>
            </div>
          )}

          {/* Accepted creators see milestones inline */}
          {isCreator && myApplication?.status === 'ACCEPTED' && (
            <div className="pt-3 border-t border-line">
              <MilestonesPanel applicationId={myApplication.id} viewerRole="creator" />
            </div>
          )}

          {isCreator && myApplication && myApplication.status !== 'ACCEPTED' && myApplication.status !== 'PENDING' && (
            <div className="p-4 rounded-xl border border-down/20 bg-down/5 flex items-center gap-2">
              <p className="font-sans text-[13px] text-down">
                Application {myApplication.status.toLowerCase()}.
              </p>
            </div>
          )}

          {isCreator && myApplication?.status === 'PENDING' && (
            <div className="p-4 rounded-xl border border-amber/25 bg-amber/10 flex items-center gap-2">
              <p className="font-sans text-[13px] text-amber">
                Application under review.
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-line space-y-3">
          {error && (
            <div className="rounded-xl border border-down/30 bg-down/10 px-3.5 py-2.5 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-down mt-1.5 shrink-0" />
              <p className="font-sans text-[12.5px] text-down leading-snug">{error}</p>
            </div>
          )}
          {isCreator && !submitted ? (
            <Button variant="iris" className="w-full" onClick={handleApply} disabled={submitting}>
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2.25} />}
              Send application
            </Button>
          ) : !isCreator ? (
            <p className="text-center font-sans text-[12px] text-text-mute">
              Only creators can apply. Switch to an influencer workspace to pitch.
            </p>
          ) : (
            <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
          )}
        </div>
      </aside>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="surface-sunk p-3">
    <div className="flex items-center gap-1 font-sans text-[11px] text-text-mute mb-1">
      <Icon size={11} strokeWidth={2} /> {label}
    </div>
    <div className={cn('font-display text-[15px] font-semibold text-text tabular-nums leading-none')}>
      {value}
    </div>
  </div>
);

export default CampaignMarketplacePage;
