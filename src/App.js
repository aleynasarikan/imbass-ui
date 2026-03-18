import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import EnterpriseNavbar from './components/enterprise/EnterpriseNavbar';
import EnterpriseSidebar from './components/enterprise/EnterpriseSidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EnterpriseDashboard from './pages/enterprise/EnterpriseDashboard';
import AdCollaboration from './pages/AdCollaboration';
import WeeklyAnalytics from './pages/WeeklyAnalytics';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/enterprise.css'; // Global inclusion of enterprise tokens

const AppContent = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('Home');
  const [useEnterpriseLayout, setUseEnterpriseLayout] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (useEnterpriseLayout) {
      document.body.classList.add('enterprise-mode');
    } else {
      document.body.classList.remove('enterprise-mode');
    }
  }, [useEnterpriseLayout]);

  if (loading) return null;

  // ── Auth Gate: No user → Login or Register ──
  if (!user) {
    if (showRegister) {
      return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
  }

  // ── Onboarding Gate: Force onboarding if not complete ──
  if (user.isOnboarding) {
    return <OnboardingPage />;
  }

  // ── Main App ──
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const navigateToProfile = () => setActivePage('Profile');

  if (useEnterpriseLayout) {
    return (
      <div className="enterprise-layout-root">
        <EnterpriseSidebar activePage={activePage} setActivePage={setActivePage} />
        <EnterpriseNavbar />
        <main className="enterprise-content">
          {activePage === 'Home' && <EnterpriseDashboard />}
          {activePage === 'Dashboard' && <EnterpriseDashboard />}
          {activePage === 'Analytics' && <WeeklyAnalytics />}
          {activePage === 'Collaborations' && <AdCollaboration />}
          {activePage === 'Profile' && <ProfilePage />}

          <div className="layout-switcher">
            <button onClick={() => setUseEnterpriseLayout(false)}>Switch to Classic UI</button>
          </div>
        </main>

        <style jsx>{`
          .enterprise-layout-root {
            display: flex;
            min-height: 100vh;
          }
          .enterprise-content {
            flex: 1;
            margin-left: var(--enterprise-sidebar-width);
            margin-top: var(--enterprise-navbar-height);
            padding: 40px;
            background-color: var(--enterprise-bg);
            min-height: calc(100vh - var(--enterprise-navbar-height));
          }
          .layout-switcher {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
          }
          .layout-switcher button {
            padding: 8px 12px;
            background: #000;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            opacity: 0.5;
          }
          .layout-switcher button:hover {
            opacity: 1;
          }
        `}</style>
      </div>
    );
  }

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

          <div className="layout-switcher">
            <button onClick={() => setUseEnterpriseLayout(true)}>Switch to Enterprise UI</button>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
