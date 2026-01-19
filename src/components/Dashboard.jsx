// src/components/Dashboard.js
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

  // Line 25-35 UPDATE fetchDashboardData:
const fetchDashboardData = async () => {
  try {
    // Fetch accounts
    const userAccounts = await ApiService.getAccounts();
    
    // Fetch recent transactions
    let allTransactions = [];
    for (const account of userAccounts) {
      try {
        // REMOVE: currentUser.id parameter
        const transData = await ApiService.getTransactions(account._id, {});  // CHANGED: accountId → _id
        allTransactions = [...allTransactions, ...transData.transactions];
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        console.log(`No transactions for account ${account._id}`);
      }
    }
    
    // Calculate stats
    const totalBalance = userAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    setAccounts(userAccounts);
    setTransactions(allTransactions.slice(0, 5));
    setStats({
      totalBalance,
      totalAccounts: userAccounts.length,
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
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser.Name}!</h1>
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
              {accounts.map(account => (
                <div key={account.accountId} className="account-card">
                  <div className="account-header">
                    <h3>{account.name}</h3>
                    <span className={`account-type ${account.type}`}>
                      {account.type}
                    </span>
                  </div>
                  <p className="account-balance">₹{account.balance.toFixed(2)}</p>
                  <p className="account-date">
                    Created: {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                  <Link 
                    to={`/transactions?account=${account.accountId}`}
                    className="btn btn-sm btn-outline"
                  >
                    View Transactions
                  </Link>
                </div>
              ))}
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
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.transactionId}>
                    <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                    <td>Transaction #{transaction.transactionId}</td>
                    <td>
                      <span className={`transaction-type ${transaction.type}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
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