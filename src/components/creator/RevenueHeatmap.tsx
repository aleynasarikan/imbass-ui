import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { getCreatorEarnings, MonthlyEarning } from '../../api/revenue';
import { cn } from '../../lib/utils';

interface Props {
  slug: string;
  year?: number;
  className?: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt$ = (cents: number) => {
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const RevenueHeatmap: React.FC<Props> = ({ slug, year = new Date().getFullYear(), className }) => {
  const [data, setData]       = useState<MonthlyEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCreatorEarnings(slug, year);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, year]);

  /* Fill missing months with 0 */
  const byMonth = useMemo(() => {
    const map = new Map<number, number>();
    data.forEach(d => {
      const mo = Number(d.month.slice(5, 7));
      map.set(mo, (map.get(mo) || 0) + d.amountCents);
    });
    return Array.from({ length: 12 }, (_, i) => ({ monthIdx: i, amountCents: map.get(i + 1) ?? 0 }));
  }, [data]);

  const total = byMonth.reduce((s, m) => s + m.amountCents, 0);
  const max   = byMonth.reduce((m, cur) => Math.max(m, cur.amountCents), 0);
  const peak  = byMonth.reduce((m, cur) => cur.amountCents > (m?.amountCents ?? -1) ? cur : m, byMonth[0]);

  const intensity = (cents: number): string => {
    if (cents === 0 || max === 0) return 'bg-[#22252e]';
    const ratio = cents / max;
    if (ratio <= 0.25) return 'bg-up/25';
    if (ratio <= 0.5)  return 'bg-up/45';
    if (ratio <= 0.75) return 'bg-up/70';
    return 'bg-up';
  };

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <DollarSign size={14} className="text-up" strokeWidth={2.25} />
          <span className="font-sans text-[13px] text-text-soft font-medium">
            <span className="tabular-nums text-text font-semibold">{fmt$(total)}</span> earned in {year}
          </span>
        </div>
        {peak && peak.amountCents > 0 && (
          <span className="inline-flex items-center gap-1.5 font-sans text-[11.5px] text-text-mute">
            <TrendingUp size={11} strokeWidth={2.25} />
            Peak {MONTHS[peak.monthIdx]} · <span className="text-text font-medium tabular-nums">{fmt$(peak.amountCents)}</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-6 text-center text-text-mute text-[12px]">
          <Loader2 size={12} className="animate-spin inline-block mr-1.5 align-middle" />
          Loading earnings…
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-2">
          {byMonth.map(m => (
            <div
              key={m.monthIdx}
              className="text-center group"
              title={`${MONTHS[m.monthIdx]} ${year} — ${fmt$(m.amountCents)}`}
            >
              <div className={cn(
                'h-12 rounded-lg transition-all border border-transparent group-hover:ring-2 group-hover:ring-up/40',
                intensity(m.amountCents),
              )} />
              <div className="mt-1 font-mono text-[9.5px] text-text-mute uppercase tracking-wider">
                {MONTHS[m.monthIdx]}
              </div>
              {m.amountCents > 0 && (
                <div className="font-sans text-[10px] text-text-soft tabular-nums leading-none">
                  {fmt$(m.amountCents)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 mt-3 font-sans text-[10.5px] text-text-mute">
        <span>Less</span>
        <span className="w-3 h-3 rounded-sm bg-[#22252e]" />
        <span className="w-3 h-3 rounded-sm bg-up/25" />
        <span className="w-3 h-3 rounded-sm bg-up/45" />
        <span className="w-3 h-3 rounded-sm bg-up/70" />
        <span className="w-3 h-3 rounded-sm bg-up" />
        <span>More</span>
      </div>
    </div>
  );
};

export default RevenueHeatmap;
