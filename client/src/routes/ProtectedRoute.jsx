import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading, sessionError, refreshUser } = useAuth();
  if (loading) return <div className="screen-state">Checking your session…</div>;
  if (sessionError) {
    return <div className="screen-state screen-state--error" role="alert">
      <span>{sessionError}</span>
      <button type="button" onClick={refreshUser}>Try again</button>
    </div>;
  }
  return user ? children : <Navigate to="/login" replace />;
}
