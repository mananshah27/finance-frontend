// src/components/Profile.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import './Profile.css';

function Profile({ currentUser, setCurrentUser }) {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    mobileNo: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const navigate = useNavigate();

  // Fix: Load profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const profileData = await ApiService.getProfile();
        console.log('Profile data received:', profileData);
        
        // Update current user with fresh data
        const updatedUser = {
          ...currentUser,
          ...profileData.user,
          ...profileData
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Set form data
        setFormData({
          name: updatedUser.name || updatedUser.Name || '',
          lastName: updatedUser.lastName || updatedUser.LastName || '',
          email: updatedUser.email || updatedUser.Email || '',
          mobileNo: updatedUser.mobileNo || updatedUser.Mobile_No || '',
          password: '',
          confirmPassword: ''
        });
        
      } catch (err) {
        console.error('Failed to load profile:', err);
        // If API fails, use localStorage data
        if (currentUser) {
          setFormData({
            name: currentUser.name || currentUser.Name || '',
            lastName: currentUser.lastName || currentUser.LastName || '',
            email: currentUser.email || currentUser.Email || '',
            mobileNo: currentUser.mobileNo || currentUser.Mobile_No || '',
            password: '',
            confirmPassword: ''
          });
        }
      } finally {
        setProfileLoading(false);
      }
    };

    if (currentUser) {
      loadProfile();
    }
  }, [currentUser, setCurrentUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updates = {
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        mobileNo: formData.mobileNo
      };

      // Add password only if provided
      if (formData.password) {
        updates.password = formData.password;
      }

      console.log('Updating profile with:', updates);
      const data = await ApiService.updateProfile(updates);
      console.log('Profile update response:', data);
      
      // Update current user
      const updatedUser = { 
        ...currentUser, 
        ...updates,
        ...(data.user || data)
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      // Update form data (clear passwords)
      setFormData(prev => ({ 
        ...prev, 
        password: '', 
        confirmPassword: '',
        name: updatedUser.name || updatedUser.Name || '',
        lastName: updatedUser.lastName || updatedUser.LastName || '',
        email: updatedUser.email || updatedUser.Email || '',
        mobileNo: updatedUser.mobileNo || updatedUser.Mobile_No || ''
      }));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await ApiService.deleteProfile();
        localStorage.clear();
        navigate('/');
        window.location.reload();
      } catch (err) {
        setError('Failed to delete account: ' + err.message);
      }
    }
  };

  if (profileLoading) {
    return (
      <div className="profile-page">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="profile-actions">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                // Reset form to current user data
                if (currentUser) {
                  setFormData({
                    name: currentUser.name || currentUser.Name || '',
                    lastName: currentUser.lastName || currentUser.LastName || '',
                    email: currentUser.email || currentUser.Email || '',
                    mobileNo: currentUser.mobileNo || currentUser.Mobile_No || '',
                    password: '',
                    confirmPassword: ''
                  });
                }
                setError('');
                setSuccess('');
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="profile-card">
            <h2>Personal Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                name="mobileNo"
                className="form-input"
                value={formData.mobileNo}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <div className="profile-card">
              <h2>Change Password (Optional)</h2>
              
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          )}

          {isEditing && (
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          )}
        </form>

        <div className="profile-card danger-zone">
          <h2>Danger Zone</h2>
          <p>Once you delete your account, there is no going back. Please be certain.</p>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
          >
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;