import React from 'react';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
    activePage: string;
    setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar, activePage, setActivePage }) => {
    const navItems = [
        { name: 'Home', icon: '🏠' },
        { name: 'Dashboard', icon: '⊞' },
        { name: 'Analytics', icon: '📈' },
        { name: 'Collaborations', icon: '🤝' },
        { name: 'Messages', icon: '💬' },
        { name: 'Settings', icon: '⚙️' }
    ];

    const handleNavClick = (itemName: string) => {
        setActivePage(itemName);
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
            <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
                <div className="sidebar-content">
                    <ul className="nav-list">
                        {navItems.map((item, index) => (
                            <li
                                key={index}
                                className={`nav-item ${activePage === item.name ? 'active' : ''}`}
                                onClick={() => handleNavClick(item.name)}
                            >
                                <div className="nav-link" style={{ cursor: 'pointer' }}>
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-text">{item.name}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="sidebar-footer">
                    <div className="system-status">
                        <div className="status-dot"></div>
                        <span>System Online</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
