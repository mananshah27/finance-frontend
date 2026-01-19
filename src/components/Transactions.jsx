// src/components/Transactions.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ApiService from '../services/api';
import './Transactions.css';

function Transactions({ currentUser }) {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accountId = searchParams.get('account');
    if (accountId) {
      setSelectedAccount(accountId);
    }
    fetchAccounts();
    fetchCategories();
  }, [currentUser]);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions();
    }
  }, [selectedAccount, filters]);

  const fetchAccounts = async () => {
    try {
      const userAccounts = await ApiService.getAccounts();
      console.log('Accounts fetched:', userAccounts);
      
      // Handle different response formats
      const accountsArray = Array.isArray(userAccounts) 
        ? userAccounts 
        : (userAccounts.accounts || []);
      
      setAccounts(accountsArray);
      
      if (accountsArray.length > 0 && !selectedAccount) {
        const firstAccount = accountsArray[0];
        // Try different ID fields
        const accountId = firstAccount.id || firstAccount._id || firstAccount.accountId;
        if (accountId) {
          setSelectedAccount(String(accountId));
        }
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to fetch accounts: ' + err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await ApiService.getCategories();
      console.log('Categories fetched:', data);
      
      // Handle different response formats
      const categoriesArray = Array.isArray(data) 
        ? data 
        : (data.categories || []);
      
      setCategories(categoriesArray);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchTransactions = async () => {
    if (!selectedAccount) {
      setTransactions([]);
      return;
    }
    
    setAccountLoading(true);
    try {
      console.log('Fetching transactions for account:', selectedAccount);
      
      const data = await ApiService.getTransactions(selectedAccount, filters);
      console.log('Transactions received:', data);
      
      // Handle different response formats
      const transactionsArray = Array.isArray(data) ? data : [];
      setTransactions(transactionsArray);
      
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
      // Don't show error if it's just "no transactions"
      if (!err.message.includes('No transactions')) {
        setError('Failed to load transactions: ' + err.message);
      }
    } finally {
      setAccountLoading(false);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await ApiService.deleteTransaction(transactionId, selectedAccount);
        fetchTransactions();
      } catch (err) {
        setError('Failed to delete transaction: ' + err.message);
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      categoryId: '',
      startDate: '',
      endDate: ''
    });
  };

  // Fix: Get category name properly
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Unknown';
    
    const category = categories.find(c => 
      c.id === categoryId || 
      c._id === categoryId || 
      c.categoryId === categoryId
    );
    return category ? category.name : 'Unknown';
  };

  // Fix: Get account name properly
  const getAccountName = () => {
    if (!selectedAccount || accounts.length === 0) return '';
    
    const account = accounts.find(a => 
      String(a.id) === selectedAccount || 
      String(a._id) === selectedAccount || 
      String(a.accountId) === selectedAccount
    );
    return account ? account.name : '';
  };

  // Fix: Get account balance
  const getAccountBalance = () => {
    if (!selectedAccount || accounts.length === 0) return 0;
    
    const account = accounts.find(a => 
      String(a.id) === selectedAccount || 
      String(a._id) === selectedAccount || 
      String(a.accountId) === selectedAccount
    );
    return account ? (account.balance || 0) : 0;
  };

  // Fix: Get account ID for display
  const getAccountIdForDisplay = (account) => {
    return account.id || account._id || account.accountId;
  };

  // Fix: Get transaction ID
  const getTransactionId = (transaction) => {
    return transaction.id || transaction._id || transaction.transactionId;
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="transactions-page">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <Link to="/transactions/new" className="btn btn-primary">
          + Add New Transaction
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="transactions-container">
        <div className="filters-section">
          <div className="filter-card">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <label>Account</label>
              <select 
                className="form-select"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">Select Account</option>
                {accounts.map(account => {
                  const accountId = getAccountIdForDisplay(account);
                  return (
                    <option key={accountId} value={accountId}>
                      {account.name} (₹{(account.balance || 0).toFixed(2)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="filter-group">
              <label>Transaction Type</label>
              <select 
                name="type"
                className="form-select"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Category</label>
              <select 
                name="categoryId"
                className="form-select"
                value={filters.categoryId}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {categories.map(category => {
                  const categoryId = category.id || category._id || category.categoryId;
                  return (
                    <option key={categoryId} value={categoryId}>
                      {category.name} ({category.type})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>From Date</label>
                <input
                  type="date"
                  name="startDate"
                  className="form-input"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group">
                <label>To Date</label>
                <input
                  type="date"
                  name="endDate"
                  className="form-input"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <button 
              onClick={clearFilters}
              className="btn btn-outline"
            >
              Clear Filters
            </button>
          </div>

          {selectedAccount && accounts.length > 0 && (
            <div className="account-summary">
              <h3>Account Summary</h3>
              <p><strong>Account:</strong> {getAccountName()}</p>
              <p><strong>Balance:</strong> ₹{getAccountBalance().toFixed(2)}</p>
              <p><strong>Transactions:</strong> {transactions.length}</p>
            </div>
          )}
        </div>

        <div className="transactions-list">
          {!selectedAccount ? (
            <div className="empty-state">
              <p>Please select an account to view transactions</p>
            </div>
          ) : accountLoading ? (
            <div className="loading-spinner"></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions found for this account</p>
              <Link to="/transactions/new" className="btn btn-primary">
                Add Your First Transaction
              </Link>
            </div>
          ) : (
            <>
              <div className="transactions-header">
                <h2>Transaction History - {getAccountName()}</h2>
                <p>Showing {transactions.length} transaction(s)</p>
              </div>

              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => {
                    const transactionId = getTransactionId(transaction);
                    return (
                      <tr key={transactionId}>
                        <td>
                          {transaction.createdAt 
                            ? new Date(transaction.createdAt).toLocaleDateString()
                            : new Date(transaction.date).toLocaleDateString() || 'N/A'}
                        </td>
                        <td>
                          <span className={`transaction-type ${transaction.type}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td>{getCategoryName(transaction.categoryId)}</td>
                        <td>{transaction.description || '-'}</td>
                        <td className={`amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}₹
                          {transaction.amount?.toFixed(2) || '0.00'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link 
                              to={`/transactions/edit/${transactionId}`}
                              className="btn btn-sm btn-outline"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(transactionId)}
                              className="btn btn-sm btn-danger"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="transactions-summary">
                <p>
                  <strong>Total Income:</strong> ₹{
                    transactions
                      .filter(t => t.type === 'income')
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                      .toFixed(2)
                  }
                </p>
                <p>
                  <strong>Total Expense:</strong> ₹{
                    transactions
                      .filter(t => t.type === 'expense')
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                      .toFixed(2)
                  }
                </p>
                <p>
                  <strong>Net Balance:</strong> ₹{
                    transactions.reduce((sum, t) => {
                      const amount = t.amount || 0;
                      return t.type === 'income' ? sum + amount : sum - amount;
                    }, 0).toFixed(2)
                  }
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transactions;