import { useAuth } from '../../context/AuthContext.jsx';

export default function Header() {
  const { user } = useAuth();
  return (
    <header className="topbar">
      <a className="brand" href="/dashboard" aria-label="Sweet-y dashboard">sweet<span>y</span></a>
      <div className="topbar-user">
        <span className="user-avatar" aria-hidden="true">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
        <span>{user?.name || 'Your account'}</span>
      </div>
    </header>
  );
}
