// src/components/TransactionForm.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ApiService from "../services/api";
import "./TransactionForm.css";

function TransactionForm({ currentUser }) {
  const [formData, setFormData] = useState({
    accountId: "",
    amount: "",
    type: "expense",
    categoryId: "",
    description: "",
  });
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // NEW: for initial load
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  // FIX 1: Clean useEffect
  useEffect(() => {
    const initializeForm = async () => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        setInitialLoading(true);
        
        // Fetch accounts and categories in parallel
        const [accountsData, categoriesData] = await Promise.all([
          ApiService.getAccounts(),
          ApiService.getCategories()
        ]);

        setAccounts(accountsData);
        setCategories(categoriesData);

        // Set default account if available
        if (accountsData.length > 0 && !formData.accountId) {
          setFormData(prev => ({
            ...prev,
            accountId: accountsData[0].accountId?.toString() || accountsData[0].id?.toString() || ""
          }));
        }

        // Check if editing
        if (id) {
          setIsEdit(true);
          // TODO: Load transaction data if editing
        }
      } catch (err) {
        console.error("Failed to initialize form:", err);
        setError("Failed to load form data. Please try again.");
        
        // Create default categories if none exist
        if (err.message?.includes("categories") || err.response?.status === 404) {
          await createDefaultCategories();
        }
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [currentUser, id, navigate]); // REMOVED: formData.accountId dependency

  // FIX 2: Separate effect for filtering categories
  useEffect(() => {
    if (categories.length > 0 && formData.type) {
      const filtered = categories.filter(cat => cat.type === formData.type);
      setFilteredCategories(filtered);

      // Auto-select first category if none selected
      if (filtered.length > 0 && !formData.categoryId) {
        setFormData(prev => ({
          ...prev,
          categoryId: filtered[0].categoryId?.toString() || filtered[0].id?.toString() || ""
        }));
      }
    }
  }, [formData.type, categories]);

  const createDefaultCategories = async () => {
    try {
      const defaultCategories = [
        { name: "Salary", type: "income" },
        { name: "Business", type: "income" },
        { name: "Investment", type: "income" },
        { name: "Food & Dining", type: "expense" },
        { name: "Shopping", type: "expense" },
        { name: "Rent", type: "expense" },
        { name: "Transportation", type: "expense" },
        { name: "Entertainment", type: "expense" },
        { name: "Healthcare", type: "expense" },
        { name: "Education", type: "expense" },
        { name: "Utilities", type: "expense" },
        { name: "Other Income", type: "income" },
        { name: "Other Expense", type: "expense" },
      ];

      for (const category of defaultCategories) {
        try {
          await ApiService.createCategory(category);
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
          // Category might already exist
          console.log("Category exists:", category.name);
        }
      }

      // Refresh categories
      const data = await ApiService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to create default categories:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // FIX 3: Better validation
    if (!formData.accountId || !formData.amount || !formData.categoryId) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a number greater than 0");
      setLoading(false);
      return;
    }

    try {
      // FIX 4: Prepare data for backend
      const transactionData = {
        amount: amount,
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        accountId: formData.accountId,
        description: formData.description.trim() || null
      };

      console.log("Submitting transaction:", transactionData);
      
      // Check if we're editing or creating
      let response;
      if (isEdit && id) {
        response = await ApiService.updateTransaction(id, transactionData);
      } else {
        response = await ApiService.createTransaction(transactionData);
      }

      console.log("Transaction saved:", response);
      
      // Redirect to transactions page
      navigate("/transactions");
    } catch (err) {
      console.error("Transaction error:", err);
      
      // FIX 5: Better error messages
      let errorMsg = "Failed to save transaction. ";
      
      if (err.response?.data?.message) {
        errorMsg += err.response.data.message;
      } else if (err.message?.includes("balance")) {
        errorMsg += "Insufficient account balance.";
      } else if (err.message?.includes("network")) {
        errorMsg += "Network error. Please check your connection.";
      } else {
        errorMsg += "Please try again.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // FIX 6: Helper functions with null checks
  const getAccountName = () => {
    if (!formData.accountId || accounts.length === 0) return "";
    
    const account = accounts.find(a => 
      a.accountId?.toString() === formData.accountId || 
      a.id?.toString() === formData.accountId
    );
    
    return account ? account.name : "";
  };

  const getAccountBalance = () => {
    if (!formData.accountId || accounts.length === 0) return 0;
    
    const account = accounts.find(a => 
      a.accountId?.toString() === formData.accountId || 
      a.id?.toString() === formData.accountId
    );
    
    return account ? (account.balance || 0) : 0;
  };

  // FIX 7: Show loading state
  if (initialLoading) {
    return (
      <div className="form-page">
        <div className="form-card loading-card">
          <div className="loading-spinner"></div>
          <p>Loading transaction form...</p>
        </div>
      </div>
    );
  }

  // FIX 8: Show error if no accounts
  if (accounts.length === 0 && !initialLoading) {
    return (
      <div className="form-page">
        <div className="form-card">
          <h1>Add New Transaction</h1>
          <div className="alert alert-error">
            No accounts found. You need to create an account first.
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/accounts/new")}
              className="btn btn-primary"
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn btn-outline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>{isEdit ? "Edit Transaction" : "Add New Transaction"}</h1>

        {error && <div className="alert alert-error">{error}</div>}

        {formData.accountId && accounts.length > 0 && (
          <div className="account-info-card">
            <h3>Account Info</h3>
            <p>
              <strong>Account:</strong> {getAccountName()}
            </p>
            <p>
              <strong>Current Balance:</strong> ₹{getAccountBalance().toFixed(2)}
            </p>
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
              disabled={isEdit || loading}
            >
              {accounts.length === 0 ? (
                <option value="">No accounts available</option>
              ) : (
                <>
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option 
                      key={account.accountId || account.id} 
                      value={account.accountId?.toString() || account.id?.toString()}
                    >
                      {account.name} (₹{(account.balance || 0).toFixed(2)})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Transaction Type <span className="required">*</span>
            </label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-btn ${formData.type === "income" ? "active income" : ""}`}
                onClick={() => setFormData(prev => ({ ...prev, type: "income" }))}
                disabled={loading}
              >
                💰 Income
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === "expense" ? "active expense" : ""}`}
                onClick={() => setFormData(prev => ({ ...prev, type: "expense" }))}
                disabled={loading}
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
              <span className="currency-symbol">₹</span>
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
                disabled={loading}
              />
            </div>
            {formData.type === "expense" && formData.accountId && (
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
              disabled={loading || filteredCategories.length === 0}
            >
              {filteredCategories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                <>
                  <option value="">Select Category</option>
                  {filteredCategories.map((category) => (
                    <option 
                      key={category.categoryId || category.id} 
                      value={category.categoryId?.toString() || category.id?.toString()}
                    >
                      {category.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {filteredCategories.length === 0 && (
              <p className="form-help">
                No {formData.type} categories found.{" "}
                <Link to="/categories">Manage categories</Link>
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description for this transaction..."
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/transactions")}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.accountId || !formData.categoryId}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Saving...
                </>
              ) : isEdit ? (
                "Update Transaction"
              ) : (
                "Add Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;