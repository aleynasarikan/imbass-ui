import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import {
  Check, X, Gavel, Inbox, Clock, ArrowRightLeft, CheckCircle2, XCircle,
  Search, MoreHorizontal, Wifi,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../api';
import { useSocket } from '../hooks/useSocket';

interface Negotiation {
  id: string;
  campaign_id: string;
  campaign_name: string;
  creator_id: string;
  agency_id: string;
  influencer_name?: string;
  agency_name?: string;
  current_offer_cents: string;
  status: string;
  created_at: string;
}

type FilterKey = 'ALL' | 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED';

const statusStyle: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-[#fff4de] text-[#8a5a00]', dot: 'bg-amber' },
  COUNTERED: { label: 'Countered', cls: 'bg-iris-soft text-iris-deep', dot: 'bg-iris' },
  ACCEPTED:  { label: 'Accepted',  cls: 'bg-[#e7f7ee] text-[#0f7a3d]', dot: 'bg-up' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-[#ffe5e8] text-[#a8232d]', dot: 'bg-down' },
};

const fmtTL = (cents?: string) =>
  cents ? (parseInt(cents) / 100).toLocaleString('tr-TR') : null;

const NegotiationConsole: React.FC = () => {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerInput, setOfferInput] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [query, setQuery] = useState('');

  const fetchNegotiations = async () => {
    setLoading(true);
    try {
      const res = await api.get<Negotiation[]>('/negotiations');
      setNegotiations(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNegotiations(); }, []);

  /* ── Sprint 3: Real-time negotiation updates via Socket.IO ── */
  const socket = useSocket();
  const [liveUpdate, setLiveUpdate] = useState(false);
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { negotiationId: string; event: string; negotiation: Negotiation }) => {
      // Optimistically update the specific negotiation in state
      setNegotiations(prev =>
        prev.map(n => n.id === payload.negotiationId ? { ...n, ...payload.negotiation } : n)
      );
      // Flash the live badge briefly
      setLiveUpdate(true);
      setTimeout(() => setLiveUpdate(false), 3000);
    };
    socket.on('negotiation:update', handler);
    return () => { socket.off('negotiation:update', handler); };
  }, [socket]);

  const counts = useMemo(() => ({
    ALL:       negotiations.length,
    PENDING:   negotiations.filter(n => n.status === 'PENDING').length,
    COUNTERED: negotiations.filter(n => n.status === 'COUNTERED').length,
    ACCEPTED:  negotiations.filter(n => n.status === 'ACCEPTED').length,
    REJECTED:  negotiations.filter(n => n.status === 'REJECTED').length,
  }), [negotiations]);

  const visible = useMemo(() => {
    let out = filter === 'ALL' ? negotiations : negotiations.filter(n => n.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(n =>
        n.campaign_name.toLowerCase().includes(q) ||
        (n.influencer_name?.toLowerCase().includes(q)) ||
        (n.agency_name?.toLowerCase().includes(q))
      );
    }
    return out;
  }, [negotiations, filter, query]);

  const handleMakeOffer = async (e: FormEvent, campaignId: string) => {
    e.preventDefault();
    const amountStr = offerInput[campaignId];
    if (!amountStr) return;
    try {
      await api.post(`/negotiations/${campaignId}/offer`, { offerAmount: parseInt(amountStr) * 100 });
      fetchNegotiations();
      setOfferInput({ ...offerInput, [campaignId]: '' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to make offer');
    }
  };

  const handleAccept = async (id: string) => {
    try { await api.put(`/negotiations/${id}/accept`); fetchNegotiations(); }
    catch (err: any) { setError(err?.response?.data?.message || 'Failed to accept'); }
  };

  const handleReject = async (id: string) => {
    try { await api.put(`/negotiations/${id}/reject`); fetchNegotiations(); }
    catch (err: any) { setError(err?.response?.data?.message || 'Failed to reject'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="meta-label">Loading negotiations…</span>
      </div>
    );
  }

  const filterChips: { key: FilterKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'ALL',       label: 'All',       icon: Inbox,          count: counts.ALL },
    { key: 'PENDING',   label: 'Pending',   icon: Clock,          count: counts.PENDING },
    { key: 'COUNTERED', label: 'Countered', icon: ArrowRightLeft, count: counts.COUNTERED },
    { key: 'ACCEPTED',  label: 'Accepted',  icon: CheckCircle2,   count: counts.ACCEPTED },
    { key: 'REJECTED',  label: 'Rejected',  icon: XCircle,        count: counts.REJECTED },
  ];

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      {/* ═════ Head ═════ */}
      <header className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 font-sans text-[13px] text-text-mute">
            <span>Workspace</span>
            <span className="text-text-faint">›</span>
            <span>Negotiations</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[30px] md:text-[34px] font-semibold text-text tracking-[-0.02em] leading-tight">
              Console
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-iris-soft text-iris-deep text-[11px] font-medium rounded-full">
              {counts.ALL} open
            </span>
            {socket?.connected && (
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium transition-all',
                liveUpdate
                  ? 'bg-up/15 text-up animate-pulse'
                  : 'bg-surface-sunk text-text-faint'
              )}>
                <Wifi size={10} strokeWidth={2} />
                {liveUpdate ? 'Live update' : 'Live'}
              </span>
            )}
          </div>
          <p className="font-sans text-[14px] text-text-mute mt-1.5 max-w-xl">
            Offers, counters, and closes — every exchange tracked in one place.
          </p>
        </div>
      </header>

      {error && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[#ffe5e8] text-[#a8232d] text-[13px] font-sans mb-4">
          {error}
        </div>
      )}

      {/* ═════ Summary cards ═════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { k: 'Pending',   v: counts.PENDING,   sub: 'Awaiting response',    tint: 'bg-[#fff4de] text-[#8a5a00]', dot: 'bg-amber' },
          { k: 'Countered', v: counts.COUNTERED, sub: 'In active bargaining', tint: 'bg-iris-soft text-iris-deep', dot: 'bg-iris' },
          { k: 'Accepted',  v: counts.ACCEPTED,  sub: 'Signed off',           tint: 'bg-[#e7f7ee] text-[#0f7a3d]', dot: 'bg-up' },
          { k: 'Rejected',  v: counts.REJECTED,  sub: 'Closed, no deal',      tint: 'bg-[#ffe5e8] text-[#a8232d]', dot: 'bg-down' },
        ].map((s, i) => (
          <div
            key={s.k}
            className="surface p-5 flex items-center justify-between animate-rise-in"
            style={{ animationDelay: `${50 * i}ms` }}
          >
            <div>
              <span className={cn('inline-flex items-center gap-1.5 font-sans text-[11px] font-medium px-2 py-0.5 rounded-full mb-2', s.tint)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                {s.k}
              </span>
              <div className="font-sans text-[12px] text-text-mute">{s.sub}</div>
            </div>
            <span className="font-display text-[34px] leading-none text-text tabular-nums font-semibold">
              {s.v}
            </span>
          </div>
        ))}
      </div>

      {/* ═════ Toolbar: filters + search ═════ */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {filterChips.map(f => {
            const on = filter === f.key;
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-sans font-medium transition-all',
                  on
                    ? 'bg-iris text-white shadow-coral'
                    : 'bg-white border border-line text-text-mute hover:border-line-strong hover:text-text'
                )}
              >
                <Icon size={13} strokeWidth={2} />
                {f.label}
                <span className={cn(
                  'text-[11px] font-mono px-1.5 py-0.5 rounded-full tabular-nums',
                  on ? 'bg-white/20 text-white' : 'bg-surface-sunk text-text-faint'
                )}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 bg-white border border-line focus-within:border-iris/40 rounded-full px-3.5 h-9 transition-all">
          <Search size={13} className="text-text-faint" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search negotiations…"
            className="w-52 bg-transparent text-[13px] text-text placeholder:text-text-faint focus:outline-none font-sans"
          />
        </div>
      </div>

      {/* ═════ List ═════ */}
      {visible.length === 0 ? (
        <div className="surface py-20 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-iris-soft grid place-items-center mb-4">
            <Gavel size={20} className="text-iris-deep" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-[22px] font-semibold text-text">Nothing on the docket</h2>
          <p className="font-sans text-[13px] text-text-mute mt-2 max-w-sm">
            New offers and counters will appear here the moment they're filed.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((neg, i) => {
            const counterparty = user?.role === 'INFLUENCER' ? neg.agency_name : neg.influencer_name;
            const offer = fmtTL(neg.current_offer_cents);
            const s = statusStyle[neg.status] || statusStyle.PENDING;
            const canBid = neg.status === 'PENDING' || neg.status === 'COUNTERED' || neg.status === 'REJECTED' || !neg.current_offer_cents;

            return (
              <article
                key={neg.id}
                className="surface p-5 md:p-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:gap-8 hover:shadow-pop transition-shadow animate-rise-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* LEFT — identity */}
                <div className="flex items-start gap-4 min-w-0">
                  <Avatar className="h-11 w-11 ring-2 ring-white shadow-soft shrink-0">
                    <AvatarFallback>
                      {(counterparty || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('inline-flex items-center gap-1.5 font-sans text-[11px] font-medium px-2 py-0.5 rounded-full', s.cls)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                        {s.label}
                      </span>
                      <span className="font-mono text-[10.5px] tracking-wider-x text-text-faint tabular-nums">
                        File Nº{String(i + 1).padStart(3, '0')}
                      </span>
                    </div>
                    <h3 className="font-display text-[18px] md:text-[20px] font-semibold text-text leading-tight truncate">
                      {neg.campaign_name}
                    </h3>
                    <p className="font-sans text-[13px] text-text-mute mt-1">
                      with <span className="text-text font-medium">{counterparty || 'Counterparty'}</span>
                      {neg.created_at && (
                        <> · <span className="text-text-faint">{new Date(neg.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span></>
                      )}
                    </p>
                  </div>
                  <button className="p-1.5 text-text-faint hover:text-text hover:bg-surface-sunk rounded-lg transition">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* RIGHT — offer + actions */}
                <div className="md:min-w-[340px] md:border-l md:border-line md:pl-8 flex flex-col gap-4 items-start md:items-end">
                  <div className="w-full md:w-auto md:text-right">
                    <div className="font-sans text-[11px] text-text-mute font-medium mb-0.5">
                      Standing offer
                    </div>
                    {offer ? (
                      <div className="font-display text-[28px] md:text-[30px] font-semibold text-text tabular-nums leading-none">
                        <span className="text-iris mr-0.5">₺</span>{offer}
                      </div>
                    ) : (
                      <div className="font-sans text-[14px] text-text-faint italic">
                        No offer yet
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap w-full md:w-auto md:justify-end">
                    {neg.status === 'PENDING' && (
                      <>
                        <Button size="sm" onClick={() => handleAccept(neg.id)}>
                          <Check size={12} strokeWidth={2.25} /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(neg.id)}>
                          <X size={12} strokeWidth={2.25} /> Reject
                        </Button>
                      </>
                    )}

                    {canBid && (
                      <form onSubmit={(e) => handleMakeOffer(e, neg.campaign_id)} className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-text-faint pointer-events-none">₺</span>
                          <Input
                            type="number"
                            placeholder="Counter"
                            value={offerInput[neg.campaign_id] || ''}
                            onChange={(e) => setOfferInput({ ...offerInput, [neg.campaign_id]: e.target.value })}
                            className="!h-9 !w-36 !pl-7 !text-[13px]"
                          />
                        </div>
                        <Button type="submit" size="sm" variant="soft">
                          <Gavel size={12} strokeWidth={2} /> Bid
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
};

export default NegotiationConsole;
