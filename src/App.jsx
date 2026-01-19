import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import AccountForm from './components/AccountForm';
import Transactions from './components/Transactions';
import TransactionForm from './components/TransactionForm';
import Categories from './components/Categories';
import CategoryForm from './components/CategoryForm';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import ApiService from './services/api'; // Import ApiService
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Check authentication on app load
    const checkAuth = async () => {
      const token = localStorage.getItem('token'); // Changed: 'authToken' -> 'token'
      const user = localStorage.getItem('currentUser');
      
      console.log('Auth check - Token:', token);
      console.log('Auth check - User:', user);
      
      if (token && user) {
        try {
          // Verify token is still valid
          const profileData = await ApiService.getProfile();
          console.log('Token verified, profile:', profileData);
          
          // Update user with fresh data
          const updatedUser = {
            ...JSON.parse(user),
            ...profileData.user,
            ...profileData
          };
          
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          setIsAuthenticated(true);
        } catch (err) {
          console.log('Token invalid or expired:', err);
          // Clear invalid data
          ApiService.logout();
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    ApiService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

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
              <Register onRegister={handleLogin} />
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
            <Route path="/transactions/edit/:id" element={
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
            <Route path="/categories/edit/:id" element={
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