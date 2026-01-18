// src/components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation({ onLogout }) {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" className="brand-link">💰 Finance Tracker</Link>
      </div>
      
      <div className="navbar-menu">
        <Link 
          to="/dashboard" 
          className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        <Link 
          to="/accounts" 
          className={`nav-link ${location.pathname === '/accounts' ? 'active' : ''}`}
        >
          Accounts
        </Link>
        <Link 
          to="/transactions" 
          className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}
        >
          Transactions
        </Link>
        <Link 
          to="/categories" 
          className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}
        >
          Categories
        </Link>
        <Link 
          to="/profile" 
          className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
        >
          Profile
        </Link>
      </div>
      
      <div className="navbar-actions">
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navigation;