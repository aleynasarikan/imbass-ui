import React, { useState, useEffect } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams,
} from 'react-router-dom';
import EnterpriseSidebar from './components/enterprise/EnterpriseSidebar';
import ActivityPanel from './components/enterprise/ActivityPanel';
import EnterpriseDashboard from './pages/enterprise/EnterpriseDashboard';
import WeeklyAnalytics from './pages/WeeklyAnalytics';
import AdCollaboration from './pages/AdCollaboration';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import NegotiationConsole from './pages/NegotiationConsole';
import MarketplacePage from './pages/MarketplacePage';
import CampaignShowcasePage from './pages/CampaignShowcasePage';
import PublicCreatorProfile from './pages/PublicCreatorProfile';
import FollowingPage from './pages/FollowingPage';
import RosterPage from './pages/enterprise/RosterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Menu } from 'lucide-react';

/* ─── Route definitions for the authed shell ─── */
const PAGES: Record<string, React.ReactElement> = {
  '/dashboard': <EnterpriseDashboard />,
  '/marketplace': <MarketplacePage />,
  '/showcase': <CampaignShowcasePage />,
  '/following': <FollowingPage />,
  '/analytics': <WeeklyAnalytics />,
  '/campaigns': <AdCollaboration />,
  '/console': <NegotiationConsole />,
  '/roster': <RosterPage />,
  '/profile': <ProfilePage />,
};

/* map sidebar activePage id → URL path */
export const PAGE_TO_PATH: Record<string, string> = {
  Home: '/dashboard',
  Dashboard: '/dashboard',
  Marketplace: '/marketplace',
  Showcase: '/showcase',
  Following: '/following',
  Analytics: '/analytics',
  Collaborations: '/campaigns',
  Console: '/console',
  Roster: '/roster',
  Profile: '/profile',
};

const PATH_TO_PAGE: Record<string, string> = Object.entries(PAGE_TO_PATH).reduce((acc, [page, path]) => {
  acc[path] = page;
  return acc;
}, { '/': 'Home' } as Record<string, string>);

/* ─── Auth guards ─── */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.isOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const RedirectIfAuthed: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && !user.isOnboarding) return <Navigate to="/dashboard" replace />;
  if (user && user.isOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-iris-soft border-t-iris rounded-full animate-spin" />
      <span className="meta-label">Loading your workspace…</span>
    </div>
  </div>
);

/* ─── Authed layout shell ─── */
const AuthedShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activePage = PATH_TO_PAGE[location.pathname] ?? 'Home';

  const setActivePage = (page: string) => {
    const path = PAGE_TO_PATH[page];
    if (path) navigate(path);
  };

  const PageComponent = PAGES[location.pathname];

  return (
    <div className="min-h-screen relative">
      <EnterpriseSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <ActivityPanel />

      <button
        onClick={() => setIsSidebarOpen(v => !v)}
        className="lg:hidden fixed top-5 left-5 z-30 w-10 h-10 grid place-items-center rounded-xl bg-surface border border-line text-text shadow-card"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <main className="min-h-screen p-4 lg:pl-[248px] xl:pr-[320px]">
        {PageComponent ?? <EnterpriseDashboard />}
      </main>
    </div>
  );
};

/* ─── Login/Register switchers ─── */
const LoginRoute: React.FC = () => {
  const navigate = useNavigate();
  return <LoginPage onSwitchToRegister={() => navigate('/register')} />;
};

const RegisterRoute: React.FC = () => {
  const navigate = useNavigate();
  return <RegisterPage onSwitchToLogin={() => navigate('/login')} />;
};

/* ─── Public creator profile wrapper ─── */
const PublicCreatorRoute: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  useEffect(() => {
    if (slug) document.title = `@${slug} · Imbass`;
    return () => { document.title = 'Imbass Studio'; };
  }, [slug]);
  return <PublicCreatorProfile slug={slug || ''} />;
};

/* ─── Top-level routes ─── */
const AppContent: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route
      path="/login"
      element={<RedirectIfAuthed><LoginRoute /></RedirectIfAuthed>}
    />
    <Route
      path="/register"
      element={<RedirectIfAuthed><RegisterRoute /></RedirectIfAuthed>}
    />
    <Route path="/u/:slug" element={<PublicCreatorRoute />} />

    {/* Onboarding (authed but distinct shell) */}
    <Route
      path="/onboarding"
      element={
        <OnboardingGate>
          <OnboardingPage />
        </OnboardingGate>
      }
    />

    {/* Authed shell */}
    <Route
      path="/"
      element={<RequireAuth><AuthedShell /></RequireAuth>}
    />
    {Object.keys(PAGES).map(path => (
      <Route
        key={path}
        path={path}
        element={<RequireAuth><AuthedShell /></RequireAuth>}
      />
    ))}

    {/* 404 → dashboard for authed, login for anon */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isOnboarding) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
