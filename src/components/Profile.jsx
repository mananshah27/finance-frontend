// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import './Profile.css';

function Profile({ currentUser, setCurrentUser }) {
  const [formData, setFormData] = useState({
    Name: '',
    LastName: '',
    Email: '',
    Mobile_No: '',
    Password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setFormData({
        Name: currentUser.Name || '',
        LastName: currentUser.LastName || '',
        Email: currentUser.Email || '',
        Mobile_No: currentUser.Mobile_No || '',
        Password: '',
        confirmPassword: ''
      });
    }
  }, [currentUser]);

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
  if (formData.Password && formData.Password !== formData.confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }

  try {
    const updates = {
      name: formData.Name,  // CHANGED: Name → name (lowercase)
      lastName: formData.LastName,  // CHANGED: LastName → lastName
      email: formData.Email,  // CHANGED: Email → email
      mobileNo: formData.Mobile_No  // CHANGED: Mobile_No → mobileNo
    };

    // Add password only if provided
    if (formData.Password) {
      updates.password = formData.Password;  // lowercase
    }

    // REMOVE: currentUser.id parameter
    // eslint-disable-next-line no-unused-vars
    const data = await ApiService.updateProfile(updates);
    
    // Update current user in localStorage and state
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    
    setSuccess('Profile updated successfully!');
    setIsEditing(false);
    setFormData(prev => ({ ...prev, Password: '', confirmPassword: '' }));
  } catch (err) {
    setError(err.message || 'Failed to update profile');
  } finally {
    setLoading(false);
  }
};

 const handleDelete = async () => {
  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    try {
      // REMOVE: currentUser.id parameter
      await ApiService.deleteProfile();
      localStorage.clear();
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError('Failed to delete account: ' + err.message);
    }
  }
};

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
                // Reset form
                if (currentUser) {
                  setFormData({
                    Name: currentUser.Name || '',
                    LastName: currentUser.LastName || '',
                    Email: currentUser.Email || '',
                    Mobile_No: currentUser.Mobile_No || '',
                    Password: '',
                    confirmPassword: ''
                  });
                }
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
                  name="Name"
                  className="form-input"
                  value={formData.Name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="LastName"
                  className="form-input"
                  value={formData.LastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="Email"
                className="form-input"
                value={formData.Email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                name="Mobile_No"
                className="form-input"
                value={formData.Mobile_No}
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
                  name="Password"
                  className="form-input"
                  value={formData.Password}
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