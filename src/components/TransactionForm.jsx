// src/components/TransactionForm.js - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ApiService from '../services/api';
import './TransactionForm.css';

function TransactionForm({ currentUser }) {
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    type: 'expense',
    categoryId: '',
    description: ''
  });
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    
    if (id) {
      setIsEdit(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (formData.type) {
      const filtered = categories.filter(cat => cat.type === formData.type);
      setFilteredCategories(filtered);
      
      // Reset category if current one doesn't match type
      if (formData.categoryId) {
        const currentCat = categories.find(c => c.categoryId === parseInt(formData.categoryId));
        if (currentCat && currentCat.type !== formData.type) {
          setFormData(prev => ({ ...prev, categoryId: '' }));
        }
      }
    }
  }, [formData.type, categories]);

  const fetchAccounts = async () => {
    try {
      
      const userAccounts = await ApiService.getAccounts();
      setAccounts(userAccounts);
      
      if (userAccounts.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: userAccounts[0].accountId.toString() }));
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Failed to fetch accounts. Please try again.');
    }
  };

  const fetchCategories = async () => {
  try {
    // REMOVE: currentUser.id parameter
    const data = await ApiService.getCategories();
    setCategories(data);
  } catch (err) {
    console.error('Failed to fetch categories:', err);
    createDefaultCategories();
  }
};

  const createDefaultCategories = async () => {
    try {
      const defaultCategories = [
        { name: 'Salary', type: 'income' },
        { name: 'Business', type: 'income' },
        { name: 'Investment', type: 'income' },
        { name: 'Food & Dining', type: 'expense' },
        { name: 'Shopping', type: 'expense' },
        { name: 'Rent', type: 'expense' },
        { name: 'Transportation', type: 'expense' },
        { name: 'Entertainment', type: 'expense' },
        { name: 'Healthcare', type: 'expense' },
        { name: 'Education', type: 'expense' },
        { name: 'Utilities', type: 'expense' },
        { name: 'Other', type: 'income' },
        { name: 'Other', type: 'expense' }
      ];

      for (const category of defaultCategories) {
        try {
          await ApiService.createCategory(category);
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
          // Category might already exist
        }
      }

      // Refresh categories
      const data = await ApiService.getCategories();
      setCategories(data);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      console.error('Failed to create default categories');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.accountId || !formData.amount || !formData.type || !formData.categoryId) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a number greater than 0');
      setLoading(false);
      return;
    }

    try {
      const transactionData = {
        amount: amount,
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        accountId: formData.accountId
      };

      // Add description if provided
      if (formData.description.trim()) {
        transactionData.description = formData.description.trim();
      }
       console.log('Submitting transaction:', transactionData);

      

      const response = await ApiService.createTransaction(transactionData);

      console.log('Transaction created:', response);
      
      navigate('/transactions');
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Failed to save transaction. Please check your balance and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get account name for display
  const getAccountName = () => {
    const account = accounts.find(a => a.accountId === Number(formData.accountId));
    return account ? account.name : '';
  };

  // Get account balance
  const getAccountBalance = () => {
    const account = accounts.find(a => a.accountId === Number(formData.accountId));
    return account ? account.balance : 0;
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>{isEdit ? 'Edit Transaction' : 'Add New Transaction'}</h1>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {formData.accountId && (
          <div className="account-info-card">
            <h3>Account Info</h3>
            <p><strong>Account:</strong> {getAccountName()}</p>
            <p><strong>Current Balance:</strong> ₹{getAccountBalance().toFixed(2)}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="accountId" className="form-label">
              Account <span className="required">*</span>
            </label>
            <select
              id="accountId"
              name="accountId"
              className="form-select"
              value={formData.accountId}
              onChange={handleChange}
              required
              disabled={isEdit}
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={account.accountId} value={account.accountId}>
                  {account.name} (₹{account.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Transaction Type <span className="required">*</span>
            </label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
              >
                💰 Income
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              >
                💸 Expense
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount (₹) <span className="required">*</span>
            </label>
            <div className="amount-input-container">
              <span className="currency-symbol"></span>
              <input
                type="number"
                id="amount"
                name="amount"
                className="form-input amount-input"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            {formData.type === 'expense' && formData.accountId && (
              <p className="form-help">
                Available balance: ₹{getAccountBalance().toFixed(2)}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="categoryId" className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="form-select"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {filteredCategories.map(category => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
            {filteredCategories.length === 0 && (
              <p className="form-help">
                No {formData.type} categories found. <Link to="/categories/new">Create one</Link>
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description for this transaction..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Saving...
                </>
              ) : isEdit ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;