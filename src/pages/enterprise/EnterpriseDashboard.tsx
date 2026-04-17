import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Button } from '../../components/ui/Button';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import {
  Flame, Gift, Pin, Clock, Receipt, MoreHorizontal, ChevronRight,
  Eye, ShoppingBasket, Zap, Info, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
  Tooltip as RTooltip,
} from 'recharts';
import { cn } from '../../lib/utils';

interface Influencer { id: string; name: string; platform: string; followers: string | number; }

/* ─── data ─── */

const campaigns = [
  { key: 'rebaid',  name: "Imbass's campaign",  remaining: '48h', redemptions: 36, tile: 'cream' as const },
  { key: 'alt',     name: 'Alternative one',    remaining: '72h', redemptions: 18, tile: 'amber' as const },
  { key: 'extra',   name: 'Extra discount',     remaining: '24h', redemptions: 52, tile: 'coral' as const },
  { key: 'inf',     name: 'Influencer',         remaining: '12h', redemptions: 27, tile: 'lilac' as const },
];

const filterChips = [
  { label: 'All' },
  { label: 'Active', count: 4, dot: '#34d399' },
  { label: 'Paused', count: 5, dot: '#f5c268' },
  { label: 'Draft',  count: 3, dot: '#8a8d97' },
  { label: 'Ended',  count: 26, dot: '#5a5d67' },
];

const placeholderInfluencers: Influencer[] = [
  { id: '1', name: 'Alex H.',   platform: 'ig', followers: '28K'  },
  { id: '2', name: 'Nataly H.', platform: 'ig', followers: '142K' },
  { id: '3', name: 'Jack M.',   platform: 'ig', followers: '9.4K' },
  { id: '4', name: 'Erick A.',  platform: 'ig', followers: '53K'  },
  { id: '5', name: 'Adam F.',   platform: 'ig', followers: '310K' },
  { id: '6', name: 'Kim H.',    platform: 'ig', followers: '17K'  },
  { id: '7', name: 'Anna P.',   platform: 'ig', followers: '72K'  },
  { id: '8', name: 'Rita O.',   platform: 'ig', followers: '44K'  },
];

const barData = [
  { d: '01.02', v: 1820 }, { d: '01.03', v: 2400 }, { d: '01.04', v: 3100 },
  { d: '01.05', v: 2680 }, { d: '01.06', v: 2940 }, { d: '01.07', v: 4205 },
  { d: '01.08', v: 2720 }, { d: '01.09', v: 3180 }, { d: '01.10', v: 2420 },
  { d: '01.11', v: 2880 }, { d: '01.12', v: 3520 }, { d: '01.13', v: 2100 },
  { d: '01.14', v: 2980 }, { d: '01.15', v: 3240 }, { d: '01.16', v: 2660 },
];

/* ─── main ─── */

const EnterpriseDashboard: React.FC = () => {
  const { user } = useAuth();
  const [, setSummary] = useState<any>(null);
  const [campaignTab, setCampaignTab] = useState<'rebaid' | 'discount' | 'influencer'>('rebaid');
  const [filter, setFilter] = useState('All');
  const [chartRange, setChartRange] = useState<'24h' | '7d' | 'All'>('All');
  const isAgency = user?.role !== 'INFLUENCER';

  useEffect(() => {
    (async () => {
      try {
        const [, sumRes] = await Promise.all([
          api.get<Influencer[]>('/influencers'),
          api.get('/analytics/summary'),
        ]);
        setSummary(sumRes.data);
      } catch { /* dev */ }
    })();
  }, []);

  const peakIdx = barData.findIndex(d => d.v === Math.max(...barData.map(b => b.v)));

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)] flex">
      {/* ═════ Main surface — the dark dashboard card ═════ */}
      <div className="surface p-5 lg:p-7 flex-1 flex flex-col min-h-[calc(100vh-2rem)]">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-[26px] lg:text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
            Dashboard
          </h1>
        </div>

        {/* Campaign type tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-surface-sunk border border-line rounded-full mb-7">
          <CampTab active={campaignTab === 'rebaid'}     onClick={() => setCampaignTab('rebaid')}    icon={Flame} iconTint="#f4b89d">
            {isAgency ? "Imbass's campaign" : 'My campaign'}
          </CampTab>
          <CampTab active={campaignTab === 'discount'}   onClick={() => setCampaignTab('discount')}  icon={Gift}  iconTint="#c8cad1">
            Discount campaign
          </CampTab>
          <CampTab active={campaignTab === 'influencer'} onClick={() => setCampaignTab('influencer')} icon={Pin}  iconTint="#c8cad1">
            Influencer campaign
          </CampTab>
        </div>

        {/* ═════ Campaigns section ═════ */}
        <section className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Pin size={14} className="text-iris" strokeWidth={2} />
                <h2 className="font-display text-[17px] font-semibold text-text">Campaigns</h2>
              </div>
              <div className="flex items-center gap-1 p-1 bg-surface-sunk border border-line rounded-full ml-2">
                {filterChips.map(c => (
                  <button
                    key={c.label}
                    onClick={() => setFilter(c.label)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-[12px] transition-all",
                      filter === c.label
                        ? "bg-[#0d0f13] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        : "text-text-mute hover:text-text"
                    )}
                  >
                    {c.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />}
                    {c.count !== undefined ? `${c.count} ${c.label}` : c.label}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="dark" size="sm" className="h-9 px-4">All campaigns</Button>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {campaigns.map((c, i) => {
                const { key, ...rest } = c;
                return <CampaignCard key={key} {...rest} delay={60 * i} />;
              })}
            </div>
            <button className="hidden md:grid absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-[#16181d] place-items-center shadow-float hover:scale-105 transition">
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* ═════ Influencers ═════ */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pin size={14} className="text-iris" strokeWidth={2} />
              <h2 className="font-display text-[17px] font-semibold text-text">Influencers</h2>
            </div>
            <Button variant="dark" size="sm" className="h-9 px-4">All influencers</Button>
          </div>

          <div className="relative">
            <div className="flex items-start gap-5 overflow-x-auto scrollbar-hide pb-1">
              {placeholderInfluencers.map((inf, i) => (
                <button
                  key={inf.id}
                  className="flex flex-col items-center gap-2 shrink-0 group"
                  style={{ animationDelay: `${40 * i}ms` }}
                >
                  <Avatar className="h-[58px] w-[58px] ring-1 ring-white/10 group-hover:ring-iris/50 transition">
                    <AvatarFallback className="bg-iris-grad text-white text-[18px] font-semibold">
                      {inf.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-sans text-[11.5px] text-text-soft group-hover:text-text transition">
                    {inf.name}
                  </span>
                </button>
              ))}
            </div>
            <button className="hidden md:grid absolute -right-2 top-[18px] w-9 h-9 rounded-full bg-white text-[#16181d] place-items-center shadow-float hover:scale-105 transition">
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* ═════ Daily Redemptions ═════ */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pin size={14} className="text-iris" strokeWidth={2} />
              <h2 className="font-display text-[17px] font-semibold text-text">Daily Redemptions</h2>
            </div>
            <div className="inline-flex items-center gap-1 p-1 bg-surface-sunk border border-line rounded-full">
              {(['24h','7d','All'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={cn(
                    "px-3 py-1 rounded-full font-sans text-[12px] font-medium transition",
                    chartRange === r
                      ? "bg-[#0d0f13] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "text-text-mute hover:text-text"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="surface-sunk p-4 relative">
            {/* Right-edge peak badge */}
            <div className="absolute right-4 top-4 inline-flex items-center px-2.5 py-1 rounded-md bg-peach-grad text-[#3a1f0f] text-[11px] font-semibold font-mono">
              {barData[peakIdx].v.toLocaleString()}
            </div>

            <div className="h-[280px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 34, right: 8, left: -8, bottom: 4 }} barCategoryGap={10}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="d"
                    tick={{ fill: '#8a8d97', fontSize: 10.5, fontFamily: 'Geist Mono' }}
                    tickLine={false} axisLine={false}
                    interval={0}
                  />
                  <YAxis hide domain={[0, 'dataMax + 600']} />
                  <RTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTip />} />
                  <Bar dataKey="v" radius={[6, 6, 6, 6]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={i === peakIdx ? 'url(#peachGrad)' : '#363a46'} />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="peachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#f9d2b8" />
                      <stop offset="100%" stopColor="#d88f7e" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Floating tooltip label on peak (decorative) */}
            <PeakLabel value={barData[peakIdx].v} totalBars={barData.length} index={peakIdx} />
          </div>
        </section>

        {/* ═════ Stat cards ═════ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-auto">
          <StatCard
            icon={Eye}
            iconBg="bg-iris-soft" iconColor="text-iris"
            label="Views" value="52,550" delta="+12.5%"
          />
          <StatCard
            icon={ShoppingBasket}
            iconBg="bg-[rgba(244,184,157,0.14)]" iconColor="text-peach"
            label="Redemptions" value="4,205" delta="+32.5%"
          />
          <StatCard
            icon={Zap}
            iconBg="bg-[rgba(245,194,104,0.14)]" iconColor="text-amber"
            label="Code clips" value="205" delta="+3.8%"
          />
        </section>
      </div>
    </div>
  );
};

/* ─── sub-components ─── */

const CampTab: React.FC<{
  active: boolean; onClick: () => void; icon: React.ElementType; iconTint?: string; children: React.ReactNode;
}> = ({ active, onClick, icon: Icon, iconTint, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-full font-sans text-[13px] font-medium transition-all",
      active
        ? "bg-[#0d0f13] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
        : "text-text-mute hover:text-text"
    )}
  >
    <Icon size={14} strokeWidth={2} style={{ color: active ? iconTint : undefined }} />
    {children}
  </button>
);

const CampaignCard: React.FC<{
  name: string;
  remaining: string;
  redemptions: number;
  tile: 'cream' | 'amber' | 'coral' | 'lilac';
  delay?: number;
}> = ({ name, remaining, redemptions, tile, delay = 0 }) => {
  const tileClass = {
    cream:  'bg-tile-cream text-[#3a3127]',
    amber:  'bg-tile-amber text-[#3a2a14]',
    coral:  'bg-tile-coral text-[#3a1e18]',
    lilac:  'bg-tile-lilac text-[#1e1733]',
  }[tile];

  const dotColor = {
    cream:  '#e84a3c',
    amber:  '#3a2a14',
    coral:  '#3a1e18',
    lilac:  '#ffffff',
  }[tile];

  return (
    <div
      className={cn(
        "relative rounded-[18px] p-4 overflow-hidden animate-rise-in shadow-[0_10px_30px_-14px_rgba(0,0,0,0.6)]",
        tileClass,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* subtle shine */}
      <span className="absolute -top-10 -right-6 w-28 h-28 rounded-full bg-white/20 blur-2xl pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
          <span className="font-sans text-[13px] font-semibold truncate">{name}</span>
        </div>
        <button className="opacity-70 hover:opacity-100 transition">
          <MoreHorizontal size={15} />
        </button>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        <MiniStat icon={Clock}   label="Remaining"    value={remaining} tone={tile} />
        <MiniStat icon={Receipt} label="Redemptions"  value={redemptions} tone={tile} />
      </div>
    </div>
  );
};

const MiniStat: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone: 'cream' | 'amber' | 'coral' | 'lilac';
}> = ({ icon: Icon, label, value, tone }) => {
  const labelCol = {
    cream: 'text-[#6a5d4a]',
    amber: 'text-[#6a5428]',
    coral: 'text-[#6a3a2d]',
    lilac: 'text-[#473555]',
  }[tone];

  return (
    <div>
      <div className={cn("font-sans text-[10.5px] font-medium mb-1 uppercase tracking-wide", labelCol)}>
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <Icon size={13} strokeWidth={2} />
        <span className="font-sans text-[14px] font-semibold tabular-nums">{value}</span>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; value: string; delta: string;
}> = ({ icon: Icon, iconBg, iconColor, label, value, delta }) => {
  const positive = delta.startsWith('+');
  return (
    <div className="surface-sunk p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="font-sans text-[12.5px] text-text-mute">{label}</span>
        <button className="text-text-faint hover:text-text-mute transition">
          <Info size={12} strokeWidth={2} />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn("w-11 h-11 rounded-full grid place-items-center shrink-0", iconBg)}>
          <Icon size={18} strokeWidth={1.75} className={iconColor} />
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-display text-[24px] font-semibold text-text tabular-nums tracking-[-0.02em] leading-none">
            {value}
          </span>
          <span className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold",
            positive ? "bg-up/14 text-up" : "bg-down/14 text-down"
          )}>
            {positive
              ? <TrendingUp size={10} strokeWidth={2.5} />
              : <TrendingDown size={10} strokeWidth={2.5} />}
            {delta}
          </span>
        </div>
      </div>
    </div>
  );
};

/* Recharts custom tooltip */
const CustomTip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2.5 py-1.5 rounded-md bg-white text-[#16181d] text-[11px] font-semibold font-mono shadow-float">
      {payload[0].value.toLocaleString()}
      <div className="text-[9.5px] text-text-faint mt-0.5 font-sans font-medium">{label}</div>
    </div>
  );
};

/* Floating peak label (decorative, matches reference balloon) */
const PeakLabel: React.FC<{ value: number; totalBars: number; index: number }> = ({ value, totalBars, index }) => {
  const leftPct = ((index + 0.5) / totalBars) * 100;
  return (
    <div
      className="absolute top-2 pointer-events-none animate-fade-in"
      style={{ left: `calc(${leftPct}% - 28px)` }}
    >
      <div className="relative">
        <div className="px-2.5 py-1 rounded-md bg-white text-[#16181d] text-[11px] font-semibold font-mono shadow-float">
          {value.toLocaleString()}
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white rotate-45 shadow-float" />
      </div>
    </div>
  );
};

export default EnterpriseDashboard;
