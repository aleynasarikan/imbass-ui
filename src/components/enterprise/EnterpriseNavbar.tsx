import React from 'react';
import { Menu, Search, Plus, PanelLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface EnterpriseNavbarProps {
  pageTitle: string;
  onMenuToggle: () => void;
}

const EnterpriseNavbar: React.FC<EnterpriseNavbarProps> = ({ pageTitle, onMenuToggle }) => {
  return (
    <header
      className={cn(
        "fixed top-4 right-4 z-30 h-[56px]",
        "bg-white/85 backdrop-blur-xl border border-line rounded-[22px] shadow-soft",
        "left-4 lg:left-[88px]",
        "flex items-center"
      )}
    >
      <div className="flex items-center justify-between w-full px-3 lg:px-4 gap-3">
        {/* Left — menu toggle + search */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-9 h-9 grid place-items-center text-text-mute hover:text-text rounded-xl hover:bg-surface-sunk transition"
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
          <button
            className="hidden lg:grid w-9 h-9 place-items-center text-text-faint hover:text-text rounded-xl hover:bg-surface-sunk transition"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeft size={16} strokeWidth={1.75} />
          </button>

          {/* Search pill */}
          <div className="flex items-center gap-2 bg-surface-sunk border border-transparent focus-within:border-iris/30 focus-within:bg-white rounded-full px-3.5 h-9 transition-all w-full max-w-[460px]">
            <Search size={14} className="text-text-faint flex-shrink-0" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search"
              className="flex-1 bg-transparent text-[13px] text-text placeholder:text-text-faint focus:outline-none font-sans"
              aria-label={`Search within ${pageTitle}`}
            />
            <kbd className="hidden xl:inline-flex items-center px-1.5 h-5 rounded border border-line bg-white text-[10px] text-text-faint font-mono">⌘K</kbd>
          </div>
        </div>

        {/* Right — create campaign */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="hidden sm:inline-flex h-9 px-4">
            <Plus size={14} strokeWidth={2.5} /> Create campaign
          </Button>
        </div>
      </div>
    </header>
  );
};

export default EnterpriseNavbar;
