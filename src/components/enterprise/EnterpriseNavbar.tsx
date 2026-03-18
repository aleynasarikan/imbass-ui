import React from 'react';
import '../../styles/enterprise.css';

const EnterpriseNavbar: React.FC = () => {
    return (
        <header className="enterprise-navbar">
            <div className="navbar-content">
                <div className="navbar-search">
                    <input type="text" placeholder="Search campaigns, creators, or transactions..." />
                </div>
                <div className="navbar-actions">
                    <div className="notification-trigger">
                        <span className="dot"></span>
                        🔔
                    </div>
                    <div className="global-status">
                        <span className="status-label">Network Status:</span>
                        <span className="status-value positive">Operational</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .enterprise-navbar {
          height: var(--enterprise-navbar-height);
          background-color: var(--enterprise-surface);
          border-bottom: 1px solid var(--enterprise-border);
          position: fixed;
          top: 0;
          right: 0;
          left: var(--enterprise-sidebar-width);
          z-index: 90;
          padding: 0 24px;
          display: flex;
          align-items: center;
        }

        .navbar-content {
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
        }

        .navbar-search input {
          width: 320px;
          background-color: #F8FAFC;
          border: 1px solid var(--enterprise-border);
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }

        .navbar-search input:focus {
          border-color: var(--enterprise-accent);
          background-color: white;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .notification-trigger {
          font-size: 18px;
          cursor: pointer;
          position: relative;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: var(--enterprise-danger);
          border-radius: 50%;
          position: absolute;
          top: 0;
          right: 0;
        }

        .global-status {
          font-size: 12px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .status-label {
          color: var(--enterprise-text-secondary);
        }

        .status-value.positive {
          color: var(--enterprise-success);
          font-weight: 600;
        }
      `}</style>
        </header>
    );
};

export default EnterpriseNavbar;
