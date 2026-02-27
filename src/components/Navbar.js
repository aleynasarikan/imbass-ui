import React, { useState } from 'react';
import './Navbar.css';

const Navbar = ({ toggleSidebar, onProfileClick }) => {
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
        <div className="profile-btn" onClick={onProfileClick}>
          <div className="profile-avatar">A</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
