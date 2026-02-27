import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdCollaboration from './pages/AdCollaboration';
import WeeklyAnalytics from './pages/WeeklyAnalytics';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('Home');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const navigateToProfile = () => setActivePage('Profile');

  return (
    <div className="app-container">
      <Navbar toggleSidebar={toggleSidebar} onProfileClick={navigateToProfile} />
      <div className="main-layout">
        <Sidebar
          isOpen={isSidebarOpen}
          closeSidebar={closeSidebar}
          activePage={activePage}
          setActivePage={setActivePage}
        />
        <main className="content-area">
          {activePage === 'Home' && <Home />}
          {activePage === 'Dashboard' && <Dashboard />}
          {activePage === 'Analytics' && <WeeklyAnalytics />}
          {activePage === 'Collaborations' && <AdCollaboration />}
          {activePage === 'Profile' && <ProfilePage />}
          {/* Add other pages here as they are developed */}
        </main>
      </div>
    </div>
  );
}

export default App;
