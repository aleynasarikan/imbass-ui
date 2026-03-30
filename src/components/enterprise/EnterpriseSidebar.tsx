import React, { useState } from 'react';
import {
  LayoutDashboard, BarChart3, Users, MessageSquare, Settings, FileText, Mail,
  Globe, HelpCircle, ChevronLeft, X
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface EnterpriseSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({ activePage, setActivePage, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const mainMenuItems = [
    { id: 'Home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Dashboard', label: 'Influencers', icon: Users },
    { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'Collaborations', label: 'Campaigns', icon: MessageSquare },
    { id: 'Profile', label: 'Profile', icon: Settings },
  ];

  const bottomMenuItems = [
    { label: 'Blog', icon: FileText, action: () => {} },
    { label: 'Contact Us', icon: Mail, action: () => {} },
  ];

  const handleNavClick = (id: string) => {
    setActivePage(id);
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out",
          "bg-dark-sidebar border-r border-white/[0.06]",
          collapsed ? "w-[72px]" : "w-[260px]",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-white tracking-tight">IMBASS</span>
              <span className="text-[10px] font-bold bg-accent-peach text-dark-500 px-1.5 py-0.5 rounded">PRO</span>
            </div>
          )}
          <button
            onClick={() => {
              if (window.innerWidth <= 1024) {
                onClose();
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors lg:block"
          >
            {window.innerWidth <= 1024 ? <X size={18} /> : <ChevronLeft size={18} className={cn(collapsed && "rotate-180 transition-transform")} />}
          </button>
        </div>

        {/* User */}
        <div className={cn("px-4 py-4 border-b border-white/[0.06]", collapsed && "px-2 flex justify-center")}>
          <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
            <Avatar className="h-9 w-9 ring-2 ring-accent-peach/30">
              <AvatarFallback className="bg-accent-peach/20 text-accent-peach text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-[11px] text-muted truncate">
                  {user?.role || 'Member'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <div className="space-y-0.5">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent-peach/10 text-accent-peach"
                      : "text-muted-light hover:text-white hover:bg-white/[0.04]",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={19} className={cn(isActive && "text-accent-peach")} />
                  {!collapsed && <span>{item.label}</span>}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-peach" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-2 pb-2 border-t border-white/[0.06] pt-2">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:text-muted-lighter hover:bg-white/[0.03] transition-colors",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={17} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}

          {/* Language toggle */}
          <div className={cn("flex items-center gap-3 px-3 py-2 mt-1", collapsed && "justify-center px-2")}>
            <Globe size={17} className="text-muted" />
            {!collapsed && <span className="text-sm text-muted">Language</span>}
          </div>
        </div>

        {/* Need help? */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-accent-peach/20 to-accent-salmon/10 border border-accent-peach/20">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle size={16} className="text-accent-peach" />
              <span className="text-sm font-semibold text-white">Need help?</span>
            </div>
            <p className="text-[11px] text-muted-light">Our support is 24/7 online</p>
          </div>
        )}

        {/* Logout */}
        <div className="px-2 pb-3">
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger/70 hover:text-danger hover:bg-danger/5 transition-colors",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default EnterpriseSidebar;
