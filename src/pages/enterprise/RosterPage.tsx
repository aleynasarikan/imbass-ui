import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, MoreVertical, Star, TrendingUp,
  MessageSquare, ClipboardList, Clock, CheckCircle2, ExternalLink, Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { xpToLevel } from '../../components/creator/CreatorLevelBadge';
import {
  getRoster, RosterMember,
} from '../../api/agency';
import InviteCreatorModal from './agency/InviteCreatorModal';
import NotesDrawer from './agency/NotesDrawer';
import TasksDrawer from './agency/TasksDrawer';
import { cn } from '../../lib/utils';

const formatReach = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

const RosterPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [inviteOpen, setInviteOpen]     = useState(false);
  const [notesFor,  setNotesFor]        = useState<RosterMember | null>(null);
  const [tasksFor,  setTasksFor]        = useState<RosterMember | null>(null);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const data = await getRoster();
      setMembers(data);
    } catch (e) {
      console.error('Roster fetch failed:', e);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchRoster(); }, []);

  /* ── Role gate ───────────────────────────── */
  if (user && user.role !== 'AGENCY') {
    return (
      <div className="animate-fade-in min-h-[calc(100vh-2rem)] flex items-center justify-center">
        <div className="surface p-8 max-w-[420px] text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-iris-soft text-iris mb-4">
            <Users size={20} strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-[22px] font-semibold text-text mb-2">Agency-only area</h1>
          <p className="font-sans text-[13.5px] text-text-mute mb-6 leading-relaxed">
            Rosters are exclusive to agency accounts — the creator-management surface for
            brands managing exclusive talent. Switch to an agency workspace to view.
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const accepted   = members.filter(m => m.status === 'ACCEPTED');
  const invited    = members.filter(m => m.status === 'INVITED');
  const avgTrust   = accepted.length
    ? Math.round(accepted.reduce((s, m) => s + (m.trust_score || 0), 0) / accepted.length)
    : 0;
  const topNiche   = (() => {
    const counts: Record<string, number> = {};
    accepted.forEach(m => { if (m.niche) counts[m.niche] = (counts[m.niche] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    return sorted[0]?.[0] || '—';
  })();

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.niche || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="animate-fade-in min-h-[calc(100vh-2rem)]">
      <div className="surface p-5 lg:p-7 min-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 font-sans text-[13px] text-text-mute">
              <span>Workspace</span>
              <span className="text-text-faint">›</span>
              <span className="text-text font-medium">Agency roster</span>
            </div>
            <h1 className="font-display text-[28px] font-semibold text-text tracking-[-0.02em] leading-none">
              Agency roster
            </h1>
            <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
              Your exclusive creators. Invite new talent, track performance, keep notes, and assign tasks.
            </p>
          </div>

          <Button variant="iris" onClick={() => setInviteOpen(true)}>
            <UserPlus size={14} strokeWidth={2.25} /> Invite creator
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <StatCard icon={Users}       tint="iris"   label="Active roster"   value={`${accepted.length}`} sub={invited.length ? `${invited.length} pending invite${invited.length === 1 ? '' : 's'}` : 'all accepted'} />
          <StatCard icon={TrendingUp}  tint="mint"   label="Avg. trust"      value={`${avgTrust}`} sub="across accepted creators" />
          <StatCard icon={Star}        tint="peach"  label="Top niche"       value={topNiche}      sub={accepted.length ? `${accepted.filter(m => m.niche === topNiche).length} creator${accepted.filter(m => m.niche === topNiche).length === 1 ? '' : 's'}` : '—'} />
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 bg-surface-sunk border border-line focus-within:border-iris/40 rounded-full px-3.5 h-10 max-w-[420px]">
          <Search size={14} className="text-text-faint" strokeWidth={1.75} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or niche…"
            className="flex-1 bg-transparent text-[13.5px] text-text placeholder:text-text-faint focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="rounded-[18px] bg-surface-sunk border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-line bg-[#0d0f13]/40">
                  <Th>Creator</Th>
                  <Th>Niche</Th>
                  <Th>Trust</Th>
                  <Th>Total reach</Th>
                  <Th>Conversions</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-mute">
                      <Loader2 size={18} className="animate-spin inline-block mr-2 align-middle" />
                      Loading roster…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-iris-soft text-iris mb-3">
                        <Users size={20} strokeWidth={1.75} />
                      </div>
                      <div className="font-sans text-[14px] font-semibold text-text mb-1">
                        {members.length === 0 ? 'Your roster is empty' : 'No match'}
                      </div>
                      <p className="font-sans text-[12.5px] text-text-mute mb-4 max-w-[320px] mx-auto">
                        {members.length === 0
                          ? 'Invite creators from the marketplace to start managing them here.'
                          : 'Try a different search term.'}
                      </p>
                      {members.length === 0 && (
                        <Button variant="iris" size="sm" onClick={() => setInviteOpen(true)}>
                          <UserPlus size={12} strokeWidth={2.25} /> Invite first creator
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map(m => (
                    <tr
                      key={m.creator_id}
                      className="border-b border-line last:border-b-0 group hover:bg-surface-soft/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => m.slug && navigate(`/u/${m.slug}`)}
                          disabled={!m.slug}
                          className="flex items-center gap-3 text-left disabled:cursor-default"
                        >
                          <Avatar className="h-10 w-10 ring-1 ring-white/10">
                            {m.avatar_url ? (
                              <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <AvatarFallback className="bg-iris-grad text-white text-[13px] font-semibold">
                                {m.full_name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="leading-tight">
                            <div className="font-sans text-[13.5px] font-semibold text-text group-hover:text-iris transition-colors flex items-center gap-1.5">
                              {m.full_name}
                              {m.slug && <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition" />}
                            </div>
                            <div className="font-mono text-[10.5px] text-text-mute">LVL {xpToLevel(m.xp)}</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {m.niche ? (
                          <span className="px-2 py-0.5 rounded-full bg-iris-soft text-iris text-[11px] font-medium">
                            {m.niche}
                          </span>
                        ) : <span className="text-text-faint text-[12px]">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-[#0d0f13] overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                m.trust_score >= 85 ? 'bg-up' : m.trust_score >= 65 ? 'bg-amber' : 'bg-down',
                              )}
                              style={{ width: `${m.trust_score}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11.5px] text-text tabular-nums w-7">
                            {m.trust_score}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-sans text-[13px] text-text tabular-nums">
                        {formatReach(Number(m.total_reach) || 0)}
                      </td>
                      <td className="px-6 py-4 font-sans text-[13px] text-text tabular-nums">
                        {Number(m.total_conversions) || 0}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={m.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <IconButton title="Notes" onClick={() => setNotesFor(m)}>
                            <MessageSquare size={15} strokeWidth={1.75} />
                          </IconButton>
                          <IconButton title="Tasks" onClick={() => setTasksFor(m)}>
                            <ClipboardList size={15} strokeWidth={1.75} />
                          </IconButton>
                          <IconButton title="More">
                            <MoreVertical size={15} strokeWidth={1.75} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-overs / Modals */}
      {inviteOpen && (
        <InviteCreatorModal
          existingRoster={members}
          onClose={() => setInviteOpen(false)}
          onInvited={() => { setInviteOpen(false); void fetchRoster(); }}
        />
      )}
      {notesFor && (
        <NotesDrawer member={notesFor} onClose={() => setNotesFor(null)} />
      )}
      {tasksFor && (
        <TasksDrawer member={tasksFor} onClose={() => setTasksFor(null)} />
      )}
    </div>
  );
};

/* ─── bits ─── */

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={cn('px-6 py-3 font-sans text-[11px] font-medium text-text-mute uppercase tracking-[0.06em]', className)}>
    {children}
  </th>
);

interface StatCardProps {
  icon: React.ElementType;
  tint: 'iris' | 'mint' | 'peach';
  label: string;
  value: string;
  sub: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon: Icon, tint, label, value, sub }) => {
  const tintBg = {
    iris:  'bg-iris-soft text-iris',
    mint:  'bg-up/14 text-up',
    peach: 'bg-peach/14 text-peach',
  }[tint];
  return (
    <div className="surface-sunk p-4 flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-2xl grid place-items-center', tintBg)}>
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <div className="font-sans text-[11px] uppercase tracking-wider text-text-mute">{label}</div>
        <div className="font-display text-[20px] font-semibold text-text tabular-nums leading-none mt-0.5">
          {value}
        </div>
        <div className="font-sans text-[11.5px] text-text-mute mt-0.5">{sub}</div>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ status: RosterMember['status'] }> = ({ status }) => {
  const map = {
    ACCEPTED:   { cls: 'bg-up/14 text-up',       icon: CheckCircle2 },
    INVITED:    { cls: 'bg-amber/14 text-amber', icon: Clock },
    REJECTED:   { cls: 'bg-down/14 text-down',   icon: Clock },
    TERMINATED: { cls: 'bg-text-faint/14 text-text-mute', icon: Clock },
  }[status];
  const Icon = map.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold', map.cls)}>
      <Icon size={11} strokeWidth={2.25} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

const IconButton: React.FC<{ children: React.ReactNode; title: string; onClick?: () => void }> = ({ children, title, onClick }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="w-8 h-8 grid place-items-center rounded-lg text-text-mute hover:text-text hover:bg-iris-soft/40 transition-colors"
  >
    {children}
  </button>
);

export default RosterPage;
