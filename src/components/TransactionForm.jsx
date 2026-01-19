// src/components/TransactionForm.jsx - FINAL FIX
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
  // eslint-disable-next-line no-unused-vars
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [isEdit, setIsEdit] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  // Initialize form
  useEffect(() => {
    const initializeForm = async () => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        setInitialLoading(true);
        
        // Fetch data
        const [accountsData, categoriesData] = await Promise.all([
          ApiService.getAccounts(),
          ApiService.getCategories()
        ]);

        console.log("Accounts:", accountsData);
        console.log("Categories:", categoriesData);

        setAccounts(Array.isArray(accountsData) ? accountsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Set default account
        if (Array.isArray(accountsData) && accountsData.length > 0) {
          const firstAccount = accountsData[0];
          const accountId = firstAccount.id || firstAccount._id || firstAccount.accountId;
          
          if (accountId) {
            setFormData(prev => ({
              ...prev,
              accountId: String(accountId)
            }));
          }
        }

        if (id) {
          setIsEdit(true);
        }
      } catch (err) {
        console.error("Failed to initialize:", err);
        setError("Failed to load form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [currentUser, id, navigate]);

  // Filter categories by type
  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0 && formData.type) {
      const filtered = categories.filter(cat => cat.type === formData.type);
      setFilteredCategories(filtered);

      // Auto-select first category
      if (filtered.length > 0 && !formData.categoryId) {
        const firstCategory = filtered[0];
        const categoryId = firstCategory.id || firstCategory._id || firstCategory.categoryId;
        
        if (categoryId) {
          setFormData(prev => ({
            ...prev,
            categoryId: String(categoryId)
          }));
        }
      }
    }
  }, [formData.type, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // CRITICAL FIX: For select elements, get the actual value, not display text
    if (e.target.tagName === 'SELECT') {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const actualValue = selectedOption.value;
      
      console.log(`Select changed: ${name} = ${actualValue}`);
      
      setFormData(prev => ({
        ...prev,
        [name]: actualValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    setError("");
  };

 // TransactionForm.jsx mein handleSubmit function UPDATE karein:
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  console.log("🔄 Current form data:", formData);

  // Validate
  if (!formData.accountId) {
    setError("Please select an account");
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

  try {
    // Simple data - backend will validate
    const transactionData = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      categoryId: formData.categoryId, // Direct ID bhejo
      accountId: formData.accountId,
    };

    if (formData.description.trim()) {
      transactionData.description = formData.description.trim();
    }

    console.log("📤 Sending transaction:", transactionData);

    const response = await ApiService.createTransaction(transactionData);
    console.log("✅ Transaction created:", response);

    navigate("/transactions");
  } catch (err) {
    console.error("❌ Transaction error:", err);
    setError(err.message || "Failed to save transaction");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>Add New Transaction</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Account Select - CRITICAL FIX */}
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
            >
              <option value="">Select Account</option>
              {accounts.map((account) => {
                // Get the actual ID
                const accountId = account.id || account._id || account.accountId;
                const displayText = `${account.name} (₹${(account.balance || 0).toFixed(2)})`;
                
                return (
                  <option key={accountId} value={accountId}>
                    {displayText}
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
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              disabled={loading}
            />
          </div>

          {/* Category Select - CRITICAL FIX */}
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
              disabled={filteredCategories.length === 0}
            >
              <option value="">Select Category</option>
              {filteredCategories.map((category) => {
                // Get the actual ID
                const categoryId = category.id || category._id || category.categoryId;
                
                return (
                  <option key={categoryId} value={categoryId}>
                    {category.name}
                  </option>
                );
              })}
            </select>
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
              onChange={handleChange}
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
              disabled={loading}
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