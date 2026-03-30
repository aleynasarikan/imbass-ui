import React from 'react';
import { Bell, Mail, Menu, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnterpriseNavbarProps {
  pageTitle: string;
  onMenuToggle: () => void;
  sidebarCollapsed?: boolean;
}

const EnterpriseNavbar: React.FC<EnterpriseNavbarProps> = ({ pageTitle, onMenuToggle, sidebarCollapsed }) => {
  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-4 md:px-6",
        "bg-dark-nav/80 backdrop-blur-xl border-b border-white/[0.06]",
        "transition-all duration-300",
        sidebarCollapsed ? "lg:left-[72px]" : "lg:left-[260px]",
        "left-0"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-lg md:text-xl font-bold text-white">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search - hidden on mobile */}
        <div className="hidden md:flex items-center relative">
          <Search size={16} className="absolute left-3 text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 h-9 pl-9 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-peach/30 focus:border-accent-peach/30 transition-all"
          />
        </div>

        {/* Icon buttons */}
        <button className="relative p-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent-salmon rounded-full ring-2 ring-dark-nav" />
        </button>

        <button className="relative p-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-colors">
          <Mail size={18} />
        </button>
      </div>
    </header>
  );
};

export default EnterpriseNavbar;
