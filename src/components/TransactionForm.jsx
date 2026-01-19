// src/components/TransactionForm.jsx - URGENT FIX
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [isEdit, setIsEdit] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  // FIX 1: Initialize form properly
  useEffect(() => {
    const initializeForm = async () => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        setInitialLoading(true);
        
        // Fetch accounts and categories
        const accountsData = await ApiService.getAccounts();
        const categoriesData = await ApiService.getCategories();
        
        setAccounts(accountsData);
        setCategories(categoriesData);

        // Set default account if available
        if (accountsData.length > 0 && !formData.accountId) {
          // FIX: Use account.id not accountId
          const firstAccount = accountsData[0];
          setFormData(prev => ({
            ...prev,
            accountId: firstAccount.id?.toString() || firstAccount._id?.toString() || ""
          }));
        }

        if (id) {
          setIsEdit(true);
        }
      } catch (err) {
        console.error("Failed to initialize:", err);
        setError("Failed to load data");
        
        // Try to create default categories
        try {
          await createDefaultCategories();
          const newCategories = await ApiService.getCategories();
          setCategories(newCategories);
        } catch (categoryErr) {
          console.error("Could not create categories:", categoryErr);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [currentUser, id, navigate]);

  // FIX 2: Filter categories properly
  useEffect(() => {
    if (categories.length > 0 && formData.type) {
      const filtered = categories.filter(cat => cat.type === formData.type);
      setFilteredCategories(filtered);

      // Auto-select first category
      if (filtered.length > 0 && !formData.categoryId) {
        setFormData(prev => ({
          ...prev,
          categoryId: filtered[0].id?.toString() || filtered[0]._id?.toString() || ""
        }));
      }
    }
  }, [formData.type, categories]);

  const createDefaultCategories = async () => {
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
        // Category exists
      }
    }
  };

  // FIX 3: Handle select change properly
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    
    // FIX: Log what we're getting
    console.log(`${name} changed to:`, value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleInputChange = (e) => {
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

    // FIX 4: Debug form data
    console.log("Form data before submit:", formData);
    console.log("Accounts:", accounts);
    console.log("Categories:", categories);
    console.log("Filtered categories:", filteredCategories);

    // Validation
    if (!formData.accountId || formData.accountId.includes("₹")) {
      setError("Please select a valid account");
      setLoading(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    if (!formData.categoryId) {
      setError("Please select a category");
      setLoading(false);
      return;
    }

    // Find the actual account and category objects
    const selectedAccount = accounts.find(acc => 
      acc.id?.toString() === formData.accountId || 
      acc._id?.toString() === formData.accountId ||
      acc.accountId?.toString() === formData.accountId
    );

    const selectedCategory = categories.find(cat => 
      cat.id?.toString() === formData.categoryId || 
      cat._id?.toString() === formData.categoryId ||
      cat.categoryId?.toString() === formData.categoryId
    );

    console.log("Selected account:", selectedAccount);
    console.log("Selected category:", selectedCategory);

    if (!selectedAccount) {
      setError("Invalid account selected");
      setLoading(false);
      return;
    }

    if (!selectedCategory) {
      setError("Invalid category selected");
      setLoading(false);
      return;
    }

    try {
      // FIX 5: Prepare CORRECT data for backend
      const transactionData = {
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: selectedCategory.id || selectedCategory._id || selectedCategory.categoryId,
        accountId: selectedAccount.id || selectedAccount._id || selectedAccount.accountId,
      };

      // Add description if provided
      if (formData.description && formData.description.trim()) {
        transactionData.description = formData.description.trim();
      }

      console.log("Submitting to backend:", transactionData);

      const response = await ApiService.createTransaction(transactionData);
      console.log("Response:", response);

      // Success - redirect
      navigate("/transactions");
    } catch (err) {
      console.error("Full error:", err);
      console.error("Error response:", err.response?.data);
      
      let errorMsg = "Failed to save transaction. ";
      
      if (err.response?.data?.message) {
        errorMsg += err.response.data.message;
      } else if (err.message) {
        errorMsg += err.message;
      } else if (err.response?.status === 400) {
        errorMsg += "Missing required fields. Please check all inputs.";
      } else {
        errorMsg += "Please try again.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  // eslint-disable-next-line no-unused-vars
  const getAccountName = () => {
    if (!formData.accountId || accounts.length === 0) return "";
    
    const account = accounts.find(acc => 
      acc.id?.toString() === formData.accountId || 
      acc._id?.toString() === formData.accountId ||
      acc.accountId?.toString() === formData.accountId
    );
    
    return account ? account.name : "";
  };

  // eslint-disable-next-line no-unused-vars
  const getAccountBalance = () => {
    if (!formData.accountId || accounts.length === 0) return 0;
    
    const account = accounts.find(acc => 
      acc.id?.toString() === formData.accountId || 
      acc._id?.toString() === formData.accountId ||
      acc.accountId?.toString() === formData.accountId
    );
    
    return account ? (account.balance || 0) : 0;
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="form-page">
        <div className="form-card">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>Add New Transaction</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* FIX 6: Account select with proper value */}
          <div className="form-group">
            <label htmlFor="accountId" className="form-label">
              Account <span className="required">*</span>
            </label>
            <select
              id="accountId"
              name="accountId"
              className="form-select"
              value={formData.accountId}
              onChange={handleSelectChange}
              required
            >
              <option value="">Select Account</option>
              {accounts.map((account) => {
                // FIX: Use correct ID field
                const accountId = account.id || account._id || account.accountId;
                return (
                  <option key={accountId} value={accountId}>
                    {account.name} (₹{(account.balance || 0).toFixed(2)})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Transaction Type */}
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

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount (₹) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              className="form-input"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              disabled={loading}
            />
          </div>

          {/* FIX 7: Category select with proper value */}
          <div className="form-group">
            <label htmlFor="categoryId" className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="form-select"
              value={formData.categoryId}
              onChange={handleSelectChange}
              required
              disabled={filteredCategories.length === 0}
            >
              <option value="">Select Category</option>
              {filteredCategories.map((category) => {
                // FIX: Use correct ID field
                const categoryId = category.id || category._id || category.categoryId;
                return (
                  <option key={categoryId} value={categoryId}>
                    {category.name}
                  </option>
                );
              })}
            </select>
            {filteredCategories.length === 0 && (
              <p className="form-help">
                No categories found for {formData.type}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add description..."
              rows="3"
              disabled={loading}
            />
          </div>

          {/* Submit */}
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
              disabled={loading || !formData.accountId || !formData.categoryId || !formData.amount}
            >
              {loading ? "Saving..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;