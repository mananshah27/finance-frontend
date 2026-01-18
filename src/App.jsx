import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import AccountForm from './components/AccountForm';
import Transactions from './components/Transactions'; // Fixed
import TransactionForm from './components/TransactionForm';
import Categories from './components/Categories';
import CategoryForm from './components/CategoryForm';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    
    if (user && token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  };

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && <Navigation onLogout={handleLogout} />}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" /> : 
              <Login onLogin={handleLogin} />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/dashboard" /> : 
              <Register />
            } />
            <Route path="/dashboard" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Dashboard currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/accounts" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Accounts currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/accounts/new" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <AccountForm currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/accounts/edit/:id" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <AccountForm currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/transactions" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Transactions currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/transactions/new" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <TransactionForm currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/categories" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Categories currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/categories/new" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <CategoryForm currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Profile currentUser={currentUser} setCurrentUser={setCurrentUser} />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Private Route Component
function PrivateRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default App;