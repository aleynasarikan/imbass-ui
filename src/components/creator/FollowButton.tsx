import React from 'react';
import { UserPlus, UserCheck, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsFollowing, followStore } from '../../lib/stores/follows';

interface FollowButtonProps {
  slug: string;
  /** "full" (primary CTA) | "compact" (icon-only circle) | "pill" (small labeled chip) */
  variant?: 'full' | 'compact' | 'pill';
  /** Bookmark icon instead of UserPlus — same semantics, different metaphor */
  asBookmark?: boolean;
  className?: string;
  /** Prevent parent onClick (e.g. when placed on top of a card button) */
  stopPropagation?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  slug, variant = 'full', asBookmark = false, className, stopPropagation = true,
}) => {
  const following = useIsFollowing(slug);

  const onToggle: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    followStore.toggle(slug);
  };

  const IconOn  = asBookmark ? BookmarkCheck : UserCheck;
  const IconOff = asBookmark ? Bookmark      : UserPlus;
  const Icon    = following ? IconOn : IconOff;
  const labelOn  = asBookmark ? 'Saved'     : 'Following';
  const labelOff = asBookmark ? 'Save'      : 'Follow';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={following}
        aria-label={following ? labelOn : labelOff}
        title={following ? labelOn : labelOff}
        className={cn(
          'w-8 h-8 grid place-items-center rounded-full border transition-all',
          following
            ? 'bg-iris text-white border-iris shadow-[0_4px_12px_-4px_rgba(155,140,255,0.6)]'
            : 'bg-surface-sunk/80 text-text-soft border-line hover:bg-surface-sunk hover:border-line-strong hover:text-text',
          className,
        )}
      >
        <Icon size={13} strokeWidth={2.25} />
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={following}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-sans text-[11.5px] font-semibold transition-all',
          following
            ? 'bg-iris-soft text-iris border-iris/30'
            : 'bg-surface-sunk text-text-soft border-line hover:border-line-strong hover:text-text',
          className,
        )}
      >
        <Icon size={11} strokeWidth={2.25} />
        {following ? labelOn : labelOff}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={following}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full font-sans text-[13px] font-semibold transition-all active:translate-y-px',
        following
          ? 'bg-iris-soft text-iris border border-iris/30 hover:bg-iris/20'
          : 'bg-iris text-white border border-iris shadow-[0_6px_16px_-6px_rgba(155,140,255,0.55)] hover:bg-iris-deep',
        className,
      )}
    >
      <Icon size={14} strokeWidth={2.25} />
      {following ? labelOn : labelOff}
    </button>
  );
};

export default FollowButton;
