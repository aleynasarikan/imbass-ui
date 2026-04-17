import React, { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../components/ui/Dialog';
import { Plus, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../api';
import { useAuth } from '../context/AuthContext';

interface Campaign {
  id: string;
  name: string;
  assignedTo: string;
  week: string;
  status: string;
}

type BriefKind = 'live' | 'closing' | 'direct' | 'archived';

const CATEGORIES = ['Beauty', 'Tech', 'Food & Bev', 'Fashion', 'Gaming', 'Auto'] as const;
const FORMATS = ['Reels + TikTok', 'Long-form', 'Carousel', 'Twitch', 'Multi-format', 'Reels'] as const;
const AGENCIES = [
  'Lumen & Co.', 'Parity Labs', 'Karaköy Table', 'North & Field',
  'Axis Play', 'Atlas Motors', 'Mercer Roasters', 'Quorum Home',
];

// Deterministic string hash -> positive int
const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
};

const pick = <T,>(arr: readonly T[], seed: number, offset = 0): T =>
  arr[(seed + offset) % arr.length];

// Derive decorative display fields deterministically
const decorate = (c: Campaign, i: number) => {
  const h = hash(c.id + c.name);
  const kind: BriefKind =
    c.status === 'OPEN' ? (h % 7 === 0 ? 'closing' : 'live')
    : c.status === 'ASSIGNED' ? 'direct'
    : c.status === 'IN_REVIEW' ? 'closing'
    : 'archived';

  const rateLow = 6 + (h % 14);               // 6—19K
  const rateHigh = rateLow + 4 + (h % 8);     // +4—11
  const windowDays = 7 + (h % 24);            // 7—30
  const audiences = ['10—50K', '50—250K', '80K+', '150K+', '200K+', '500K+'];
  const applied = (h % 90) + 3;               // 3—92
  const invited = 3 + (h % 6);                // 3—8
  const closingH = 12 + (h % 60);             // 12—71h

  return {
    kind,
    category: pick(CATEGORIES, h, 0),
    format: pick(FORMATS, h, 2),
    agency: pick(AGENCIES, h, i),
    rate: kind === 'direct' ? `₺${rateHigh * 2}K` : `₺${rateLow}—${rateHigh}K`,
    windowDays,
    audience: pick(audiences, h, 3),
    applied,
    invited,
    closingH,
    number: String(142 - i).padStart(4, '0'),
  };
};

const FILTERS = [
  'All',
  ...CATEGORIES,
  'Closing ≤ 72h',
  'Direct offers',
] as const;
type Filter = typeof FILTERS[number];

const AdCollaboration: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newAdName, setNewAdName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [filter, setFilter] = useState<Filter>('All');

  const isAgency = user?.role !== 'INFLUENCER';

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get<Campaign[]>('/campaigns');
      setAds(res.data);
    } catch { /* dev mode */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const decorated = useMemo(
    () => ads.map((a, i) => ({ ad: a, ...decorate(a, i) })),
    [ads]
  );

  const visible = useMemo(() => {
    if (filter === 'All') return decorated;
    if (filter === 'Closing ≤ 72h') return decorated.filter(d => d.kind === 'closing');
    if (filter === 'Direct offers')  return decorated.filter(d => d.kind === 'direct');
    return decorated.filter(d => d.category === filter);
  }, [decorated, filter]);

  const counts = useMemo(() => ({
    live:    decorated.filter(d => d.kind === 'live').length,
    closing: decorated.filter(d => d.kind === 'closing').length,
    direct:  decorated.filter(d => d.kind === 'direct').length,
  }), [decorated]);

  const handleCreateAd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAdName) return;
    setSubmitting(true); setError(null);
    try {
      await api.post('/campaigns', { title: newAdName });
      setNewAdName('');
      setIsCreateModalOpen(false);
      fetchCampaigns();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create campaign');
    } finally { setSubmitting(false); }
  };

  const openApplyModal = (adId: string) => {
    setSelectedAdId(adId);
    setError(null);
    setIsApplyModalOpen(true);
  };

  const handleApplyForAd = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAdId) return;
    setSubmitting(true); setError(null);
    try {
      await api.post(`/campaigns/${selectedAdId}/apply`);
      setIsApplyModalOpen(false);
      setSelectedAdId(null);
      fetchCampaigns();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to apply for campaign');
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="meta-label">Loading the classifieds…</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      {/* ═════ Page head ═════ */}
      <header className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 font-sans text-[13px] text-text-mute">
            <span>Workspace</span>
            <span className="text-text-faint">›</span>
            <span>Campaigns</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[30px] md:text-[34px] font-semibold text-text tracking-[-0.02em] leading-tight">
              Campaigns
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-iris-soft text-iris-deep text-[11px] font-medium rounded-full">
              {decorated.length} open
            </span>
          </div>
          <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
            {isAgency
              ? 'Publish briefs to the community or invite named creators directly.'
              : 'Browse open briefs, apply to the ones that fit, or watch your direct invites.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">Export</Button>
          {isAgency && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={13} strokeWidth={2.25} /> New brief
            </Button>
          )}
        </div>
      </header>

      {/* ═════ Summary cards ═════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[
          { k: 'Live · Open',    v: counts.live,    hint: 'Applications flowing',   tint: 'bg-iris-soft text-iris-deep' },
          { k: 'Closing ≤ 72h',  v: counts.closing, hint: 'Act before deadline',    tint: 'bg-[#ffe4d4] text-[#a8491a]' },
          { k: 'Direct Invites', v: counts.direct,  hint: 'Named creators only',    tint: 'bg-[#dff5ec] text-[#0a6a4a]' },
        ].map((s, i) => (
          <div
            key={s.k}
            className="surface p-5 flex items-center justify-between animate-rise-in"
            style={{ animationDelay: `${60 * i}ms` }}
          >
            <div>
              <span className={cn('inline-block font-sans text-[11px] font-medium px-2 py-0.5 rounded-full mb-2', s.tint)}>
                {s.k}
              </span>
              <div className="font-sans text-[12px] text-text-mute">{s.hint}</div>
            </div>
            <span className="font-display text-[40px] leading-none text-text tabular-nums font-semibold">
              {s.v}
            </span>
          </div>
        ))}
      </div>

      {/* ═════ Filter chips ═════ */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {FILTERS.map(f => {
          const on = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-sans font-medium transition-all',
                on
                  ? 'bg-iris text-white shadow-coral'
                  : 'bg-white border border-line text-text-mute hover:border-line-strong hover:text-text'
              )}
            >
              {f}
              {f === 'All' && (
                <span className={cn('text-[11px] font-mono', on ? 'text-white/80' : 'text-text-faint')}>
                  {decorated.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═════ Brief grid ═════ */}
      {visible.length === 0 ? (
        <div className="surface py-20 flex flex-col items-center text-center">
          <span className="kicker mb-3">Nothing matches</span>
          <h2 className="font-display text-[22px] font-semibold text-text">No briefs found</h2>
          <p className="font-sans text-[13px] text-text-mute mt-2 max-w-sm">
            Try a different filter, or wait for the next drop. Briefs refresh every hour.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 animate-rise-in"
          style={{ animationDelay: '160ms' }}
        >
          {visible.map(({ ad, ...d }, i) => {
            const badge =
              d.kind === 'live'     ? { t: 'Live · Open',            cls: 'bg-[#e7f7ee] text-[#0f7a3d]' } :
              d.kind === 'closing'  ? { t: `Closing · ${d.closingH}h`, cls: 'bg-[#ffe4d4] text-[#a8491a]' } :
              d.kind === 'direct'   ? { t: 'Direct · Invite',          cls: 'bg-iris-soft text-iris-deep' } :
                                      { t: 'Archived',                 cls: 'bg-surface-sunk text-text-mute' };

            return (
              <article
                key={ad.id}
                className="surface p-5 flex flex-col group hover:-translate-y-0.5 hover:shadow-pop transition-all cursor-pointer"
                onClick={() =>
                  ad.status === 'OPEN' && !isAgency ? openApplyModal(ad.id) : undefined
                }
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 font-sans text-[11px] font-medium px-2.5 py-1 rounded-full',
                    badge.cls
                  )}>
                    {d.kind === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-up animate-pulse-dot" />}
                    {badge.t}
                  </span>
                  <span className="font-mono text-[11px] tracking-wider-x text-text-faint tabular-nums">
                    Nº {d.number}
                  </span>
                </div>

                <h3 className="font-display text-[17px] font-semibold leading-snug text-text mb-1.5 min-h-[42px]">
                  {ad.name}
                </h3>

                <p className="font-sans text-[12.5px] text-text-mute mb-5">
                  by <strong className="text-text font-semibold">{d.agency}</strong>
                  {' · '}{d.category}{' · '}{d.format}
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 mt-auto border-t border-line">
                  <Stat k="Rate" v={d.rate} />
                  <Stat k="Window" v={`${d.windowDays}d`} />
                  <Stat
                    k={d.kind === 'direct' ? 'Invited' : 'Applied'}
                    v={String(d.kind === 'direct' ? d.invited : d.applied)}
                  />
                  <Stat k="Audience" v={d.audience} />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex -space-x-2">
                    {[0, 1, 2].map(k => (
                      <span
                        key={k}
                        className="w-6 h-6 rounded-full ring-2 ring-white grid place-items-center text-white font-sans text-[10px] font-semibold"
                        style={{
                          background: [IRIS_BG, CORAL_BG, MINT_BG][k],
                        }}
                      >
                        {['A', 'M', 'K'][k]}
                      </span>
                    ))}
                  </div>
                  <span className="font-sans text-[12px] text-iris font-medium opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all inline-flex items-center gap-1">
                    {d.kind === 'direct' ? 'View offer' : (ad.status === 'OPEN' && !isAgency ? 'Apply' : 'Open')}
                    <ArrowUpRight size={13} strokeWidth={2.25} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-8 font-sans text-[12px] text-text-faint">
        <span>{visible.length} shown · {decorated.length} total</span>
        <span>All rates in TRY</span>
      </div>

      {/* ═════ Create Dialog ═════ */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New brief</DialogTitle>
            <DialogDescription>
              Give the campaign a title. You can set channel, rate, and window in the next step.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="px-3 py-2 rounded-lg bg-[#ffe5e8] text-[#a8232d] text-[13px] font-sans">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateAd} className="space-y-4">
            <div>
              <label className="block font-sans text-[12px] font-medium text-text-soft mb-1.5">Campaign title</label>
              <Input
                placeholder="e.g. Spring drop — serum campaign"
                value={newAdName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAdName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create brief'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═════ Apply Dialog ═════ */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for this brief</DialogTitle>
            <DialogDescription>
              Your profile, rate card, and recent work will be shared with the brand team.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="px-3 py-2 rounded-lg bg-[#ffe5e8] text-[#a8232d] text-[13px] font-sans">
              {error}
            </div>
          )}
          <form onSubmit={handleApplyForAd}>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const IRIS_BG  = '#6d5bff';
const CORAL_BG = '#ff7aa4';
const MINT_BG  = '#5fd3b4';

const Stat: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div>
    <div className="font-sans text-[11px] text-text-faint mb-0.5 font-medium">{k}</div>
    <div className="font-display text-[15px] text-text tabular-nums font-semibold">{v}</div>
  </div>
);

export default AdCollaboration;
