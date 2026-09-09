import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ThemeProvider } from '@/components/ThemeContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Money from '@/pages/Money';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import Calendar from '@/pages/Calendar';
import Leads from '@/pages/Leads';
import Ideation from '@/pages/Ideation';
import Thumbnails from '@/pages/Thumbnails';
import Analytics from '@/pages/Analytics';
import Views from '@/pages/Views';
import MyWork from '@/pages/MyWork';
import Team from '@/pages/Team';
import Onboarding from '@/pages/Onboarding';
import Settings from '@/pages/Settings';
import Review from '@/pages/Review';
import Portal from '@/pages/Portal';
import { RoleProvider } from "@/lib/RoleContext";
import RoleGate from "@/components/RoleGate";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/review/:token" element={<Review />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/portal" element={<RoleGate page="portal"><Portal /></RoleGate>} />
        <Route element={<Layout />}>
          <Route path="/" element={<RoleGate page="dashboard"><Dashboard /></RoleGate>} />
          <Route path="/money" element={<RoleGate page="money"><Money /></RoleGate>} />
          <Route path="/clients" element={<RoleGate page="clients"><Clients /></RoleGate>} />
          <Route path="/clients/:id" element={<RoleGate page="clientDetail"><ClientDetail /></RoleGate>} />
          <Route path="/calendar" element={<RoleGate page="calendar"><Calendar /></RoleGate>} />
          <Route path="/leads" element={<RoleGate page="leads"><Leads /></RoleGate>} />
          <Route path="/ideation" element={<RoleGate page="ideation"><Ideation /></RoleGate>} />
          <Route path="/thumbnails" element={<RoleGate page="thumbnails"><Thumbnails /></RoleGate>} />
          <Route path="/analytics" element={<RoleGate page="analytics"><Analytics /></RoleGate>} />
          <Route path="/views" element={<RoleGate page="views"><Views /></RoleGate>} />
          <Route path="/my-work" element={<RoleGate page="myWork"><MyWork /></RoleGate>} />
          <Route path="/team" element={<RoleGate page="team"><Team /></RoleGate>} />
          <Route path="/onboarding" element={<RoleGate page="onboarding"><Onboarding /></RoleGate>} />
          <Route path="/settings" element={<RoleGate page="settings"><Settings /></RoleGate>} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <RoleProvider>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </RoleProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App