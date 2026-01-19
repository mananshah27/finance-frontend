// src/components/Accounts.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ApiService from "../services/api";
import "./Accounts.css";

function Accounts({ currentUser }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, [currentUser]);

  const fetchAccounts = async () => {
    try {
      const userAccounts = await ApiService.getAccounts();

      setAccounts(userAccounts);
    } catch (err) {
      setError("Failed to fetch accounts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Line 48-52 UPDATE handleDelete:
  const handleDelete = async (accountId) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        // REMOVE: currentUser.id parameter
        await ApiService.deleteAccount(accountId);
        fetchAccounts();
      } catch (err) {
        setError("Failed to delete account: " + err.message);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading accounts...</div>;
  }

  return (
    <div className="accounts-page">
      <div className="page-header">
        <h1>Accounts</h1>
        <Link to="/accounts/new" className="btn btn-primary">
          + Add New Account
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {accounts.length === 0 ? (
        <div className="empty-state">
          <p>No accounts found. Create your first account!</p>
          <Link to="/accounts/new" className="btn btn-primary">
            Create Account
          </Link>
        </div>
      ) : (
        <div className="accounts-list">
          {accounts.map((account) => (
            <div key={account.accountId} className="account-item">
              <div className="account-info">
                <div className="account-main">
                  <h3>{account.name}</h3>
                  <span className={`account-type ${account.type}`}>
                    {account.type}
                  </span>
                </div>
                <p className="account-balance">₹{account.balance.toFixed(2)}</p>
                <p className="account-date">
                  Created: {new Date(account.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="account-actions">
                <Link
                  to={`/transactions?account=${account.accountId}`}
                  className="btn btn-sm btn-outline"
                >
                  View Transactions
                </Link>
                <Link
                  to={`/accounts/edit/${account.accountId}`}
                  className="btn btn-sm btn-outline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(account.accountId)}
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="total-summary">
        <h3>
          Total Balance: ₹
          {accounts.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)}
        </h3>
        <p>
          {accounts.length} account{accounts.length !== 1 ? "s" : ""} found
        </p>
      </div>
    </div>
  );
}

export default Accounts;
