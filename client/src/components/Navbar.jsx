import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CheckSquare, LayoutDashboard, KanbanSquare, LogOut, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="navbar">
      <div className="navbar-content">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <CheckSquare size={20} strokeWidth={2.5} />
          </div>
          <span>TaskFlow</span>
        </NavLink>

        {/* Center Links */}
        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/tasks"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <KanbanSquare size={18} />
            <span>Tasks Board</span>
          </NavLink>
        </nav>

        {/* Right User & Theme Controls */}
        <div className="nav-user-area">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-theme-toggle"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <Sun size={18} className="theme-icon sun" />
            ) : (
              <Moon size={18} className="theme-icon moon" />
            )}
          </button>

          <div className="user-profile-badge">
            <div className="user-avatar-circle">
              {getInitials(user?.name)}
            </div>
            <span>{user?.name || 'User'}</span>
          </div>

          <button onClick={handleLogout} className="btn-logout" title="Log out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
