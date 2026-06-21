import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar           from './components/Navbar/Navbar.jsx';
import InstructionsPage from './pages/Instructions/InstructionsPage.jsx';
import LoginPage        from './pages/Login/LoginPage.jsx';
import GamePage         from './pages/Game/GamePage.jsx';
import RankingPage      from './pages/Ranking/RankingPage.jsx';

// Redirect logged-in users away from /login
function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/game" replace />;
  return children;
}

// Redirect guests away from protected pages — spec says anonymous users
// can ONLY view instructions, nothing else
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public — instructions only for anonymous users (spec requirement) */}
        <Route path="/"        element={<InstructionsPage />} />

        {/* Public only — redirect to /game if already logged in */}
        <Route path="/login"   element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />

        {/* Protected — registered users only (spec: anonymous can ONLY see instructions) */}
        <Route path="/game"    element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />

        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
