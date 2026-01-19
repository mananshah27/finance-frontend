// src/components/TransactionForm.js - FIXED VERSION
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ApiService from "../services/api";
import { useAuth } from "../contexts/AuthContext"; // Add this import
import "./TransactionForm.css";

function TransactionForm() {
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
  const [loading, setLoading] = useState(true); // Start with true
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth(); // Get currentUser from context

  // Check authentication first
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  }, [currentUser, navigate]);

  // Fetch data once when component mounts
  useEffect(() => {
    if (currentUser && !pageLoaded) {
      const initializeData = async () => {
        try {
          setLoading(true);
          await Promise.all([fetchAccounts(), fetchCategories()]);

          if (id) {
            setIsEdit(true);
            // Load transaction data if editing
            // await fetchTransaction(id);
          }
          
          setPageLoaded(true);
        } catch (err) {
          console.error("Failed to initialize:", err);
          setError("Failed to load page data");
        } finally {
          setLoading(false);
        }
      };

      initializeData();
    }
  }, [currentUser, pageLoaded, id]); // Remove currentUser from dependency array

  // Filter categories based on type
  useEffect(() => {
    if (categories.length > 0) {
      const filtered = categories.filter((cat) => cat.type === formData.type);
      setFilteredCategories(filtered);

      if (formData.categoryId) {
        const currentCat = categories.find(
          (c) => c.categoryId === parseInt(formData.categoryId)
        );
        if (currentCat && currentCat.type !== formData.type) {
          setFormData((prev) => ({ ...prev, categoryId: "" }));
        }
      }
    }
  }, [formData.type, categories, formData.categoryId]);

  const fetchAccounts = async () => {
    try {
      const userAccounts = await ApiService.getAccounts();
      setAccounts(userAccounts);

      if (userAccounts.length > 0 && !formData.accountId) {
        setFormData((prev) => ({
          ...prev,
          accountId: userAccounts[0].accountId.toString(),
        }));
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setError("Failed to load accounts. Please try again.");
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await ApiService.getCategories();
      setCategories(data);
      
      if (data.length === 0) {
        await createDefaultCategories();
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      await createDefaultCategories();
    }
  };

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
        { name: "Other", type: "income" },
        { name: "Other", type: "expense" },
      ];

      for (const category of defaultCategories) {
        try {
          await ApiService.createCategory(category);
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
          console.log("Category might already exist:", category.name);
        }
      }

      const data = await ApiService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to create default categories:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!currentUser) {
      navigate("/login");
      return;
    }

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
      const transactionData = {
        amount: amount,
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        accountId: formData.accountId,
        userId: currentUser.id, // Add userId
      };

      if (formData.description.trim()) {
        transactionData.description = formData.description.trim();
      }

      console.log("Submitting transaction:", transactionData);
      const response = await ApiService.createTransaction(transactionData);
      console.log("Transaction created:", response);

      navigate("/transactions");
    } catch (err) {
      console.error("Transaction error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save transaction. Please check your balance and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = () => {
    if (!formData.accountId || accounts.length === 0) return "";
    const account = accounts.find(
      (a) => a.accountId === Number(formData.accountId)
    );
    return account ? account.name : "";
  };

  const getAccountBalance = () => {
    if (!formData.accountId || accounts.length === 0) return 0;
    const account = accounts.find(
      (a) => a.accountId === Number(formData.accountId)
    );
    return account ? account.balance : 0;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="form-page">
        <div className="form-card">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>Loading transaction form...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!currentUser) {
    return null; // Will redirect in useEffect
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
              <strong>Current Balance:</strong> ₹
              {getAccountBalance().toFixed(2)}
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
              disabled={isEdit || accounts.length === 0}
            >
              {accounts.length === 0 ? (
                <option value="">No accounts available</option>
              ) : (
                <>
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.accountId} value={account.accountId}>
                      {account.name} (₹{account.balance.toFixed(2)})
                    </option>
                  ))}
                </>
              )}
            </select>
            {accounts.length === 0 && (
              <p className="form-help">
                No accounts found. <Link to="/accounts/new">Create an account first</Link>
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Transaction Type <span className="required">*</span>
            </label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-btn ${formData.type === "income" ? "active income" : ""}`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: "income" }))
                }
                disabled={loading}
              >
                💰 Income
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === "expense" ? "active expense" : ""}`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: "expense" }))
                }
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
            {formData.type === "expense" && formData.accountId && accounts.length > 0 && (
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
                    <option key={category.categoryId} value={category.categoryId}>
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
              disabled={loading || accounts.length === 0}
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