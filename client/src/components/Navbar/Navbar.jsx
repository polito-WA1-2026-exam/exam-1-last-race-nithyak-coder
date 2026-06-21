import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown when clicking outside — uses useRef (React pattern), not direct DOM mutation
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const initials = user ? user.username.slice(0, 2).toUpperCase() : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="navbar-dots-wrap">
          <span className="ndot ndot-red" />
          <span className="ndot ndot-blue" />
          <span className="ndot ndot-green" />
          <span className="ndot ndot-yellow" />
        </div>
        Last Race
      </Link>

      <div className="navbar-links">
        {/* Instructions — visible to everyone (spec: anonymous can view instructions) */}
        <Link to="/" className={`navbar-link ${isActive('/') ? 'navbar-link-active' : ''}`}>
          Instructions
        </Link>

        {/* Play and Ranking — registered users only (spec requirement) */}
        {user && (
          <>
            <Link to="/game"    className={`navbar-link ${isActive('/game')    ? 'navbar-link-active' : ''}`}>Play</Link>
            <Link to="/ranking" className={`navbar-link ${isActive('/ranking') ? 'navbar-link-active' : ''}`}>Ranking</Link>
          </>
        )}
      </div>

      <div className="navbar-auth">
        {user ? (
          <div className="navbar-profile" ref={dropRef}>
            <button
              className="navbar-avatar-btn"
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-label="Account menu"
            >
              <div className="navbar-avatar">{initials}</div>
              <span className="navbar-username-text">{user.username}</span>
              <span className={`navbar-caret ${open ? 'open' : ''}`}>▾</span>
            </button>

            {open && (
              <div className="navbar-dropdown">
                <div className="dropdown-user-header">
                  <div className="dropdown-avatar">{initials}</div>
                  <div>
                    <p className="dropdown-username">{user.username}</p>
                    <p className="dropdown-role">Registered player</p>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <Link to="/game"    className="dropdown-item" onClick={() => setOpen(false)}>▶ Play game</Link>
                <Link to="/ranking" className="dropdown-item" onClick={() => setOpen(false)}>🏆 Ranking</Link>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="btn navbar-login-btn">Sign in</Link>
        )}
      </div>
    </nav>
  );
}
