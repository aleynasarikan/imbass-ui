import React, { useState } from 'react';
import {
  LayoutGrid, FileText, MessageSquare, Rocket, Handshake,
  AlertTriangle, CreditCard, Settings, BookOpen, PhoneCall,
  ChevronLeft, ChevronDown, MoreVertical, HelpCircle, LogOut,
  Compass, Award, Bookmark, Users, Trophy,
} from 'lucide-react';
import { useFollows } from '../../lib/stores/follows';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarFallback } from '../ui/Avatar';

interface EnterpriseSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

/* Brand wordmark — Rebaid-style lowercase with an X accent */
const BrandWord: React.FC = () => (
  <div className="flex items-center gap-1 select-none">
    <svg viewBox="0 0 14 14" className="w-[14px] h-[14px] text-iris" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 2 L12 12 M12 2 L2 12" />
    </svg>
    <span className="font-display text-[17px] font-semibold tracking-[-0.03em] text-text leading-none">
      imbass
    </span>
  </div>
);

const primary = [
  { id: 'Home', label: 'Dashboard', icon: LayoutGrid },
];

const discover: Array<{ id: string; label: string; icon: any }> = [
  { id: 'Marketplace', label: 'Marketplace', icon: Compass },
  { id: 'Showcase',    label: 'Showcase',    icon: Award },
  { id: 'Leaderboard', label: 'Creators',    icon: Trophy },
  { id: 'Agencies',    label: 'Agencies',    icon: Handshake },
  { id: 'Following',   label: 'Following',   icon: Bookmark },
];

type WorkspaceItem = { id: string; label: string; icon: any; badge?: string; agencyOnly?: boolean };

const workspace: WorkspaceItem[] = [
  { id: 'Roster',        label: 'Agency Roster',    icon: Users, agencyOnly: true },
  { id: 'MyCampaigns',   label: 'My Campaigns',     icon: Handshake, agencyOnly: true },
  { id: 'Collaborations',label: 'Campaigns',        icon: Handshake },
  { id: 'Console',       label: 'Negotiations',     icon: MessageSquare },
  { id: 'Analytics',     label: 'Analytics',        icon: Rocket },
  { id: 'Reports',       label: 'Reports',          icon: FileText, badge: '3' },
];

const operations = [
  { id: 'Disputes', label: 'Disputes', icon: AlertTriangle },
  { id: 'Billing',  label: 'Billing',  icon: CreditCard },
  { id: 'Profile',  label: 'Settings', icon: Settings },
];

const misc = [
  { id: 'Blog',    label: 'Blog',        icon: BookOpen },
  { id: 'Contact', label: 'Contact us',  icon: PhoneCall },
];

const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  activePage, setActivePage, isOpen, onClose,
}) => {
  const { logout, user } = useAuth();
  const { count: followCount } = useFollows();
  const [langOpen, setLangOpen] = useState(false);

  const onNav = (id: string) => {
    setActivePage(id);
    if (window.innerWidth <= 1024) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-4 top-4 bottom-4 z-50 w-[224px]",
          "bg-surface border border-line rounded-[22px] shadow-card",
          "flex flex-col py-4",
          "transition-transform duration-300 ease-out overflow-hidden",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)] lg:translate-x-0"
        )}
      >
        {/* Header — brand + collapse */}
        <div className="px-4 flex items-center justify-between">
          <BrandWord />
          <button
            onClick={onClose}
            className="w-7 h-7 grid place-items-center rounded-full border border-line text-text-mute hover:text-text hover:bg-surface-sunk transition"
            title="Collapse"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={13} strokeWidth={2} />
          </button>
        </div>

        {/* Profile card */}
        <button
          onClick={() => onNav('Profile')}
          className="mx-3 mt-4 p-2.5 rounded-2xl border border-line bg-surface-sunk/60 hover:bg-surface-sunk hover:border-line-strong transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 ring-1 ring-white/10">
              <AvatarFallback className="bg-iris-grad text-white text-[12px]">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-sans text-[12.5px] font-semibold text-text truncate leading-tight">
                {user?.email?.split('@')[0] || 'Anton Avilov'}
              </div>
              <div className="font-sans text-[10.5px] text-text-mute mt-0.5 truncate">
                {user?.role === 'INFLUENCER' ? 'Creator account' : 'Admin account'}
              </div>
            </div>
            <span className="p-1 text-text-faint group-hover:text-text-mute transition">
              <MoreVertical size={14} strokeWidth={1.75} />
            </span>
          </div>
        </button>

        {/* Main nav — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 mt-4 scrollbar-hide">
          <NavGroup>
            {primary.map((it) => (
              <NavItem
                key={it.id} icon={it.icon} label={it.label}
                active={activePage === it.id}
                onClick={() => onNav(it.id)}
                variant="primary"
              />
            ))}
          </NavGroup>

          <NavGroup className="mt-3">
            {discover.map((it) => (
              <NavItem
                key={it.id} icon={it.icon} label={it.label}
                badge={it.id === 'Following' && followCount > 0 ? String(followCount) : undefined}
                active={activePage === it.id}
                onClick={() => onNav(it.id)}
              />
            ))}
          </NavGroup>

          <NavGroup className="mt-3">
            {workspace
              .filter(it => !it.agencyOnly || user?.role === 'AGENCY')
              .map((it) => (
                <NavItem
                  key={it.id} icon={it.icon} label={it.label} badge={it.badge}
                  active={activePage === it.id}
                  onClick={() => onNav(it.id)}
                />
              ))}
          </NavGroup>

          <Separator />

          <NavGroup>
            {operations.map((it) => (
              <NavItem
                key={it.id} icon={it.icon} label={it.label}
                active={activePage === it.id}
                onClick={() => onNav(it.id)}
              />
            ))}
          </NavGroup>

          <Separator />

          <NavGroup>
            {misc.map((it) => (
              <NavItem
                key={it.id} icon={it.icon} label={it.label}
                active={false}
                onClick={() => {}}
              />
            ))}
          </NavGroup>
        </nav>

        {/* Language + logout row */}
        <div className="px-3 mt-3">
          <button
            onClick={() => setLangOpen(v => !v)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-surface-sunk transition"
          >
            <span className="font-sans text-[12px] text-text-mute">Language</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-sunk border border-line text-[11px]">
                🇺🇸
              </span>
              <ChevronDown size={12} className={cn("text-text-faint transition-transform", langOpen && "rotate-180")} />
            </div>
          </button>
        </div>

        {/* "Need help?" gradient card */}
        <div className="mx-3 mt-3 relative rounded-2xl p-4 overflow-hidden bg-help-grad">
          {/* soft highlight */}
          <span className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-white/30 blur-2xl" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-full bg-[#16181d] text-white grid place-items-center mb-2">
              <HelpCircle size={17} strokeWidth={1.75} />
            </div>
            <div className="font-display text-[14px] font-semibold text-[#1a1d23]">
              Need help?
            </div>
            <div className="font-sans text-[11px] text-[#3a3345] mt-0.5 leading-tight">
              Our support is 24/7 online
            </div>
          </div>
        </div>

        {/* Logout mini */}
        <button
          onClick={logout}
          className="mx-3 mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-mute hover:text-down hover:bg-down/10 transition text-[12px] font-medium"
          title="Sign out"
        >
          <LogOut size={13} strokeWidth={1.75} />
          Sign out
        </button>
      </aside>
    </>
  );
};

/* ─── helpers ─── */

const NavGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("flex flex-col gap-0.5", className)}>{children}</div>
);

const Separator: React.FC = () => <div className="my-3 h-px bg-line" />;

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  badge?: string;
  active: boolean;
  onClick: () => void;
  variant?: 'primary' | 'default';
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, badge, active, onClick, variant = 'default' }) => {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full transition-all text-left",
        active
          ? isPrimary
            ? "bg-[#0d0f13] text-white border border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
            : "bg-surface-sunk text-text"
          : "text-text-mute hover:text-text hover:bg-surface-sunk/60"
      )}
    >
      <Icon size={15} strokeWidth={1.75} className={cn(active && isPrimary ? "text-white" : "")} />
      <span className="font-sans text-[12.5px] font-medium flex-1 truncate">{label}</span>
      {badge && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-surface-sunk border border-line text-[10px] font-semibold text-text-soft">
          {badge}
        </span>
      )}
    </button>
  );
};

export default EnterpriseSidebar;
