import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, X, Loader2, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Avatar, AvatarFallback } from '../../../components/ui/Avatar';
import { listCreators, CreatorDTO } from '../../../api/creators';
import { inviteCreator, RosterMember } from '../../../api/agency';
// unused imports removed

interface Props {
  existingRoster: RosterMember[];
  onClose: () => void;
  onInvited: () => void;
}

const InviteCreatorModal: React.FC<Props> = ({ existingRoster, onClose, onInvited }) => {
  const [creators, setCreators] = useState<CreatorDTO[]>([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState('');
  const [pending, setPending]   = useState<string | null>(null);
  const [invited, setInvited]   = useState<Set<string>>(new Set());
  const [error, setError]       = useState('');

  const alreadyOnRoster = useMemo(() => new Set(existingRoster.map(r => r.creator_id)), [existingRoster]);

  useEffect(() => {
    (async () => {
      try {
        const data = await listCreators();
        setCreators(data);
      } catch {
        setError('Could not load creators. Is the backend running?');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return creators;
    return creators.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term) ||
      (c.niche || '').toLowerCase().includes(term) ||
      (c.location || '').toLowerCase().includes(term),
    );
  }, [creators, q]);

  const handleInvite = async (c: CreatorDTO) => {
    setError('');
    setPending(c.userId);
    try {
      await inviteCreator(c.userId);
      setInvited(prev => new Set(prev).add(c.userId));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invite failed');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 animate-fade-in isolate">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface w-full max-w-[560px] max-h-[86vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-line flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-iris" strokeWidth={2} />
              <h2 className="font-display text-[18px] font-semibold text-text">Invite creator</h2>
            </div>
            <p className="font-sans text-[12.5px] text-text-mute mt-0.5">
              Pick from the creator marketplace. They'll get a pending invite they can accept or decline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full bg-surface-sunk border border-line text-text-mute hover:text-text hover:border-line-strong transition"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-surface-sunk border border-line focus-within:border-iris/40 rounded-full px-3.5 h-10">
            <Search size={14} className="text-text-faint" strokeWidth={1.75} />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search creators…"
              className="flex-1 bg-transparent text-[13.5px] text-text placeholder:text-text-faint focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-2 rounded-xl border border-down/25 bg-down/10 px-3 py-2 font-sans text-[12.5px] text-down">
            {error}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pt-2 pb-4">
          {loading ? (
            <div className="py-10 text-center text-text-mute">
              <Loader2 size={16} className="animate-spin inline-block mr-2 align-middle" />
              Loading creators…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-text-mute font-sans text-[13px]">
              No creators match.
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map(c => {
                const onRoster = alreadyOnRoster.has(c.userId);
                const isInvited = invited.has(c.userId);
                const isPending = pending === c.userId;
                return (
                  <li
                    key={c.userId}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface-sunk transition-colors"
                  >
                    <Avatar className="h-9 w-9 ring-1 ring-white/10">
                      <AvatarFallback className="bg-iris-grad text-white text-[12px] font-semibold">
                        {c.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-sans text-[13px] font-semibold text-text truncate">{c.name}</div>
                      <div className="font-sans text-[11.5px] text-text-mute truncate">
                        @{c.slug}{c.niche ? ` · ${c.niche}` : ''}{c.location ? ` · ${c.location}` : ''}
                      </div>
                    </div>
                    {onRoster ? (
                      <span className="inline-flex items-center gap-1 font-sans text-[11.5px] text-text-mute">
                        <Check size={12} strokeWidth={2.5} /> On roster
                      </span>
                    ) : isInvited ? (
                      <span className="inline-flex items-center gap-1 font-sans text-[11.5px] text-iris">
                        <Check size={12} strokeWidth={2.5} /> Invited
                      </span>
                    ) : (
                      <Button
                        variant="iris"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleInvite(c)}
                      >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} strokeWidth={2.25} />}
                        Invite
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line flex items-center justify-between">
          <span className="font-sans text-[11.5px] text-text-mute">
            {invited.size > 0 ? `${invited.size} invitation${invited.size === 1 ? '' : 's'} sent` : 'Select creators to invite'}
          </span>
          <Button
            variant={invited.size > 0 ? 'iris' : 'outline'}
            size="sm"
            onClick={onInvited}
          >
            {invited.size > 0 ? 'Done' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* unused prop silencer removed */

export default InviteCreatorModal;
