import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CreatorLevelBadgeProps {
  xp: number;
  /** "compact" (single pill) | "full" (pill + XP bar) */
  variant?: 'compact' | 'full';
  className?: string;
}

/** level = floor(sqrt(xp / 50)) — xp needed for level n = 50 * n^2 */
export const xpToLevel = (xp: number): number => Math.max(0, Math.floor(Math.sqrt(xp / 50)));
export const levelToXp = (lvl: number): number => 50 * lvl * lvl;

const TITLES: Record<number, string> = {
  0:  'Rookie',
  1:  'Rookie',
  2:  'Rising',
  3:  'Rising',
  4:  'Established',
  5:  'Established',
  6:  'Established',
  7:  'Verified Pro',
  8:  'Verified Pro',
  9:  'Verified Pro',
  10: 'Icon',
};
const titleFor = (lvl: number): string => {
  if (lvl >= 15) return 'Legend';
  if (lvl >= 10) return 'Icon';
  return TITLES[lvl] || 'Icon';
};

const CreatorLevelBadge: React.FC<CreatorLevelBadgeProps> = ({
  xp, variant = 'full', className,
}) => {
  const level = xpToLevel(xp);
  const currentFloor = levelToXp(level);
  const nextFloor    = levelToXp(level + 1);
  const intoLevel    = xp - currentFloor;
  const levelSpan    = nextFloor - currentFloor;
  const pct          = Math.max(0, Math.min(1, intoLevel / levelSpan));

  if (variant === 'compact') {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-iris-soft border border-iris/30',
        className,
      )}>
        <Sparkles size={11} className="text-iris" strokeWidth={2} />
        <span className="font-mono text-[10.5px] font-semibold text-iris tracking-wide">
          LVL {level}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Level number block */}
      <div className="relative w-14 h-14 rounded-2xl bg-iris-grad grid place-items-center shrink-0 shadow-[0_6px_16px_-6px_rgba(155,140,255,0.55)]">
        <span className="absolute top-1 left-2 font-mono text-[8.5px] font-semibold text-white/70 tracking-[0.15em]">
          LVL
        </span>
        <span className="font-display text-[24px] font-bold text-white tabular-nums leading-none mt-1.5">
          {level}
        </span>
      </div>

      {/* Meta + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-sans text-[13px] text-text font-semibold">
            {titleFor(level)}
          </span>
          <span className="font-mono text-[11px] text-text-mute tabular-nums">
            {intoLevel.toLocaleString()} / {levelSpan.toLocaleString()} XP
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-sunk overflow-hidden">
          <div
            className="h-full bg-iris-grad rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <div className="mt-1 font-sans text-[10.5px] text-text-faint">
          {(levelSpan - intoLevel).toLocaleString()} XP to LVL {level + 1}
        </div>
      </div>
    </div>
  );
};

export default CreatorLevelBadge;
