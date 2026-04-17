import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Star, Flame, BarChart2, TrendingUp, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../api';

interface InfluencerMetric { name: string; engagement: number; reach: number; }
interface AdMetric { name: string; clicks: number; conversions: number; }
interface AnalyticsData { influencers: InfluencerMetric[]; ads: AdMetric[]; }

const IRIS  = '#6d5bff';
const CORAL = '#ff7aa4';
const MINT  = '#5fd3b4';
const UP    = '#18a957';
const DOWN  = '#ef3e4a';

const WeeklyAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({ influencers: [], ads: [] });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<AnalyticsData>('/analytics/weekly');
        setAnalyticsData(res.data);
      } catch { /* dev */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="meta-label">Compiling analytics…</span>
      </div>
    );
  }

  const hasData = analyticsData.influencers?.length > 0 && analyticsData.ads?.length > 0;
  let bestInfluencer: InfluencerMetric = { name: 'N/A', engagement: 0, reach: 0 };
  let bestAd: AdMetric = { name: 'N/A', conversions: 0, clicks: 0 };
  if (hasData) {
    bestInfluencer = analyticsData.influencers.reduce((p, c) =>
      (p.engagement + p.reach > c.engagement + c.reach) ? p : c);
    bestAd = analyticsData.ads.reduce((p, c) =>
      (p.conversions > c.conversions) ? p : c);
  }

  const Tip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-line rounded-xl shadow-float px-3 py-2">
        <p className="font-mono text-[10px] text-text-faint uppercase tracking-wider-x mb-1">{label}</p>
        {payload.map((e: any, i: number) => (
          <p key={i} className="font-sans text-[12px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="text-text-mute">{e.name}</span>
            <span className="font-semibold text-text ml-auto tabular-nums">{e.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      {/* head */}
      <header className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 font-sans text-[13px] text-text-mute">
            <span>Workspace</span>
            <span className="text-text-faint">›</span>
            <span>Analytics</span>
          </div>
          <h1 className="font-display text-[30px] md:text-[34px] font-semibold text-text tracking-[-0.02em] leading-tight">
            Weekly report
          </h1>
          <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
            Who reached furthest, who converted hardest — the numbers behind this week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Share report</Button>
          <Button>Export PDF</Button>
        </div>
      </header>

      {hasData ? (
        <>
          {/* ═════ Highlights ═════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <HighlightCard
              label="Top voice"
              name={bestInfluencer.name}
              icon={<Star size={14} strokeWidth={2} />}
              tone="iris"
              stats={[
                { k: 'Engagement', v: `${bestInfluencer.engagement}K`, accent: true },
                { k: 'Reach',      v: `${bestInfluencer.reach}K` },
              ]}
            />
            <HighlightCard
              label="Best ad"
              name={bestAd.name}
              icon={<Flame size={14} strokeWidth={2} />}
              tone="coral"
              stats={[
                { k: 'Conversions', v: String(bestAd.conversions), accent: true },
                { k: 'Clicks',      v: String(bestAd.clicks) },
              ]}
            />
          </div>

          {/* ═════ Charts ═════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <ChartCard title="Influencer performance" sub="Reach against engagement">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.influencers} margin={{ top: 10, right: 0, left: -10, bottom: 0 }} barGap={6}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(14,11,31,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#adaabf', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#adaabf', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                  <RTooltip content={<Tip />} cursor={{ fill: 'rgba(109,91,255,0.06)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans', color: '#7a7892' }} />
                  <Bar dataKey="reach"      name="Reach"      fill={IRIS}  radius={[8, 8, 0, 0]} />
                  <Bar dataKey="engagement" name="Engagement" fill={CORAL} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Ad campaign conversion" sub="Clicks and conversions across the roster">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.ads} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={IRIS} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={IRIS} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={MINT} stopOpacity={0.38} />
                      <stop offset="100%" stopColor={MINT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(14,11,31,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#adaabf', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#adaabf', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                  <RTooltip content={<Tip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans', color: '#7a7892' }} />
                  <Area type="monotone" dataKey="clicks"      name="Clicks"      stroke={IRIS} fill="url(#cl)" strokeWidth={2} />
                  <Area type="monotone" dataKey="conversions" name="Conversions" stroke={MINT} fill="url(#cv)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ═════ Ledger ═════ */}
          <div className="surface p-5 mb-5 animate-rise-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-[18px] font-semibold text-text">Revenue ledger</h3>
                <p className="font-sans text-[12.5px] text-text-mute mt-0.5">Payouts across the quarter</p>
              </div>
              <Button variant="soft" size="sm">This quarter</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { k: 'Gross · Q',      v: '₺4.12M', d: '+34.2%', trend: 'up' as const },
                { k: 'Net to Creators',v: '₺3.38M', d: 'Paid to 212',  trend: 'up' as const },
                { k: 'Closed Deals',   v: '418',    d: '+22 this week', trend: 'up' as const },
                { k: 'Acceptance',     v: '73.4%',  d: '-1.8% w/w',     trend: 'down' as const },
              ].map((s, i) => (
                <div
                  key={s.k}
                  className={cn(
                    'p-4 rounded-xl border border-line bg-surface-soft',
                    i === 0 && 'bg-iris-soft border-transparent'
                  )}
                >
                  <div className="font-sans text-[11px] text-text-mute font-medium mb-1.5">{s.k}</div>
                  <div className="font-display text-[24px] font-semibold text-text tabular-nums leading-none">{s.v}</div>
                  <div className={cn(
                    'mt-1.5 font-sans text-[11px] font-medium inline-flex items-center gap-1',
                    s.trend === 'up' ? 'text-up' : 'text-down'
                  )}>
                    <TrendingUp size={10} strokeWidth={2.5} className={s.trend === 'down' ? 'rotate-180' : ''} />
                    {s.d}
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-left font-sans text-[11px] text-text-faint font-medium uppercase tracking-[0.04em]">
                    {['Creator', 'Campaign', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className="py-2.5 px-3 first:pl-0 last:pr-0 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { c: 'Ece K.',   n: '0138', t: 'Lumen Serum',     amt: '24.500',  s: 'Paid',        tone: 'paid' },
                    { c: 'Mert A.',  n: '0136', t: 'Mercer Roasters', amt: '8.200',   s: 'Paid',        tone: 'paid' },
                    { c: 'Selin D.', n: '0141', t: 'Parity Labs',     amt: '54.000',  s: 'Pending · 7d', tone: 'pend' },
                    { c: 'Kaan Ö.',  n: '0139', t: 'North & Field',   amt: '55.000',  s: 'Paid',        tone: 'paid' },
                    { c: 'Deniz Y.', n: '0135', t: 'Quorum Home',     amt: '120.000', s: 'In escrow',   tone: 'pend' },
                  ].map((r, i) => (
                    <tr key={r.n} className="border-t border-line hover:bg-surface-sunk/50 transition-colors group">
                      <td className="py-3.5 px-3 pl-0 font-sans text-[13px] text-text font-semibold">{r.c}</td>
                      <td className="py-3.5 px-3 font-sans text-[13px] text-text-mute">
                        <span className="font-mono text-[11px] text-text-faint mr-2">Nº{r.n}</span>{r.t}
                      </td>
                      <td className="py-3.5 px-3 font-display text-[14px] font-semibold text-text tabular-nums">
                        <span className="text-iris mr-0.5">₺</span>{r.amt}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 font-sans text-[11px] font-medium px-2 py-0.5 rounded-full',
                          r.tone === 'paid' ? 'bg-[#e7f7ee] text-[#0f7a3d]' : 'bg-[#fff4de] text-[#8a5a00]'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', r.tone === 'paid' ? 'bg-up' : 'bg-amber')} />
                          {r.s}
                        </span>
                      </td>
                      <td className="py-3.5 pr-0 text-right">
                        <button className="p-1.5 text-text-faint group-hover:text-text hover:bg-surface-sunk rounded-lg transition">
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between font-sans text-[12px] text-text-faint pt-2">
            <span>End of report</span>
            <Badge variant="outline">{analyticsData.influencers.length + analyticsData.ads.length} data points</Badge>
          </div>
          <div className="hidden">{DOWN}{UP}</div>
        </>
      ) : (
        <div className="surface py-20 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-iris-soft grid place-items-center mb-4">
            <BarChart2 size={20} className="text-iris-deep" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-[22px] font-semibold text-text">No data yet</h2>
          <p className="font-sans text-[13px] text-text-mute mt-2 max-w-sm">
            Once campaigns are live and conversions start flowing, the weekly ledger will fill in.
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Sub-components ─── */

const HighlightCard: React.FC<{
  label: string;
  name: string;
  icon: React.ReactNode;
  tone: 'iris' | 'coral';
  stats: { k: string; v: string; accent?: boolean }[];
}> = ({ label, name, icon, tone, stats }) => (
  <div className="surface p-5 relative overflow-hidden animate-rise-in">
    <div
      className={cn(
        'absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl opacity-60',
        tone === 'iris' ? 'bg-iris-soft' : 'bg-[#ffe4ee]'
      )}
    />
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium',
          tone === 'iris' ? 'bg-iris-soft text-iris-deep' : 'bg-[#ffe4ee] text-[#a8232d]'
        )}>
          {icon}{label}
        </span>
      </div>
      <div className="font-display text-[28px] font-semibold text-text leading-tight">{name}</div>
      <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-line">
        {stats.map(s => (
          <div key={s.k}>
            <div className="font-sans text-[11px] text-text-mute font-medium mb-0.5">{s.k}</div>
            <div className={cn(
              'font-display text-[22px] font-semibold tabular-nums',
              s.accent ? (tone === 'iris' ? 'text-iris-deep' : 'text-down') : 'text-text'
            )}>
              {s.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; sub: string; children: React.ReactNode }> = ({
  title, sub, children,
}) => (
  <div className="surface p-5 animate-rise-in">
    <div className="flex items-center justify-between mb-2">
      <div>
        <h3 className="font-display text-[16px] font-semibold text-text">{title}</h3>
        <p className="font-sans text-[12px] text-text-mute mt-0.5">{sub}</p>
      </div>
      <button className="text-text-faint hover:text-text p-1.5 rounded-lg hover:bg-surface-sunk transition">
        <ArrowUpRight size={15} strokeWidth={2} />
      </button>
    </div>
    <div className="h-[280px]">{children}</div>
  </div>
);

export default WeeklyAnalytics;
