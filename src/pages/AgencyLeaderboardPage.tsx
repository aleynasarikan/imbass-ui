import React, { useEffect, useState } from 'react';
import {
  Trophy, Crown, Medal, Award, Loader2, Users as UsersIcon, Handshake, DollarSign, Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { getAgencyLeaderboard, AgencyLeaderboardRow } from '../api/revenue';
import { cn } from '../lib/utils';

const fmt$ = (cents: number) => {
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const rankBadge = (rank: number) => {
  if (rank === 1) return { Icon: Crown,  cls: 'bg-amber/20 text-amber border-amber/40' };
  if (rank === 2) return { Icon: Medal,  cls: 'bg-text-faint/20 text-text-soft border-line-strong' };
  if (rank === 3) return { Icon: Award,  cls: 'bg-peach/20 text-peach border-peach/40' };
  return            { Icon: Trophy, cls: 'bg-surface-sunk text-text-mute border-line' };
};

const AgencyLeaderboardPage: React.FC = () => {
  const [rows, setRows] = useState<AgencyLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getAgencyLeaderboard(50);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const podium = rows.slice(0, 3);
  const rest   = rows.slice(3);

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)]">
      <div className="surface p-5 lg:p-7 min-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 font-sans text-[13px] text-text-mute">
              <span>Discover</span>
              <span className="text-text-faint">›</span>
              <span className="text-text font-medium">Agency ranking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
                Agency ranking
              </h1>
              <Handshake size={18} className="text-iris" strokeWidth={2} />
            </div>
            <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
              Ranked by total paid out to creators — a trust signal for brands picking a partner agency.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-text-mute">
            <Loader2 size={18} className="animate-spin inline-block mr-2 align-middle" />
            Loading agencies…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-iris-soft text-iris mb-3">
              <Sparkles size={20} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-[18px] font-semibold text-text">No agencies yet</h2>
            <p className="font-sans text-[13px] text-text-mute mt-1">
              The ranking fills up as agencies pay out milestones.
            </p>
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {podium.map((r, i) => (
                  <PodiumCard key={r.agencyId} row={r} order={i} />
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="rounded-[18px] bg-surface-sunk border border-line overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="border-b border-line bg-[#0d0f13]/40">
                        <Th>#</Th>
                        <Th>Agency</Th>
                        <Th>Roster</Th>
                        <Th>Campaigns</Th>
                        <Th>Settled</Th>
                        <Th>Accepted apps</Th>
                        <Th className="text-right">Paid out</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map(r => {
                        const b = rankBadge(r.rank);
                        const BIcon = b.Icon;
                        return (
                          <tr key={r.agencyId} className="border-b border-line last:border-b-0 hover:bg-surface-soft/50 transition-colors">
                            <td className="px-5 py-3">
                              <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full border font-mono text-[12px] font-semibold tabular-nums', b.cls)}>
                                <BIcon size={12} strokeWidth={2.25} className="mr-0.5 opacity-60" />
                                {r.rank}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-9 w-9 ring-1 ring-white/10">
                                  <AvatarFallback className="bg-iris-grad text-white text-[12px] font-semibold">
                                    {r.agencyName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-sans text-[13px] font-semibold text-text">{r.agencyName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 font-sans text-[13px] text-text-soft tabular-nums">{r.rosterSize}</td>
                            <td className="px-5 py-3 font-sans text-[13px] text-text-soft tabular-nums">{r.campaignCount}</td>
                            <td className="px-5 py-3 font-sans text-[13px] text-text-soft tabular-nums">{r.settledCount}</td>
                            <td className="px-5 py-3 font-sans text-[13px] text-text-soft tabular-nums">{r.acceptedApps}</td>
                            <td className="px-5 py-3 text-right font-display text-[15px] font-semibold text-text tabular-nums">
                              {fmt$(r.totalPaidCents)}
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

const PodiumCard: React.FC<{ row: AgencyLeaderboardRow; order: number }> = ({ row, order }) => {
  const medal = rankBadge(row.rank);
  const MedalIcon = medal.Icon;
  const tint = order === 0
    ? 'bg-[linear-gradient(135deg,rgba(245,194,104,0.18),rgba(155,140,255,0.12))] border-amber/30'
    : order === 1
      ? 'bg-[linear-gradient(135deg,rgba(200,202,209,0.12),rgba(155,140,255,0.08))] border-line-strong'
      : 'bg-[linear-gradient(135deg,rgba(244,184,157,0.14),rgba(155,140,255,0.10))] border-peach/30';

  return (
    <div className={cn('relative rounded-[22px] p-5 border', tint)}>
      <div className="flex items-start justify-between mb-4">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-sans text-[11px] font-semibold', medal.cls)}>
          <MedalIcon size={11} strokeWidth={2.25} />
          #{row.rank}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-up/14 text-up text-[11px] font-semibold">
          <DollarSign size={10} strokeWidth={2.5} />
          {fmt$(row.totalPaidCents)}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-14 w-14 ring-2 ring-white/15">
          <AvatarFallback className="bg-iris-grad text-white text-[18px] font-semibold">
            {row.agencyName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-display text-[16px] font-bold text-text truncate">{row.agencyName}</div>
          <div className="font-sans text-[11.5px] text-text-mute mt-0.5">
            {row.campaignCount} campaigns · {row.settledCount} settled
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={UsersIcon}  label="Roster"  value={`${row.rosterSize}`} />
        <Stat icon={Handshake}  label="Accepted" value={`${row.acceptedApps}`} />
        <Stat icon={Award}      label="Settled" value={`${row.settledCount}`} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="p-2 rounded-xl bg-black/15 backdrop-blur border border-white/5">
    <div className="flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider text-text-mute">
      <Icon size={10} /> {label}
    </div>
    <div className="font-display text-[14px] font-semibold text-text tabular-nums leading-none mt-0.5">{value}</div>
  </div>
);

export default AgencyLeaderboardPage;
