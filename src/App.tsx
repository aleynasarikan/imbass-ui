import React, { useState } from 'react';
import EnterpriseNavbar from './components/enterprise/EnterpriseNavbar';
import EnterpriseSidebar from './components/enterprise/EnterpriseSidebar';
import EnterpriseDashboard from './pages/enterprise/EnterpriseDashboard';
import WeeklyAnalytics from './pages/WeeklyAnalytics';
import AdCollaboration from './pages/AdCollaboration';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import NegotiationConsole from './pages/NegotiationConsole';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cn } from './lib/utils';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<string>('Home');
  const [showRegister, setShowRegister] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-peach border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  // Auth Gate
  if (!user) {
    if (showRegister) {
      return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
  }

  // Onboarding Gate
  if (user.isOnboarding) {
    return <OnboardingPage />;
  }

  const pageTitles: Record<string, string> = {
    Home: 'Dashboard',
    Dashboard: 'Influencers',
    Analytics: 'Analytics',
    Collaborations: 'Campaigns',
    Profile: 'Profile',
  };

  return (
    <div className="min-h-screen bg-dark">
      <EnterpriseSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <EnterpriseNavbar
        pageTitle={pageTitles[activePage] || 'Dashboard'}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main
        className={cn(
          "transition-all duration-300 pt-24 pb-6 min-h-screen",
          "lg:ml-[260px]",
          "px-4 md:px-6 lg:px-8"
        )}
      >
        {(activePage === 'Home') && <EnterpriseDashboard />}
        {activePage === 'Dashboard' && <EnterpriseDashboard />}
        {activePage === 'Analytics' && <WeeklyAnalytics />}
        {activePage === 'Collaborations' && <AdCollaboration />}
        {activePage === 'Console' && <NegotiationConsole />}
        {activePage === 'Profile' && <ProfilePage />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
