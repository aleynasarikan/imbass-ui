import React, { useState } from 'react';
import { User, Bell, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Update {
  ago: string;
  title: string;
  category: 'Product updates' | 'Marketing' | 'Guides' | 'Guest Writer';
  highlighted?: boolean;
}

const updates: Update[] = [
  { ago: '18 min ago', title: 'Share & Earn: Imbass Referral Program is Live!',         category: 'Product updates' },
  { ago: '2 days ago', title: 'New Integration Available: Imbass × Cartloop',            category: 'Product updates' },
  { ago: '4 days ago', title: 'Grow with the Imbass Partner Program',                    category: 'Product updates' },
  { ago: '1 week ago', title: 'The Holiday Customer Retention Guide',                    category: 'Marketing' },
  { ago: '2 weeks ago',title: 'Top 5 Cart Abandonment Solutions for Shopify',            category: 'Marketing', highlighted: true },
  { ago: '3 weeks ago',title: 'Top 7 SMS Marketing Apps for Shopify in 2026',            category: 'Marketing' },
  { ago: '3 weeks ago',title: 'SMS Marketing Guide for Fashion Brands',                  category: 'Guides' },
  { ago: '4 weeks ago',title: 'How to Serve Up a Solid Branded Customer…',               category: 'Guest Writer' },
];

const ActivityPanel: React.FC = () => {
  const [tab, setTab] = useState<'avatar' | 'bell' | 'mail'>('avatar');

  return (
    <aside className="fixed right-4 top-4 bottom-4 z-20 w-[296px] hidden xl:flex flex-col">
      {/* Top icon row */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <IconChip active={tab === 'avatar'} onClick={() => setTab('avatar')} icon={User}  accent="iris" />
        <IconChip active={tab === 'bell'}   onClick={() => setTab('bell')}   icon={Bell}  />
        <IconChip active={tab === 'mail'}   onClick={() => setTab('mail')}   icon={Mail}  />
      </div>

      {/* Updates list */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide animate-fade-in">
        <ul className="flex flex-col">
          {updates.map((u, i) => (
            <li
              key={i}
              className={cn(
                "relative rounded-2xl px-3.5 py-3 transition-colors cursor-pointer group",
                u.highlighted
                  ? "border border-white/15 bg-white/[0.03]"
                  : "border border-transparent hover:bg-white/[0.02]"
              )}
              style={{ animationDelay: `${40 * i}ms` }}
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
    </aside>
  );
};

interface IconChipProps {
  active?: boolean;
  icon: React.ElementType;
  onClick: () => void;
  accent?: 'iris';
}

const IconChip: React.FC<IconChipProps> = ({ active, icon: Icon, onClick, accent }) => {
  const isIris = accent === 'iris';
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-[12px] grid place-items-center transition-all border",
        active
          ? isIris
            ? "bg-iris-soft border-iris/30 text-iris"
            : "bg-surface-sunk border-line-strong text-text"
          : "bg-transparent border-line text-text-mute hover:text-text hover:bg-surface-sunk"
      )}
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  );
};

export default ActivityPanel;
