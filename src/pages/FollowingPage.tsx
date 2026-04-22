import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass, ArrowUpRight, MapPin, Users as UsersIcon, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import CreatorLevelBadge from '../components/creator/CreatorLevelBadge';
import TrustScoreBadge from '../components/creator/TrustScoreBadge';
import FollowButton from '../components/creator/FollowButton';
import { useFollows } from '../lib/stores/follows';
import { CREATORS, MockCreator, formatFollowers, dtoToMockCreator } from '../data/creators';
import { listMyFollows, listCreators } from '../api/creators';

const FollowingPage: React.FC = () => {
  const navigate = useNavigate();
  const { follows, count, clear } = useFollows();

  // Build a hybrid catalog: API follows ∪ API list ∪ mock list, keyed by slug
  const [catalog, setCatalog] = useState<Record<string, MockCreator>>(() =>
    CREATORS.reduce((acc, c) => {
      acc[c.slug] = c;
      return acc;
    }, {} as Record<string, MockCreator>)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mine, all] = await Promise.allSettled([listMyFollows(), listCreators()]);
        if (cancelled) return;
        const merged: Record<string, MockCreator> = { ...catalog };
        if (mine.status === 'fulfilled') {
          mine.value.forEach(d => { merged[d.slug] = dtoToMockCreator(d); });
        }
        if (all.status === 'fulfilled') {
          all.value.forEach(d => { if (!merged[d.slug]) merged[d.slug] = dtoToMockCreator(d); });
        }
        setCatalog(merged);
      } catch { /* keep mock catalog */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const followedCreators = useMemo(
    () => Array.from(follows)
      .map(slug => catalog[slug])
      .filter((c): c is MockCreator => !!c),
    [follows, catalog],
  );

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)]">
      <div className="surface p-5 lg:p-7 min-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 font-sans text-[13px] text-text-mute">
              <span>Discover</span>
              <span className="text-text-faint">›</span>
              <span className="text-text font-medium">Following</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
                Following
              </h1>
              <Bookmark size={18} className="text-iris" strokeWidth={2} />
            </div>
            <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
              Creators you've bookmarked — kept on this device.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-surface-sunk border border-line">
              <UsersIcon size={13} className="text-text-mute" strokeWidth={2} />
              <span className="font-sans text-[12px] text-text-soft tabular-nums">
                <span className="text-text font-semibold">{count}</span> saved
              </span>
            </div>
            {count > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Remove all ${count} saved creators?`)) clear();
                }}
              >
                <Trash2 size={12} strokeWidth={2.25} /> Clear all
              </Button>
            )}
          </div>
        </div>

        {count === 0 ? (
          <EmptyState onBrowse={() => navigate('/marketplace')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {followedCreators.map((c, i) => (
              <div
                key={c.slug}
                className="relative surface-sunk p-4 group hover:bg-surface-soft hover:border-line-strong transition-all animate-rise-in cursor-pointer"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => navigate(`/u/${c.slug}`)}
              >
                <div className="absolute top-3 right-3 z-10">
                  <FollowButton slug={c.slug} variant="compact" asBookmark />
                </div>

                <div className="flex items-start gap-3 mb-3 pr-8">
                  <Avatar className="h-12 w-12 ring-1 ring-white/10">
                    <AvatarFallback className="bg-iris-grad text-white text-[15px] font-semibold">
                      {c.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-[13.5px] font-semibold text-text truncate">{c.name}</span>
                      {c.available && (
                        <span className="w-1.5 h-1.5 rounded-full bg-up" title="Available now" />
                      )}
                    </div>
                    <div className="font-sans text-[11.5px] text-text-mute truncate">@{c.handle}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <CreatorLevelBadge xp={c.xp} variant="compact" />
                </div>

                <p className="font-sans text-[12.5px] text-text-soft leading-snug mb-3 line-clamp-2 min-h-[34px]">
                  {c.bio}
                </p>

                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {c.platforms.slice(0, 3).map(p => (
                      <span
                        key={p}
                        className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-[#0d0f13] border border-line text-[10.5px] font-medium text-text-soft capitalize"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <TrustScoreBadge score={c.trust} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-line">
                  <div className="flex items-center gap-3 text-text-mute font-sans text-[11.5px]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} strokeWidth={2} /> {c.location}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <UsersIcon size={11} strokeWidth={2} /> {formatFollowers(c.followers)}
                    </span>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 text-iris transition-opacity">
                    <ArrowUpRight size={14} strokeWidth={2.25} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => (
  <div className="py-20 grid place-items-center">
    <div className="text-center max-w-[360px]">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-iris-soft text-iris mb-4">
        <Bookmark size={22} strokeWidth={1.75} />
      </div>
      <h2 className="font-display text-[18px] font-semibold text-text mb-2">No saved creators yet</h2>
      <p className="font-sans text-[13.5px] text-text-mute mb-5 leading-relaxed">
        Bookmark creators from the marketplace or any public profile to keep a shortlist here.
      </p>
      <Button variant="iris" onClick={onBrowse}>
        <Compass size={13} strokeWidth={2.25} /> Browse the marketplace
      </Button>
    </div>
  </div>
);

export default FollowingPage;
