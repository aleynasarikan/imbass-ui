import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Mail, Loader2, CheckCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  listNotifications, unreadCount, markRead, markAllRead,
  NotificationDTO,
} from '../../api/notifications';
import { useSocket } from '../../hooks/useSocket';

const POLL_MS = 30_000;

/* Static product updates (mock) — reused when user toggles the profile tab */
const UPDATES = [
  { ago: '18 min ago', title: 'Share & Earn: Imbass Referral Program is Live!',         category: 'Product updates' },
  { ago: '2 days ago', title: 'New Integration Available: Imbass × Cartloop',            category: 'Product updates' },
  { ago: '4 days ago', title: 'Grow with the Imbass Partner Program',                    category: 'Product updates' },
  { ago: '1 week ago', title: 'The Holiday Customer Retention Guide',                    category: 'Marketing' },
  { ago: '2 weeks ago',title: 'Top 5 Cart Abandonment Solutions for Shopify',            category: 'Marketing', highlighted: true },
  { ago: '3 weeks ago',title: 'Top 7 SMS Marketing Apps for Shopify in 2026',            category: 'Marketing' },
  { ago: '3 weeks ago',title: 'SMS Marketing Guide for Fashion Brands',                  category: 'Guides' },
];

const ActivityPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'updates' | 'bell' | 'mail'>('bell');

  const [notifs, setNotifs]   = useState<NotificationDTO[]>([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(false);

  /* Polling for notifications while user is authed */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetch = async () => {
      try {
        const [list, n] = await Promise.all([listNotifications({ limit: 20 }), unreadCount()]);
        if (cancelled) return;
        setNotifs(list);
        setUnread(n);
      } catch { /* silent */ }
    };

    setLoading(true);
    void fetch().finally(() => !cancelled && setLoading(false));
    const id = setInterval(fetch, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [user]);

  /* Real-time push via Socket.IO (Sprint 3) */
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = (newNotif: NotificationDTO) => {
      setNotifs(prev => {
        // Avoid duplicate if polling already picked it up
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev].slice(0, 20);
      });
      if (!newNotif.is_read) setUnread(prev => prev + 1);
    };
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [socket]);

  const handleItemClick = async (n: NotificationDTO) => {
    if (!n.is_read) {
      try { await markRead(n.id); } catch { /* ignore */ }
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnread(Math.max(0, unread - 1));
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    try { await markAllRead(); } catch { /* ignore */ }
    setNotifs(prev => prev.map(x => ({ ...x, is_read: true })));
    setUnread(0);
  };

  return (
    <aside className="fixed right-4 top-4 bottom-4 z-20 w-[296px] hidden xl:flex flex-col">
      <div className="flex items-center gap-2 mb-4 px-1">
        <IconChip active={tab === 'updates'} onClick={() => setTab('updates')} icon={User}  />
        <IconChip active={tab === 'bell'}    onClick={() => setTab('bell')}    icon={Bell}  badge={unread} accent />
        <IconChip active={tab === 'mail'}    onClick={() => setTab('mail')}    icon={Mail}  />
        {tab === 'bell' && unread > 0 && (
          <button
            onClick={handleMarkAll}
            className="ml-auto inline-flex items-center gap-1 font-sans text-[11px] text-text-mute hover:text-text transition"
          >
            <CheckCheck size={11} strokeWidth={2.25} /> Mark all read
          </button>
        )}
      </div>

      {tab === 'bell' ? (
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide animate-fade-in">
          {loading ? (
            <div className="py-8 text-center text-text-mute text-[12px]">
              <Loader2 size={13} className="animate-spin inline-block mr-1.5 align-middle" />
              Loading…
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-8 text-center">
              <div className="font-sans text-[13px] text-text">You're all caught up</div>
              <p className="font-sans text-[11px] text-text-mute mt-1">Invites, applications and updates land here.</p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {notifs.map(n => (
                <li
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={cn(
                    'relative rounded-2xl px-3.5 py-3 cursor-pointer group transition-colors border',
                    !n.is_read
                      ? 'border-iris/30 bg-iris-soft/20'
                      : 'border-transparent hover:bg-white/[0.02]',
                  )}
                >
                  {!n.is_read && (
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-iris" />
                  )}
                  <div className="font-sans text-[10.5px] text-text-mute mb-1">
                    {timeAgo(n.created_at)} · {n.type.toLowerCase().replace(/_/g, ' ')}
                  </div>
                  <div className="font-sans text-[13px] text-text font-medium leading-snug">
                    {n.title}
                  </div>
                  {n.body && (
                    <div className="font-sans text-[11.5px] text-text-mute mt-1 line-clamp-2">{n.body}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* Updates / Mail (mock) */
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide animate-fade-in">
          <ul className="flex flex-col">
            {UPDATES.map((u, i) => (
              <li
                key={i}
                className={cn(
                  'relative rounded-2xl px-3.5 py-3 transition-colors cursor-pointer group border',
                  u.highlighted ? 'border-white/15 bg-white/[0.03]' : 'border-transparent hover:bg-white/[0.02]',
                )}
              >
                <div className="font-sans text-[11px] text-text-mute mb-1">{u.ago}</div>
                <div className="font-sans text-[13px] text-text font-medium leading-snug group-hover:text-white transition">
                  {u.title}
                </div>
                <div className="font-sans text-[11px] text-text-faint mt-1.5">{u.category}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};

const IconChip: React.FC<{
  active?: boolean;
  icon: React.ElementType;
  onClick: () => void;
  badge?: number;
  accent?: boolean;
}> = ({ active, icon: Icon, onClick, badge, accent }) => (
  <button
    onClick={onClick}
    className={cn(
      'relative w-10 h-10 rounded-[12px] grid place-items-center transition-all border',
      active
        ? accent
          ? 'bg-iris-soft border-iris/30 text-iris'
          : 'bg-surface-sunk border-line-strong text-text'
        : 'bg-transparent border-line text-text-mute hover:text-text hover:bg-surface-sunk',
    )}
  >
    <Icon size={16} strokeWidth={1.75} />
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-iris text-white text-[9.5px] font-semibold grid place-items-center tabular-nums">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60)    return `${sec}s ago`;
  if (sec < 3600)  return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.round(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default ActivityPanel;
