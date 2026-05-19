import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Camera, Salad, LineChart, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/',         label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
    { path: '/session',  label: 'Session',       icon: <Camera size={18} /> },
    { path: '/diet',     label: 'Diet Plan',     icon: <Salad size={18} /> },
    { path: '/progress', label: 'Progress',      icon: <LineChart size={18} /> },
  ];

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Aasan AI" style={{ width: '30px', height: '30px', borderRadius: '7px', objectFit: 'cover' }} />
          Aasan AI
        </Link>

        {/* Nav Links */}
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button onClick={handleLogout} className="nav-link nav-link-logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
