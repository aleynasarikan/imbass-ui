import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Mail, Globe2, BadgeCheck, ArrowLeft, Sparkles, Flame,
  Users as UsersIcon, MessageSquare, Share2,
  Image as ImageIcon, Film, Music2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import ActivityHeatmap from '../components/creator/ActivityHeatmap';
import CreatorLevelBadge from '../components/creator/CreatorLevelBadge';
import TrustScoreBadge from '../components/creator/TrustScoreBadge';
import FollowButton from '../components/creator/FollowButton';
import RevenueHeatmap from '../components/creator/RevenueHeatmap';
import BadgesPanel from '../components/creator/BadgesPanel';
import {
  CREATORS, formatFollowers, getCreatorBySlug as mockBySlug,
  dtoToMockCreator, CreatorPlatform, MockCreator,
} from '../data/creators';
import { getCreatorBySlug as apiBySlug } from '../api/creators';
import { followStore } from '../lib/stores/follows';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const PLATFORM_META: Record<CreatorPlatform, { label: string; icon: React.ElementType; accent: string }> = {
  instagram: { label: 'Instagram', icon: ImageIcon, accent: 'text-[#e1306c]' },
  youtube:   { label: 'YouTube',   icon: Film,      accent: 'text-[#ff4d6d]' },
  tiktok:    { label: 'TikTok',    icon: Music2,    accent: 'text-text' },
};

/* Brand wordmark (same as sidebar) */
const BrandWord: React.FC = () => (
  <div className="flex items-center gap-2 select-none">
    <svg viewBox="0 0 14 14" className="w-4 h-4 text-iris" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 2 L12 12 M12 2 L2 12" />
    </svg>
    <span className="font-display text-[16px] font-semibold tracking-[-0.03em] text-text leading-none">
      imbass
    </span>
  </div>
);

interface PublicCreatorProfileProps {
  slug: string;
}

const PublicCreatorProfile: React.FC<PublicCreatorProfileProps> = ({ slug }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [creator, setCreator] = useState<MockCreator | null | undefined>(undefined);

  // Try API first, fall back to mock data. `undefined` = loading, `null` = not found.
  useEffect(() => {
    let cancelled = false;
    setCreator(undefined);
    (async () => {
      try {
        const dto = await apiBySlug(slug);
        if (cancelled) return;
        followStore.registerCreator(dto.slug, dto.userId);
        setCreator(dtoToMockCreator(dto));
      } catch {
        if (cancelled) return;
        const mock = mockBySlug(slug);
        setCreator(mock ?? null);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  /* SEO meta description */
  useEffect(() => {
    if (!creator) return;
    const desc = `${creator.name} · ${creator.niche} creator on ${creator.platforms.join(', ')}. ${creator.bio}`;
    let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    const prev = tag.content;
    tag.content = desc;
    return () => { if (tag) tag.content = prev; };
  }, [creator]);

  if (creator === undefined) return <ProfileSkeleton />;
  if (creator === null)      return <NotFound slug={slug} onBack={() => navigate('/')} />;

  const similar = CREATORS
    .filter(c => c.slug !== creator.slug && (c.niche === creator.niche || c.platforms.some(p => creator.platforms.includes(p))))
    .slice(0, 4);

  return (
    <div className="min-h-screen pb-16">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-bg/70 backdrop-blur-lg border-b border-line">
        <div className="max-w-[1100px] mx-auto px-5 md:px-7 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-text-mute hover:text-text transition text-[13px] font-medium"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back
          </button>
          <BrandWord />
          <div className="flex items-center gap-2">
            {!user && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
                <Button variant="iris" size="sm" onClick={() => navigate('/register')}>Join Imbass</Button>
              </>
            )}
            {user && (
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>Back to workspace</Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-5 md:px-7 pt-8 animate-fade-in">
        {/* Hero */}
        <section className="surface overflow-hidden mb-5 animate-rise-in">
          <div className="relative h-[160px] bg-iris-grad">
            <span className="absolute inset-0 opacity-70" style={{
              background: `
                radial-gradient(400px 220px at 10% 0%, rgba(255,255,255,.25), transparent 60%),
                radial-gradient(380px 220px at 90% 100%, rgba(244,184,157,.45), transparent 60%)
              `,
            }} />
            <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur text-white text-[11px] font-medium border border-white/20">
              <Sparkles size={11} strokeWidth={2.25} /> {creator.niche}
            </div>
          </div>

          <div className="px-6 pb-6 -mt-12 flex flex-col md:flex-row md:items-end gap-5">
            <Avatar className="h-24 w-24 ring-4 ring-surface shadow-float">
              <AvatarFallback className="bg-iris-grad text-white text-[32px] font-semibold">
                {creator.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-[26px] font-semibold text-text leading-tight">
                  {creator.name}
                </h1>
                <BadgeCheck size={18} className="text-iris" strokeWidth={2} />
                <TrustScoreBadge score={creator.trust} />
                {creator.available && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-up/14 text-up text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-up" /> Available for work
                  </span>
                )}
              </div>

              <div className="font-sans text-[13px] text-text-mute mt-1">@{creator.handle}</div>

              <div className="mt-3 flex items-center gap-4 font-sans text-[13px] text-text-mute flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} strokeWidth={2} />
                  {creator.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UsersIcon size={12} strokeWidth={2} />
                  {formatFollowers(creator.followers)} followers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Globe2 size={12} strokeWidth={2} />
                  Joined {creator.joinedYear}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <FollowButton slug={creator.slug} variant="full" />
              <Button variant="outline" className="h-10 px-5">
                <Mail size={13} strokeWidth={2.25} /> Invite
              </Button>
              <Button variant="outline" className="h-10 px-4">
                <MessageSquare size={13} strokeWidth={2.25} /> Message
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10" aria-label="Share profile">
                <Share2 size={14} strokeWidth={2} />
              </Button>
            </div>
          </div>

          {/* Level band */}
          <div className="px-6 pb-6">
            <div className="surface-sunk p-4 flex items-center gap-4">
              <CreatorLevelBadge xp={creator.xp} className="flex-1" />
              <div className="hidden md:block h-10 w-px bg-line" />
              <div className="hidden md:flex items-center gap-2 text-text-mute">
                <Flame size={14} className="text-peach" strokeWidth={2} />
                <span className="font-sans text-[12.5px] font-medium text-text">
                  {creator.streak}-day streak
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Badges (Sprint 4) */}
        <BadgesPanel slug={creator.slug} className="mb-5 animate-rise-in" style={{ animationDelay: '45ms' }} />

        {/* Activity heatmap */}
        <section className="surface p-6 mb-5 animate-rise-in" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-text">Collaboration activity</h2>
              <p className="font-sans text-[12px] text-text-mute mt-0.5">
                Public track record — every shipped deal, day by day.
              </p>
            </div>
          </div>
          <ActivityHeatmap slug={creator.slug} year={new Date().getFullYear()} metric="collab" />
        </section>

        {/* Revenue heatmap (Sprint 5) */}
        <section className="surface p-6 mb-5 animate-rise-in" style={{ animationDelay: '90ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-text">Revenue</h2>
              <p className="font-sans text-[12px] text-text-mute mt-0.5">
                Monthly earnings from released milestones — the public $ track record.
              </p>
            </div>
          </div>
          <RevenueHeatmap slug={creator.slug} year={new Date().getFullYear()} />
        </section>

        {/* 2-col: About + Platforms | Contact + Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <div className="flex flex-col gap-5">
            <section className="surface p-6 animate-rise-in" style={{ animationDelay: '120ms' }}>
              <h2 className="font-display text-[16px] font-semibold text-text mb-3">About</h2>
              <p className="font-sans text-[14.5px] leading-relaxed text-text-soft">
                {creator.bio}
              </p>
            </section>

            <section className="surface p-6 animate-rise-in" style={{ animationDelay: '180ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-[16px] font-semibold text-text">Platforms</h2>
                  <p className="font-sans text-[12px] text-text-mute mt-0.5">
                    Where {creator.name} publishes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {creator.platforms.map(p => {
                  const meta = PLATFORM_META[p];
                  const Icon = meta.icon;
                  return (
                    <a
                      key={p}
                      href={`https://${p}.com/${creator.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group surface-sunk p-4 hover:border-line-strong hover:bg-surface-soft transition-all flex items-center gap-3"
                    >
                      <div className={cn('w-10 h-10 rounded-xl bg-[#0d0f13] border border-line grid place-items-center shrink-0', meta.accent)}>
                        <Icon size={18} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-sans text-[13.5px] font-semibold text-text">{meta.label}</div>
                        <div className="font-sans text-[11.5px] text-text-mute truncate">@{creator.handle}</div>
                      </div>
                      <BadgeCheck size={15} className="text-iris opacity-0 group-hover:opacity-100 transition" strokeWidth={2} />
                    </a>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-5">
            <section className="surface p-6 animate-rise-in" style={{ animationDelay: '240ms' }}>
              <h2 className="font-display text-[16px] font-semibold text-text mb-4">Snapshot</h2>
              <div className="flex flex-col gap-3">
                <Stat label="Trust score"     value={creator.trust} suffix="/100" />
                <Stat label="Followers"       value={formatFollowers(creator.followers)} />
                <Stat label="XP earned"       value={creator.xp.toLocaleString()} />
                <Stat label="Active streak"   value={creator.streak} suffix=" days" />
                <Stat label="Primary niche"   value={creator.niche} />
                <Stat label="Location"        value={creator.location} />
              </div>
            </section>

            <section className="rounded-2xl bg-iris-grad p-5 text-white relative overflow-hidden animate-rise-in" style={{ animationDelay: '300ms' }}>
              <span className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/12 blur-2xl" />
              <span className="absolute -left-4 -bottom-8 w-24 h-24 rounded-full bg-white/12 blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-90">
                  <Sparkles size={12} strokeWidth={2.25} /> For brands
                </div>
                <h3 className="font-display text-[17px] font-semibold leading-tight">
                  Looking for the right creator?
                </h3>
                <p className="font-sans text-[12.5px] mt-2 opacity-85 leading-relaxed">
                  Post a brief and let matched creators apply — or invite {creator.name} directly.
                </p>
                <Button
                  size="sm"
                  variant="default"
                  className="mt-4 !bg-white !text-[#16181d] !border-transparent hover:!bg-white/90"
                  onClick={() => navigate(user ? '/campaigns' : '/register')}
                >
                  {user ? 'Create a campaign' : 'Get started free'}
                </Button>
              </div>
            </section>
          </aside>
        </div>

        {/* Similar creators */}
        {similar.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-[16px] font-semibold text-text mb-3">Similar creators</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {similar.map((c, i) => (
                <button
                  key={c.slug}
                  onClick={() => navigate(`/u/${c.slug}`)}
                  className="surface-sunk p-4 text-left hover:bg-surface-soft hover:border-line-strong transition-all animate-rise-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar className="h-10 w-10 ring-1 ring-white/10">
                      <AvatarFallback className="bg-iris-grad text-white text-[13px] font-semibold">
                        {c.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-sans text-[13px] font-semibold text-text truncate">{c.name}</div>
                      <div className="font-sans text-[11.5px] text-text-mute truncate">@{c.handle}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <CreatorLevelBadge xp={c.xp} variant="compact" />
                    <span className="font-sans text-[11px] text-text-mute tabular-nums">
                      {formatFollowers(c.followers)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Footer note */}
        <p className="mt-8 text-center font-sans text-[11.5px] text-text-faint">
          Public profile · <span className="text-text-mute">imbass.io/u/{creator.slug}</span>
        </p>
      </main>
    </div>
  );
};

/* ─── bits ─── */

const Stat: React.FC<{ label: string; value: string | number; suffix?: string }> = ({ label, value, suffix }) => (
  <div className="flex items-center justify-between gap-3 py-1.5 border-b border-line last:border-b-0">
    <span className="font-sans text-[12.5px] text-text-mute">{label}</span>
    <span className="font-sans text-[13px] text-text font-semibold tabular-nums">
      {value}{suffix}
    </span>
  </div>
);

const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-iris-soft border-t-iris rounded-full animate-spin" />
      <span className="font-sans text-[12px] text-text-mute">Loading profile…</span>
    </div>
  </div>
);

const NotFound: React.FC<{ slug: string; onBack: () => void }> = ({ slug, onBack }) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="max-w-[440px] w-full text-center surface p-8 animate-rise-in">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-iris-soft text-iris mb-4">
        <BadgeCheck size={20} strokeWidth={1.75} />
      </div>
      <h1 className="font-display text-[22px] font-semibold text-text mb-2">Creator not found</h1>
      <p className="font-sans text-[13.5px] text-text-mute mb-6 leading-relaxed">
        No public profile exists at <span className="font-mono text-text">/u/{slug}</span>.
        They may have changed their handle or left the platform.
      </p>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft size={13} strokeWidth={2.25} /> Go back
      </Button>
    </div>
  </div>
);

export default PublicCreatorProfile;
