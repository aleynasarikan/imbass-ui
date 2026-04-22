/**
 * BadgesPanel.tsx — Sprint 4: Creator badge showcase
 * Fetches real badges from API, falls back to empty state gracefully.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { getCreatorBadges, BadgeDTO, BADGE_META } from '../../api/creators';
import { ShieldCheck } from 'lucide-react';

interface BadgesPanelProps {
  slug: string;
  className?: string;
  style?: React.CSSProperties;
}

const BadgesPanel: React.FC<BadgesPanelProps> = ({ slug, className, style }) => {
  const [badges, setBadges] = useState<BadgeDTO[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCreatorBadges(slug);
        if (!cancelled) setBadges(data);
      } catch {
        /* badge endpoint offline — show empty gracefully */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Nothing to render until loaded
  if (!loaded) return null;
  if (badges.length === 0) return null;

  return (
    <section className={cn('surface p-6', className)} style={style}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={15} className="text-iris" strokeWidth={2} />
        <h2 className="font-display text-[16px] font-semibold text-text">Badges</h2>
        <span className="ml-auto font-mono text-[11px] text-text-faint">{badges.length} earned</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {badges.map(b => {
          const meta = BADGE_META[b.badgeCode] ?? {
            label: b.badgeCode,
            emoji: '🎖️',
            description: 'Achievement unlocked',
          };
          return (
            <BadgeChip
              key={b.badgeCode}
              emoji={meta.emoji}
              label={meta.label}
              description={meta.description}
              awardedAt={b.awardedAt}
            />
          );
        })}
      </div>
    </section>
  );
};

const BadgeChip: React.FC<{
  emoji: string;
  label: string;
  description: string;
  awardedAt: string;
}> = ({ emoji, label, description, awardedAt }) => {
  const date = new Date(awardedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  return (
    <div className="group relative">
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-default',
        'bg-surface-sunk border-line hover:border-iris/40 hover:bg-iris-soft/20',
      )}>
        <span className="text-[18px] leading-none">{emoji}</span>
        <div className="leading-tight">
          <div className="font-sans text-[12.5px] font-semibold text-text">{label}</div>
          <div className="font-sans text-[10.5px] text-text-faint">{date}</div>
        </div>
      </div>

      {/* Tooltip on hover */}
      <div className={cn(
        'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
      )}>
        <div className="bg-[#0d0f13] border border-line-strong rounded-lg px-3 py-2 shadow-float whitespace-nowrap">
          <div className="font-sans text-[11.5px] font-semibold text-white">{label}</div>
          <div className="font-sans text-[10.5px] text-text-mute mt-0.5">{description}</div>
        </div>
        <div className="w-2 h-2 bg-[#0d0f13] border-r border-b border-line-strong rotate-45 mx-auto -mt-1" />
      </div>
    </div>
  );
};

export default BadgesPanel;
