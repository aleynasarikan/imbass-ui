import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowUpRight, Filter as FilterIcon, Users as UsersIcon, ExternalLink, WifiOff } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import CreatorLevelBadge from '../components/creator/CreatorLevelBadge';
import TrustScoreBadge from '../components/creator/TrustScoreBadge';
import FollowButton from '../components/creator/FollowButton';
import { CREATORS, PLATFORMS, MockCreator, formatFollowers, dtoToMockCreator } from '../data/creators';
import { listCreators } from '../api/creators';
import { followStore } from '../lib/stores/follows';
import { cn } from '../lib/utils';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [platformFilter, setPlatformFilter] = useState<MockCreator['platforms'][number] | 'all'>('all');
  const [nicheFilter, setNicheFilter] = useState<string | 'all'>('all');
  const [availability, setAvailability] = useState<'all' | 'available'>('all');
  const [detail, setDetail] = useState<MockCreator | null>(null);

  const [creators, setCreators] = useState<MockCreator[]>(CREATORS);
  const [source, setSource] = useState<'api' | 'mock'>('mock');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dtos = await listCreators();
        if (cancelled) return;
        if (dtos.length > 0) {
          // Register slug→userId for every creator so follow toggles can hit server
          dtos.forEach(d => followStore.registerCreator(d.slug, d.userId));
          setCreators(dtos.map(dtoToMockCreator));
          setSource('api');
        } else {
          setCreators(CREATORS);
          setSource('mock');
        }
      } catch {
        if (!cancelled) { setCreators(CREATORS); setSource('mock'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Dynamic niches: API results may introduce new niches not in the mock list
  const niches = useMemo(() => Array.from(new Set(creators.map(c => c.niche))).sort(), [creators]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return creators.filter(c => {
      if (platformFilter !== 'all' && !c.platforms.includes(platformFilter)) return false;
      if (nicheFilter !== 'all' && c.niche !== nicheFilter) return false;
      if (availability === 'available' && !c.available) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        c.handle.toLowerCase().includes(term) ||
        c.niche.toLowerCase().includes(term) ||
        c.location.toLowerCase().includes(term)
      );
    });
  }, [creators, q, platformFilter, nicheFilter, availability]);

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)]">
      <div className="surface p-5 lg:p-7 min-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 font-sans text-[13px] text-text-mute">
              <span>Discover</span>
              <span className="text-text-faint">›</span>
              <span className="text-text font-medium">Creator marketplace</span>
            </div>
            <h1 className="font-display text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
              Creator marketplace
            </h1>
            <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
              Discover creators by platform, niche, and track record. Invite directly to your campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {source === 'mock' && !loading && (
              <span
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-amber/15 border border-amber/30 text-amber text-[11.5px] font-medium"
                title="Backend unreachable — showing seeded mock data."
              >
                <WifiOff size={11} strokeWidth={2.25} /> Offline sample
              </span>
            )}
            <div className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-surface-sunk border border-line">
              <UsersIcon size={13} className="text-text-mute" strokeWidth={2} />
              <span className="font-sans text-[12px] text-text-soft tabular-nums">
                <span className="text-text font-semibold">{filtered.length}</span> / {creators.length} creators
              </span>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <div className="flex items-center gap-2 bg-surface-sunk border border-line focus-within:border-iris/40 focus-within:bg-surface-soft rounded-full px-3.5 h-10 flex-1 min-w-[240px] max-w-[420px] transition-all">
            <Search size={14} className="text-text-faint" strokeWidth={1.75} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, niche, location…"
              className="flex-1 bg-transparent text-[13.5px] text-text placeholder:text-text-faint focus:outline-none"
            />
          </div>

          <SelectPill
            value={platformFilter}
            onChange={(v) => setPlatformFilter(v as any)}
            options={[
              { value: 'all', label: 'All platforms' },
              ...PLATFORMS.map(p => ({ value: p.key, label: p.label })),
            ]}
          />
          <SelectPill
            value={nicheFilter}
            onChange={(v) => setNicheFilter(v)}
            options={[
              { value: 'all', label: 'All niches' },
              ...niches.map(n => ({ value: n, label: n })),
            ]}
          />
          <SelectPill
            value={availability}
            onChange={(v) => setAvailability(v as any)}
            options={[
              { value: 'all',       label: 'Any availability' },
              { value: 'available', label: 'Available now' },
            ]}
          />

          <button className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-surface-sunk border border-line hover:border-line-strong text-[12.5px] font-medium text-text-soft hover:text-text transition">
            <FilterIcon size={13} strokeWidth={2} />
            More filters
          </button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 grid place-items-center">
            <div className="text-center">
              <div className="font-display text-[16px] font-semibold text-text mb-1">No creators match</div>
              <p className="font-sans text-[13px] text-text-mute">Try clearing a filter or widening your niche.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((c, i) => (
              <CreatorCard
                key={c.id}
                creator={c}
                onClick={() => setDetail(c)}
                delay={i * 30}
              />
            ))}
          </div>
        )}
      </div>

      {detail && (
        <CreatorDetailDrawer
          creator={detail}
          onClose={() => setDetail(null)}
          onOpenProfile={() => navigate(`/u/${detail.slug}`)}
        />
      )}
    </div>
  );
};

/* ─── sub-components ─── */

interface SelectPillProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}
function SelectPill<T extends string>({ value, onChange, options }: SelectPillProps<T>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none h-10 pl-3.5 pr-8 rounded-full bg-surface-sunk border border-line hover:border-line-strong focus:border-iris/40 focus:outline-none text-[12.5px] font-medium text-text transition-colors cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    </div>
  );
}

const CreatorCard: React.FC<{ creator: MockCreator; onClick: () => void; delay: number }> = ({ creator, onClick, delay }) => (
  <div
    className="relative surface-sunk p-4 group hover:bg-surface-soft hover:border-line-strong transition-all animate-rise-in cursor-pointer"
    style={{ animationDelay: `${delay}ms` }}
    onClick={onClick}
  >
    {/* Corner bookmark/follow */}
    <div className="absolute top-3 right-3 z-10">
      <FollowButton slug={creator.slug} variant="compact" asBookmark />
    </div>

    <div className="flex items-start gap-3 mb-3">
      <Avatar className="h-12 w-12 ring-1 ring-white/10">
        <AvatarFallback className="bg-iris-grad text-white text-[15px] font-semibold">
          {creator.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-[13.5px] font-semibold text-text truncate">{creator.name}</span>
          {creator.available && (
            <span className="w-1.5 h-1.5 rounded-full bg-up" title="Available now" />
          )}
        </div>
        <div className="font-sans text-[11.5px] text-text-mute truncate">@{creator.handle}</div>
      </div>
    </div>

    <div className="mb-3">
      <CreatorLevelBadge xp={creator.xp} variant="compact" />
    </div>

    <p className="font-sans text-[12.5px] text-text-soft leading-snug mb-3 line-clamp-2 min-h-[34px]">
      {creator.bio}
    </p>

    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
      <div className="flex items-center gap-1">
        {creator.platforms.map(p => (
          <span
            key={p}
            className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-[#0d0f13] border border-line text-[10.5px] font-medium text-text-soft capitalize"
          >
            {p}
          </span>
        ))}
      </div>
      <TrustScoreBadge score={creator.trust} />
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-line">
      <div className="flex items-center gap-3 text-text-mute font-sans text-[11.5px]">
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} strokeWidth={2} /> {creator.location}
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <UsersIcon size={11} strokeWidth={2} /> {formatFollowers(creator.followers)}
        </span>
      </div>
      <span className="opacity-0 group-hover:opacity-100 text-iris transition-opacity">
        <ArrowUpRight size={14} strokeWidth={2.25} />
      </span>
    </div>
  </div>
);

const CreatorDetailDrawer: React.FC<{
  creator: MockCreator;
  onClose: () => void;
  onOpenProfile: () => void;
}> = ({ creator, onClose, onOpenProfile }) => (
  <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-4 md:p-6 animate-fade-in">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative surface w-full max-w-[560px] p-6 max-h-[88vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full bg-surface-sunk border border-line text-text-mute hover:text-text hover:border-line-strong transition"
        aria-label="Close"
      >
        <span className="font-mono text-[14px] leading-none">×</span>
      </button>

      <div className="flex items-start gap-4 mb-5">
        <Avatar className="h-16 w-16 ring-2 ring-white/10">
          <AvatarFallback className="bg-iris-grad text-white text-[22px] font-semibold">
            {creator.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-[20px] font-semibold text-text">{creator.name}</h2>
            <TrustScoreBadge score={creator.trust} />
          </div>
          <div className="font-sans text-[12.5px] text-text-mute mt-0.5">
            @{creator.handle} · {creator.niche} · {creator.location}
          </div>
        </div>
      </div>

      <p className="font-sans text-[14px] text-text-soft leading-relaxed mb-4">{creator.bio}</p>

      <div className="surface-sunk p-4 mb-4">
        <CreatorLevelBadge xp={creator.xp} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Followers" value={formatFollowers(creator.followers)} />
        <Stat label="XP" value={creator.xp.toLocaleString()} />
        <Stat label="Trust" value={`${creator.trust}`} />
      </div>

      <button
        type="button"
        onClick={onOpenProfile}
        className="w-full mb-4 surface-sunk px-4 py-3 flex items-center justify-between group hover:border-line-strong hover:bg-surface-soft transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-iris-soft text-iris grid place-items-center">
            <ExternalLink size={14} strokeWidth={2} />
          </div>
          <div className="text-left">
            <div className="font-sans text-[13px] font-semibold text-text">View full profile</div>
            <div className="font-mono text-[11px] text-text-mute">/u/{creator.slug}</div>
          </div>
        </div>
        <ArrowUpRight size={14} className="text-text-mute group-hover:text-iris transition" strokeWidth={2} />
      </button>

      <div className="flex items-center gap-2">
        <Button variant="iris" className="flex-1">Invite to campaign</Button>
        <FollowButton slug={creator.slug} variant="pill" asBookmark />
        <Button variant="outline">Message</Button>
      </div>
    </div>
  </div>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="surface-sunk p-3">
    <div className="font-sans text-[10.5px] text-text-mute mb-1">{label}</div>
    <div className={cn('font-display text-[18px] font-semibold text-text tabular-nums leading-none')}>
      {value}
    </div>
  </div>
);

export default MarketplacePage;
