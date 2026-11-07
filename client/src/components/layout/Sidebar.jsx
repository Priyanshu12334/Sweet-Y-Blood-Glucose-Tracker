import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../common/Button.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/readings', label: 'Readings', icon: '◷' },
  { to: '/reports', label: 'Reports', icon: '▤' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try { await logout(); } finally { navigate('/login', { replace: true }); }
  }

  return (
    <aside className="sidebar">
      <p className="sidebar-label">MENU</p>
      <nav className="side-nav" aria-label="Main navigation">
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            <span className="nav-icon" aria-hidden="true">{icon}</span>{label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <p>Keep your health in focus, one reading at a time.</p>
        <Button variant="quiet" className="logout-button" onClick={handleLogout}>↪ <span>Logout</span></Button>
      </div>
    </aside>
  );
}
