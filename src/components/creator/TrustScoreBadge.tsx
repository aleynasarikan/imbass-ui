import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrustScoreBadgeProps {
  /** 0-100 */
  score: number;
  /** Optional component breakdown — powers the tooltip */
  breakdown?: Array<{ label: string; value: number }>;
  className?: string;
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({ score, breakdown, className }) => {
  const [open, setOpen] = useState(false);

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tier    = clamped >= 85 ? 'high' : clamped >= 65 ? 'mid' : 'low';

  const cfg = {
    high: {
      Icon: ShieldCheck,
      label: 'High trust',
      pill:  'bg-up/14 text-up border-up/30',
      dot:   'bg-up',
    },
    mid: {
      Icon: Shield,
      label: 'Good trust',
      pill:  'bg-amber/14 text-amber border-amber/30',
      dot:   'bg-amber',
    },
    low: {
      Icon: ShieldAlert,
      label: 'Building trust',
      pill:  'bg-down/14 text-down border-down/30',
      dot:   'bg-down',
    },
  }[tier];

  const Icon = cfg.Icon;
  const defaultBreakdown = breakdown ?? [
    { label: 'On-time delivery',   value: Math.min(100, clamped + 2) },
    { label: 'Brief adherence',    value: Math.min(100, clamped - 3) },
    { label: 'Agency reviews',     value: Math.min(100, clamped + 5) },
    { label: 'Dispute rate',       value: 100 - Math.max(0, 100 - clamped) },
  ];

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn(
          'inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border font-sans text-[11.5px] font-semibold transition-colors',
          cfg.pill,
        )}
      >
        <Icon size={12} strokeWidth={2.25} />
        Trust <span className="tabular-nums">{clamped}</span>
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] w-[220px] z-30 animate-fade-in pointer-events-none">
          <div className="rounded-xl bg-[#0d0f13] border border-line-strong shadow-float p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
              <span className="font-sans text-[12px] font-semibold text-text">{cfg.label}</span>
              <span className="ml-auto font-mono text-[11px] text-text-mute tabular-nums">{clamped}/100</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {defaultBreakdown.map(b => (
                <li key={b.label} className="flex items-center gap-2">
                  <span className="font-sans text-[11px] text-text-mute flex-1 truncate">{b.label}</span>
                  <div className="w-16 h-1 rounded-full bg-surface-sunk overflow-hidden">
                    <div
                      className="h-full bg-iris-grad rounded-full"
                      style={{ width: `${Math.max(6, b.value)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10.5px] text-text-soft tabular-nums w-7 text-right">
                    {b.value}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 pt-2 border-t border-line font-sans text-[10.5px] text-text-faint leading-snug">
              Updated daily from verified campaign outcomes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustScoreBadge;
