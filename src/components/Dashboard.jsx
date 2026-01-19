// Dashboard.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../services/api';
import './Dashboard.css';

function Dashboard({ currentUser }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalAccounts: 0,
    totalIncome: 0,
    totalExpense: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // 1. Fetch accounts
      const accountsData = await ApiService.getAccounts();
      console.log('Accounts data:', accountsData);
      
      const accountsArray = Array.isArray(accountsData) 
        ? accountsData 
        : (accountsData.accounts || []);
      
      setAccounts(accountsArray);
      
      // 2. Fetch recent transactions
      let allTransactions = [];
      if (accountsArray.length > 0) {
        // Try to get transactions from first account
        const firstAccount = accountsArray[0];
        const accountId = firstAccount.id || firstAccount._id || firstAccount.accountId;
        
        if (accountId) {
          try {
            const transactionsData = await ApiService.getTransactions(accountId, { limit: 5 });
            console.log('Transactions data:', transactionsData);
            
            // Handle different response formats
            if (Array.isArray(transactionsData)) {
              allTransactions = transactionsData.slice(0, 5);
            } else if (transactionsData.transactions) {
              allTransactions = transactionsData.transactions.slice(0, 5);
            }
          } catch (transErr) {
            console.log('Could not fetch transactions:', transErr.message);
          }
        }
      }
      
      setTransactions(allTransactions);
      
      // 3. Calculate stats
      const totalBalance = accountsArray.reduce((sum, acc) => 
        sum + (parseFloat(acc.balance) || 0), 0);
      
      const totalIncome = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
      const totalExpense = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
      console.log('Calculated stats:', { totalBalance, totalIncome, totalExpense });
      
      setStats({
        totalBalance,
        totalAccounts: accountsArray.length,
        totalIncome,
        totalExpense
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Fix: Get account ID properly
  const getAccountId = (account) => {
    return account.id || account._id || account.accountId;
  };

  // Fix: Get transaction ID properly
  const getTransactionId = (transaction) => {
    return transaction.id || transaction._id || transaction.transactionId;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser?.name || currentUser?.Name || 'User'}!</h1>
        <div className="dashboard-actions">
          <Link to="/accounts/new" className="btn btn-primary">
            + Add Account
          </Link>
          <Link to="/transactions/new" className="btn btn-secondary">
            + Add Transaction
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <h3>Total Balance</h3>
          <p className="stat-value">₹{stats.totalBalance.toFixed(2)}</p>
        </div>
        <div className="stat-card success">
          <h3>Total Income</h3>
          <p className="stat-value">₹{stats.totalIncome.toFixed(2)}</p>
        </div>
        <div className="stat-card danger">
          <h3>Total Expense</h3>
          <p className="stat-value">₹{stats.totalExpense.toFixed(2)}</p>
        </div>
        <div className="stat-card info">
          <h3>Accounts</h3>
          <p className="stat-value">{stats.totalAccounts}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="accounts-section">
          <div className="section-header">
            <h2>Your Accounts</h2>
            <Link to="/accounts" className="view-all">View All →</Link>
          </div>
          {accounts.length > 0 ? (
            <div className="accounts-grid">
              {accounts.map(account => {
                const accountId = getAccountId(account);
                return (
                  <div key={accountId} className="account-card">
                    <div className="account-header">
                      <h3>{account.name}</h3>
                      <span className={`account-type ${account.type}`}>
                        {account.type || 'general'}
                      </span>
                    </div>
                    <p className="account-balance">₹{(account.balance || 0).toFixed(2)}</p>
                    <p className="account-date">
                      Created: {account.createdAt 
                        ? new Date(account.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <Link 
                      to={`/transactions?account=${accountId}`}
                      className="btn btn-sm btn-outline"
                    >
                      View Transactions
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No accounts yet. Create your first account!</p>
              <Link to="/accounts/new" className="btn btn-primary">
                Create Account
              </Link>
            </div>
          )}
        </div>

        <div className="transactions-section">
          <div className="section-header">
            <h2>Recent Transactions</h2>
            <Link to="/transactions" className="view-all">View All →</Link>
          </div>
          {transactions.length > 0 ? (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
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
                          : (transaction.date 
                            ? new Date(transaction.date).toLocaleDateString()
                            : 'N/A')}
                      </td>
                      <td>{transaction.description || `Transaction`}</td>
                      <td>{transaction.category || 'Uncategorized'}</td>
                      <td className={`amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹
                        {(transaction.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No transactions yet. Add your first transaction!</p>
              <Link to="/transactions/new" className="btn btn-primary">
                Add Transaction
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;