// src/services/api.js - FIXED VERSION
const API_BASE_URL = import.meta.env.PROD
  ? "https://finance-backend-jtpz.onrender.com/api"
  : "http://localhost:3000/api";

class ApiService {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log("🌐 API Request:", url, options.method || "GET");

    const config = {
      headers,
      method: options.method,
    };

    if (options.body !== undefined) {
      // FIX: Properly stringify the body
      const bodyString =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);

      config.body = bodyString;

      console.log("📦 Request Body:", bodyString);
    }

    try {
      const response = await fetch(url, config);
      let data;

      try {
        data = await response.json();
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        data = { message: await response.text() };
      }

      console.log("📨 API Response:", response.status, data);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("currentUser");
          window.location.href = "/login";
        }

        throw new Error(
          data.message || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return data;
    } catch (error) {
      console.error("❌ API Error:", error);
      throw error;
    }
  }

  // User APIs
  static async register(userData) {
    const data = await this.request("/users/register", {
      method: "POST",
      body: userData,
    });

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
    }

    return data;
  }

  static async login(credentials) {
    const data = await this.request("/users/login", {
      method: "POST",
      body: credentials,
    });

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
    }

    return data;
  }

  static async getProfile() {
    // Try different endpoints
    try {
      // Option 1: Try /users/me
      return await this.request("/users/me");
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      console.log("Trying alternate profile endpoint...");
      // Option 2: Try /users/profile
      return await this.request("/users/profile");
    }
  }

  static async updateProfile(updates) {
    try {
      // Try /users/me first
      return await this.request("/users/me", {
        method: "PUT",
        body: updates,
      });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      console.log("Trying alternate update endpoint...");
      // Try /users/profile
      return await this.request("/users/profile", {
        method: "PUT",
        body: updates,
      });
    }
  }

  static async deleteProfile() {
    return this.request("/users/profile", {
      method: "DELETE",
    });
  }

  // Account APIs
  static async createAccount(accountData) {
    return this.request("/accounts", {
      method: "POST",
      body: accountData,
    });
  }

  static async getAccounts() {
    const data = await this.request("/accounts");
    console.log("Accounts data received:", data);
    return data.accounts || data || [];
  }

  static async getAccountById(accountId) {
    return this.request(`/accounts/${accountId}`);
  }

  static async updateAccount(accountId, updates) {
    return this.request(`/accounts/${accountId}`, {
      method: "PUT",
      body: updates,
    });
  }

  static async deleteAccount(accountId) {
    return this.request(`/accounts/${accountId}`, {
      method: "DELETE",
    });
  }

  // Category APIs
  static async createCategory(categoryData) {
    return this.request("/categories", {
      method: "POST",
      body: categoryData,
    });
  }

  static async getCategories() {
    const data = await this.request("/categories");
    console.log("Categories data received:", data);
    return data.categories || data || [];
  }

  static async getCategoryById(categoryId) {
    return this.request(`/categories/${categoryId}`);
  }

  static async updateCategory(categoryId, updates) {
    return this.request(`/categories/${categoryId}`, {
      method: "PUT",
      body: updates,
    });
  }

  static async deleteCategory(categoryId) {
    return this.request(`/categories/${categoryId}`, {
      method: "DELETE",
    });
  }

  // Transaction APIs - CRITICAL FIXES
  static async createTransaction(transactionData) {
    console.log("Creating transaction with data:", transactionData);

    // FIX 1: Validate data before sending
    if (!transactionData.accountId || transactionData.accountId.includes("₹")) {
      throw new Error("Invalid account ID");
    }

    if (!transactionData.categoryId) {
      throw new Error("Category ID is required");
    }

    // FIX 2: Ensure proper data types
    const cleanData = {
      amount: parseFloat(transactionData.amount),
      type: transactionData.type,
      categoryId: String(transactionData.categoryId).trim(),
      accountId: String(transactionData.accountId).trim(),
    };

    // Add optional fields
    if (transactionData.description) {
      cleanData.description = String(transactionData.description).trim();
    }

    console.log("Sending cleaned transaction data:", cleanData);

    return this.request("/transactions", {
      method: "POST",
      body: cleanData,
    });
  }

  static async getTransactions(accountId, filters = {}) {
    if (!accountId) {
      console.warn("No accountId provided for getTransactions");
      return [];
    }

    const queryParams = new URLSearchParams({
      accountId: String(accountId),
      ...filters,
    }).toString();

    console.log("Fetching transactions with params:", queryParams);

    const data = await this.request(`/transactions?${queryParams}`);
    return data.transactions || data || [];
  }

  static async getTransactionById(transactionId, accountId) {
    return this.request(
      `/transactions/${transactionId}?accountId=${accountId}`,
    );
  }

  static async updateTransaction(transactionId, updates) {
    // FIX: Removed accountId parameter for consistency
    return this.request(`/transactions/${transactionId}`, {
      method: "PUT",
      body: updates,
    });
  }

  static async deleteTransaction(transactionId, accountId) {
    return this.request(
      `/transactions/${transactionId}?accountId=${accountId}`,
      {
        method: "DELETE",
      },
    );
  }

  // Logout
  static logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
  }
}

export default ApiService;
