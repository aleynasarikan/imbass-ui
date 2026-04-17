import React, { useState } from 'react';
import { TrendingUp, Eye, Heart, ArrowUpRight, Award } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { cn } from '../lib/utils';

type Tint = 'cream' | 'amber' | 'coral' | 'lilac' | 'mint' | 'sky';

interface Showcase {
  id: string;
  title: string;
  brand: string;
  creator: string;
  creatorHandle: string;
  niche: string;
  tint: Tint;
  stats: { views: string; engagement: string; roi: string };
  featured?: boolean;
}

const SHOWCASES: Showcase[] = [
  { id: '1', title: 'Summer Drop campaign',              brand: 'Atelier North', creator: 'Nataly H.', creatorHandle: 'nataly.h', niche: 'Beauty',         tint: 'coral',  stats: { views: '5.2M', engagement: '9.8%', roi: '4.2x' }, featured: true },
  { id: '2', title: 'Running gear field test',           brand: 'Meridian Run',  creator: 'Adam F.',   creatorHandle: 'adamfit',  niche: 'Fitness',        tint: 'amber',  stats: { views: '2.8M', engagement: '7.1%', roi: '3.6x' } },
  { id: '3', title: 'Creator kitchen unboxing series',   brand: 'Kettle & Co',   creator: 'Kim H.',    creatorHandle: 'kim.h',    niche: 'Food',           tint: 'mint',   stats: { views: '1.4M', engagement: '11.2%',roi: '2.8x' } },
  { id: '4', title: 'Travel-sized essentials reveal',    brand: 'Away & Co',     creator: 'Erick A.',  creatorHandle: 'erick.a',  niche: 'Travel',         tint: 'sky',    stats: { views: '3.1M', engagement: '6.4%', roi: '3.1x' } },
  { id: '5', title: 'Tech setup makeover',               brand: 'Keycraft',      creator: 'Jack M.',   creatorHandle: 'jackm.dev',niche: 'Tech',           tint: 'lilac',  stats: { views: '820K', engagement: '12.8%',roi: '2.4x' } },
  { id: '6', title: 'Slow-fashion capsule wardrobe',     brand: 'Loom Atelier',  creator: 'Rita O.',   creatorHandle: 'rita.o',   niche: 'Sustainability', tint: 'cream',  stats: { views: '1.9M', engagement: '8.2%', roi: '3.4x' } },
  { id: '7', title: 'Gaming chair review thread',        brand: 'Vanta Desk',    creator: 'Mert K.',   creatorHandle: 'mertk',    niche: 'Gaming',         tint: 'lilac',  stats: { views: '4.6M', engagement: '7.9%', roi: '3.8x' } },
  { id: '8', title: 'Finance 101 for students',          brand: 'Ledgerly',      creator: 'Sara T.',   creatorHandle: 'sara.t',   niche: 'Finance',        tint: 'mint',   stats: { views: '2.3M', engagement: '10.5%',roi: '3.2x' } },
  { id: '9', title: 'DIY workshop tool bundle',          brand: 'Plankhouse',    creator: 'Deniz',     creatorHandle: 'denizmakes',niche: 'Maker',         tint: 'amber',  stats: { views: '1.1M', engagement: '9.1%', roi: '2.9x' } },
];

const tintBg: Record<Tint, string> = {
  cream: 'bg-tile-cream',
  amber: 'bg-tile-amber',
  coral: 'bg-tile-coral',
  lilac: 'bg-tile-lilac',
  mint:  'bg-[linear-gradient(135deg,#95d8c0_0%,#5fb59a_100%)]',
  sky:   'bg-[linear-gradient(135deg,#9fc9e8_0%,#6a9bc8_100%)]',
};

const tintText: Record<Tint, string> = {
  cream: 'text-[#3a3127]',
  amber: 'text-[#3a2a14]',
  coral: 'text-[#3a1e18]',
  lilac: 'text-[#1e1733]',
  mint:  'text-[#0e2a22]',
  sky:   'text-[#0e2033]',
};

const CampaignShowcasePage: React.FC = () => {
  const [niche, setNiche] = useState<string>('All');
  const niches = ['All', ...Array.from(new Set(SHOWCASES.map(s => s.niche)))];
  const filtered = niche === 'All' ? SHOWCASES : SHOWCASES.filter(s => s.niche === niche);
  const featured = filtered.find(s => s.featured);
  const rest     = filtered.filter(s => !s.featured || s !== featured);

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)]">
      <div className="surface p-5 lg:p-7 min-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 font-sans text-[13px] text-text-mute">
              <span>Discover</span>
              <span className="text-text-faint">›</span>
              <span className="text-text font-medium">Campaign showcase</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
                Campaign showcase
              </h1>
              <Award size={18} className="text-peach" strokeWidth={2} />
            </div>
            <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
              The best collaborations that shipped on Imbass — curated weekly, public.
            </p>
          </div>
        </div>

        {/* Niche filter strip */}
        <div className="flex items-center gap-1 p-1 bg-surface-sunk border border-line rounded-full mb-6 w-fit overflow-x-auto scrollbar-hide max-w-full">
          {niches.map(n => (
            <button
              key={n}
              onClick={() => setNiche(n)}
              className={cn(
                'px-3.5 py-1.5 rounded-full font-sans text-[12.5px] font-medium transition whitespace-nowrap',
                niche === n
                  ? 'bg-[#0d0f13] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                  : 'text-text-mute hover:text-text'
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Featured (hero) */}
        {featured && (
          <FeaturedCard card={featured} className="mb-4" />
        )}

        {/* Rest grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rest.map((c, i) => (
            <ShowcaseCard key={c.id} card={c} delay={i * 40} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── sub-components ─── */

const FeaturedCard: React.FC<{ card: Showcase; className?: string }> = ({ card, className }) => (
  <div className={cn(
    'relative rounded-[22px] overflow-hidden p-7 flex flex-col md:flex-row gap-6 md:items-end shadow-[0_14px_40px_-18px_rgba(0,0,0,0.7)] animate-rise-in',
    tintBg[card.tint], tintText[card.tint], className,
  )}>
    <span className="absolute -top-8 -right-6 w-40 h-40 rounded-full bg-white/25 blur-2xl pointer-events-none" />
    <span className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none" />

    <div className="relative flex-1 min-w-0">
      <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full bg-black/15 backdrop-blur text-[10.5px] font-semibold uppercase tracking-[0.08em]">
        <Award size={11} strokeWidth={2.25} /> Featured this week
      </div>
      <h2 className="font-display text-[28px] md:text-[32px] font-bold leading-[1.05] tracking-[-0.02em] max-w-xl">
        {card.title}
      </h2>
      <p className="font-sans text-[14px] mt-2 opacity-80">
        {card.brand} × {card.creator} · {card.niche}
      </p>

      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <Metric icon={Eye}         label="Views"       value={card.stats.views}      dark />
        <Metric icon={Heart}       label="Engagement"  value={card.stats.engagement} dark />
        <Metric icon={TrendingUp}  label="ROI"         value={card.stats.roi}        dark />
      </div>
    </div>

    <div className="relative flex items-center gap-3 md:min-w-[240px] md:self-center md:pl-6 md:border-l md:border-black/15">
      <Avatar className="h-14 w-14 ring-2 ring-white/60 shadow-lg">
        <AvatarFallback className="bg-[#0d0f13] text-white text-[18px] font-semibold">
          {card.creator.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="leading-tight">
        <div className="font-sans text-[13.5px] font-semibold">{card.creator}</div>
        <div className="font-sans text-[12px] opacity-70">@{card.creatorHandle}</div>
      </div>
      <button className="ml-auto w-9 h-9 rounded-full bg-white text-[#16181d] grid place-items-center hover:scale-105 transition shadow-md">
        <ArrowUpRight size={15} strokeWidth={2.5} />
      </button>
    </div>
  </div>
);

const ShowcaseCard: React.FC<{ card: Showcase; delay: number }> = ({ card, delay }) => (
  <div
    className={cn(
      'relative rounded-[18px] overflow-hidden p-5 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.6)] animate-rise-in',
      tintBg[card.tint], tintText[card.tint],
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="absolute -top-6 -right-4 w-24 h-24 rounded-full bg-white/20 blur-2xl pointer-events-none" />

    <div className="relative">
      <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] opacity-60 mb-3">
        {card.niche}
      </div>
      <h3 className="font-display text-[17px] font-bold leading-[1.15] tracking-[-0.015em]">
        {card.title}
      </h3>
      <p className="font-sans text-[12.5px] mt-1 opacity-75">
        {card.brand} × {card.creator}
      </p>

      <div className="mt-4 flex items-center gap-1.5 flex-wrap">
        <Metric icon={Eye}         label="Views"      value={card.stats.views} />
        <Metric icon={TrendingUp}  label="ROI"        value={card.stats.roi} />
      </div>

      <div className="mt-4 pt-4 border-t border-black/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 ring-1 ring-white/60">
            <AvatarFallback className="bg-[#0d0f13] text-white text-[11px] font-semibold">
              {card.creator.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="font-sans text-[12px] font-medium">@{card.creatorHandle}</span>
        </div>
        <ArrowUpRight size={14} strokeWidth={2.25} className="opacity-60" />
      </div>
    </div>
  </div>
);

const Metric: React.FC<{ icon: React.ElementType; label: string; value: string; dark?: boolean }> = ({
  icon: Icon, label, value, dark,
}) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-[11.5px] font-medium',
    dark ? 'bg-black/20 backdrop-blur' : 'bg-white/40 backdrop-blur',
  )}>
    <Icon size={11} strokeWidth={2.25} />
    <span className="opacity-70">{label}</span>
    <span className="font-semibold tabular-nums">{value}</span>
  </span>
);

export default CampaignShowcasePage;
