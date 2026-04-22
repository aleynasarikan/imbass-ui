import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Crown, Medal, Award, Loader2, ArrowUpRight, TrendingUp, Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { getLeaderboard, LeaderboardEntryDTO } from '../api/creators';
import { formatFollowers } from '../data/creators';
import { xpToLevel } from '../components/creator/CreatorLevelBadge';
import TrustScoreBadge from '../components/creator/TrustScoreBadge';
import { cn } from '../lib/utils';

const rankBadge = (rank: number) => {
  if (rank === 1) return { Icon: Crown,  cls: 'bg-amber/20 text-amber border-amber/40'   };
  if (rank === 2) return { Icon: Medal,  cls: 'bg-text-faint/20 text-text-soft border-line-strong' };
  if (rank === 3) return { Icon: Award,  cls: 'bg-peach/20 text-peach border-peach/40' };
  return            { Icon: Trophy, cls: 'bg-surface-sunk text-text-mute border-line' };
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getLeaderboard(50);
        if (!cancelled) setEntries(data);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const podium = entries.slice(0, 3);
  const rest   = entries.slice(3);

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)]">
      <div className="surface p-5 lg:p-7 min-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 font-sans text-[13px] text-text-mute">
              <span>Discover</span>
              <span className="text-text-faint">›</span>
              <span className="text-text font-medium">Leaderboard</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
                Creator leaderboard
              </h1>
              <Trophy size={18} className="text-amber" strokeWidth={2} />
            </div>
            <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
              Ranked by XP — earned from accepted applications, completed campaigns, and badges.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-text-mute">
            <Loader2 size={18} className="animate-spin inline-block mr-2 align-middle" />
            Loading leaderboard…
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-iris-soft text-iris mb-3">
              <Sparkles size={20} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-[18px] font-semibold text-text">No creators yet</h2>
            <p className="font-sans text-[13px] text-text-mute mt-1">
              The leaderboard fills up as creators ship collaborations.
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {podium.map((c, i) => (
                  <PodiumCard key={c.id} entry={c} order={i} onOpen={() => navigate(`/u/${c.slug}`)} />
                ))}
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div className="rounded-[18px] bg-surface-sunk border border-line overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead>
                      <tr className="border-b border-line bg-[#0d0f13]/40">
                        <Th>#</Th>
                        <Th>Creator</Th>
                        <Th>Level</Th>
                        <Th>Trust</Th>
                        <Th>Followers</Th>
                        <Th>Accepted</Th>
                        <Th className="text-right">XP</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map(e => {
                        const b = rankBadge(e.rank);
                        const BIcon = b.Icon;
                        return (
                          <tr
                            key={e.id}
                            className="border-b border-line last:border-b-0 group hover:bg-surface-soft/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/u/${e.slug}`)}
                          >
                            <td className="px-5 py-3">
                              <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full border font-mono text-[12px] font-semibold tabular-nums', b.cls)}>
                                <BIcon size={12} strokeWidth={2.25} className="mr-0.5 opacity-60" />
                                {e.rank}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-9 w-9 ring-1 ring-white/10">
                                  <AvatarFallback className="bg-iris-grad text-white text-[12px] font-semibold">
                                    {e.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="leading-tight">
                                  <div className="font-sans text-[13px] font-semibold text-text group-hover:text-iris transition flex items-center gap-1.5">
                                    {e.name}
                                    {e.isAvailable && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-up flex-shrink-0" title="Available for work" />
                                    )}
                                  </div>
                                  <div className="font-mono text-[10.5px] text-text-mute">@{e.slug}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 font-mono text-[12px] text-text-soft">LVL {xpToLevel(e.xp)}</td>
                            <td className="px-5 py-3">
                              <TrustScoreBadge score={e.trustScore} />
                            </td>
                            <td className="px-5 py-3 font-sans text-[13px] text-text-soft tabular-nums">
                              {formatFollowers(e.followerCount)}
                            </td>
                            <td className="px-5 py-3 font-sans text-[13px] text-text-soft tabular-nums">
                              {e.acceptedApplications}
                            </td>
                            <td className="px-5 py-3 font-display text-[15px] font-semibold text-text tabular-nums text-right">
                              {e.xp.toLocaleString()}
                              <ArrowUpRight size={12} className="inline-block ml-1 text-text-faint opacity-0 group-hover:opacity-100 transition" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={cn('px-5 py-3 font-sans text-[10.5px] font-semibold text-text-mute uppercase tracking-[0.06em]', className)}>
    {children}
  </th>
);

const PodiumCard: React.FC<{ entry: LeaderboardEntryDTO; order: number; onOpen: () => void }> = ({ entry, order, onOpen }) => {
  const medal = rankBadge(entry.rank);
  const MedalIcon = medal.Icon;
  const tint = order === 0
    ? 'bg-[linear-gradient(135deg,rgba(245,194,104,0.18),rgba(155,140,255,0.12))] border-amber/30'
    : order === 1
      ? 'bg-[linear-gradient(135deg,rgba(200,202,209,0.12),rgba(155,140,255,0.08))] border-line-strong'
      : 'bg-[linear-gradient(135deg,rgba(244,184,157,0.14),rgba(155,140,255,0.10))] border-peach/30';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'relative rounded-[22px] p-5 text-left border group hover:-translate-y-0.5 transition-transform',
        tint,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-sans text-[11px] font-semibold', medal.cls)}>
          <MedalIcon size={11} strokeWidth={2.25} />
          #{entry.rank}
        </span>
        <TrustScoreBadge score={entry.trustScore} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-14 w-14 ring-2 ring-white/15">
          <AvatarFallback className="bg-iris-grad text-white text-[16px] font-semibold">
            {entry.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-bold text-text truncate flex items-center gap-1.5">
            {entry.name}
            {entry.isAvailable && (
              <span className="w-1.5 h-1.5 rounded-full bg-up flex-shrink-0" title="Available for work" />
            )}
          </div>
          <div className="font-mono text-[11px] text-text-mute">@{entry.slug}</div>
          {entry.niche && (
            <div className="font-sans text-[11px] text-text-mute mt-0.5">{entry.niche}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="XP"        value={entry.xp.toLocaleString()} />
        <Metric label="Level"     value={`${xpToLevel(entry.xp)}`} />
        <Metric label="Accepted"  value={`${entry.acceptedApplications}`} />
      </div>

      <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between font-sans text-[11.5px] text-text-mute">
        <span className="inline-flex items-center gap-1">
          <TrendingUp size={11} /> {formatFollowers(entry.followerCount)} followers
        </span>
        <span className="inline-flex items-center gap-1 text-iris opacity-0 group-hover:opacity-100 transition">
          Open profile <ArrowUpRight size={11} />
        </span>
      </div>
    </button>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-2 rounded-xl bg-black/15 backdrop-blur border border-white/5">
    <div className="font-sans text-[10px] uppercase tracking-wider text-text-mute">{label}</div>
    <div className="font-display text-[14px] font-semibold text-text tabular-nums leading-none mt-0.5">{value}</div>
  </div>
);

export default LeaderboardPage;
