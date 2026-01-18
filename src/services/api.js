// src/services/api.js - UPDATED FOR MONGODB
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://finance-backend-jtpz.onrender.com/api'
  : 'http://localhost:3000/api';


class ApiService {
  // Helper function for making API calls with auth
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 API Request:', url, options.method || 'GET');

    const config = {
      headers,
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
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

      console.log('📨 API Response:', response.status, data);

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          window.location.href = '/login';
        }
        
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  // User APIs
  static async register(userData) {
    const data = await this.request('/users/register', {
      method: 'POST',
      body: userData,
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }

    return data;
  }

  static async login(credentials) {
    const data = await this.request('/users/login', {
      method: 'POST',
      body: credentials,
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }

    return data;
  }

  static async getProfile() {
    return this.request('/users/profile');
  }

  static async updateProfile(updates) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: updates,
    });
  }

  static async deleteProfile() {
    return this.request('/users/profile', {
      method: 'DELETE',
    });
  }

  // Account APIs
  static async createAccount(accountData) {
    return this.request('/accounts', {
      method: 'POST',
      body: accountData,
    });
  }

  static async getAccounts() {
    const data = await this.request('/accounts');
    return data.accounts;
  }

  static async getAccountById(accountId) {
    return this.request(`/accounts/${accountId}`);
  }

  static async updateAccount(accountId, updates) {
    return this.request(`/accounts/${accountId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  static async deleteAccount(accountId) {
    return this.request(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // Category APIs
  static async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: categoryData,
    });
  }

  static async getCategories() {
    return this.request('/categories');
  }

  static async getCategoryById(categoryId) {
    return this.request(`/categories/${categoryId}`);
  }

  static async updateCategory(categoryId, updates) {
    return this.request(`/categories/${categoryId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  static async deleteCategory(categoryId) {
    return this.request(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Transaction APIs
  static async createTransaction(accountId, transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: {
        ...transactionData,
        accountId,
      },
    });
  }

  static async getTransactions(accountId, filters = {}) {
    const queryParams = new URLSearchParams({
      accountId,
      ...filters
    }).toString();

    const data = await this.request(`/transactions?${queryParams}`);
    return data.transactions;
  }

  static async getTransactionById(transactionId, accountId) {
    return this.request(`/transactions/${transactionId}?accountId=${accountId}`);
  }

  static async updateTransaction(transactionId, accountId, updates) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: {
        ...updates,
        accountId,
      },
    });
  }

  static async deleteTransaction(transactionId, accountId) {
    return this.request(`/transactions/${transactionId}?accountId=${accountId}`, {
      method: 'DELETE',
    });
  }

  // Logout
  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }
}

export default ApiService;