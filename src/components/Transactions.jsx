// src/components/Transactions.js
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
      const data = await ApiService.getAllAccounts();
      const userAccounts = data.accounts.filter(acc => acc.userId === currentUser.id);
      setAccounts(userAccounts);
      
      if (userAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(userAccounts[0].accountId.toString());
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Failed to fetch accounts');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await ApiService.getCategories(currentUser.id);
      setCategories(data);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getTransactions(
        currentUser.id, 
        selectedAccount, 
        filters
      );
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    } finally {
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
        await ApiService.deleteTransaction(currentUser.id, selectedAccount, transactionId);
        fetchTransactions();
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError('Failed to delete transaction');
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

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.categoryId === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getAccountName = () => {
    const account = accounts.find(a => a.accountId === Number(selectedAccount));
    return account ? account.name : '';
  };

  if (loading && !selectedAccount) {
    return <div className="loading">Loading...</div>;
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
                {accounts.map(account => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.name} (₹{account.balance.toFixed(2)})
                  </option>
                ))}
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
                {categories.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name} ({category.type})
                  </option>
                ))}
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

          {selectedAccount && (
            <div className="account-summary">
              <h3>Account Summary</h3>
              <p><strong>Account:</strong> {getAccountName()}</p>
              <p><strong>Balance:</strong> ₹{
                accounts.find(a => a.accountId === Number(selectedAccount))?.balance.toFixed(2) || '0.00'
              }</p>
              <p><strong>Transactions:</strong> {transactions.length}</p>
            </div>
          )}
        </div>

        <div className="transactions-list">
          {!selectedAccount ? (
            <div className="empty-state">
              <p>Please select an account to view transactions</p>
            </div>
          ) : loading ? (
            <div className="loading">Loading transactions...</div>
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
                <h2>Transaction History</h2>
                <p>Showing {transactions.length} transaction(s)</p>
              </div>

              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction.transactionId}>
                      <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`transaction-type ${transaction.type}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td>{getCategoryName(transaction.categoryId)}</td>
                      <td className={`amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link 
                            to={`/transactions/edit/${transaction.transactionId}`}
                            className="btn btn-sm btn-outline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(transaction.transactionId)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="transactions-summary">
                <p>
                  <strong>Total Income:</strong> ₹{
                    transactions
                      .filter(t => t.type === 'income')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)
                  }
                </p>
                <p>
                  <strong>Total Expense:</strong> ₹{
                    transactions
                      .filter(t => t.type === 'expense')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)
                  }
                </p>
                <p>
                  <strong>Net Balance:</strong> ₹{
                    transactions.reduce((sum, t) => {
                      return t.type === 'income' ? sum + t.amount : sum - t.amount;
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