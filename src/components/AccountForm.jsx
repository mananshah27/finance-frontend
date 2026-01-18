// src/components/AccountForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApiService from '../services/api';
import './AccountForm.css';

function AccountForm({ currentUser }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'savings',
    initialbalance: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
      setIsEdit(true);
    }
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      const data = await ApiService.getAccountById(currentUser.id, id);
      setFormData({
        name: data.accountRecord.name,
        type: data.accountRecord.type,
        initialbalance: data.accountRecord.balance.toString()
      });
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Failed to fetch account details');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const accountData = {
        name: formData.name,
        type: formData.type,
        initialbalance: parseFloat(formData.initialbalance) || 0
      };

      if (isEdit) {
        await ApiService.updateAccount(currentUser.id, id, accountData);
      } else {
        await ApiService.createAccount(currentUser.id, accountData);
      }
      
      navigate('/accounts');
    } catch (err) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>{isEdit ? 'Edit Account' : 'Create New Account'}</h1>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Account Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Savings Account, Wallet, etc."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type" className="form-label">Account Type</label>
            <select
              id="type"
              name="type"
              className="form-select"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="credit">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="investment">Investment</option>
              <option value="loan">Loan</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="initialbalance" className="form-label">
              Initial Balance
            </label>
            <input
              type="number"
              id="initialbalance"
              name="initialbalance"
              className="form-input"
              value={formData.initialbalance}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AccountForm;