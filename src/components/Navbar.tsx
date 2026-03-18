import React from 'react';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  toggleSidebar: () => void;
  onProfileClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, onProfileClick }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="navbar-logo">
          <span className="text-gradient">Imbass</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="search-bar">
          <input type="text" placeholder="Search..." />
        </div>
        <div className="profile-btn" onClick={onProfileClick} style={{ marginRight: '15px' }} title="View Profile">
          <div className="profile-avatar">{user?.email?.charAt(0).toUpperCase() || 'A'}</div>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--color-silver-dark)', color: 'var(--color-silver)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
