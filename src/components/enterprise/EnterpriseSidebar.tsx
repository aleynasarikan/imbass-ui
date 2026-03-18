import React from 'react';
import '../../styles/enterprise.css';

interface EnterpriseSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}


const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: 'Home', label: 'Overview', icon: 'H' },
    { id: 'Dashboard', label: 'Creator Roster', icon: 'R' },
    { id: 'Analytics', label: 'Financial Analytics', icon: 'F' },
    { id: 'Collaborations', label: 'Negotiations', icon: 'N' },
    { id: 'Profile', label: 'Entity Profile', icon: 'P' },
  ];

  return (
    <aside className="enterprise-sidebar">
      <div className="enterprise-sidebar-logo">
        IMBASS <span className="logo-tag">B2B</span>
      </div>
      <nav className="enterprise-nav">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`enterprise-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="enterprise-nav-icon">{item.icon}</span>
            <span className="enterprise-nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="enterprise-sidebar-footer">
        <div className="user-context">
          <div className="user-avatar-small">A</div>
          <div className="user-details">
            <div className="user-name">Agency Admin</div>
            <div className="user-role">PRODUCER</div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .enterprise-sidebar {
          width: var(--enterprise-sidebar-width);
          height: 100vh;
          background-color: var(--enterprise-sidebar-bg);
          color: var(--enterprise-sidebar-text);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .enterprise-sidebar-logo {
          padding: 24px;
          font-weight: 800;
          font-size: 20px;
          color: white;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-tag {
          font-size: 10px;
          background: var(--enterprise-accent);
          padding: 2px 6px;
          border-radius: 2px;
          vertical-align: middle;
        }

        .enterprise-nav {
          flex: 1;
          padding: 12px 0;
        }

        .enterprise-nav-item {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }

        .enterprise-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--enterprise-sidebar-active);
        }

        .enterprise-nav-item.active {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--enterprise-sidebar-active);
          border-left-color: var(--enterprise-accent);
        }

        .enterprise-nav-icon {
          width: 24px;
          font-weight: bold;
          opacity: 0.7;
        }

        .enterprise-nav-label {
          font-size: 14px;
          font-weight: 500;
        }

        .enterprise-sidebar-footer {
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-context {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar-small {
          width: 32px;
          height: 32px;
          background: #334155;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: white;
        }

        .user-role {
          font-size: 11px;
          opacity: 0.7;
        }
      `}</style>
    </aside>
  );
};

export default EnterpriseSidebar;
