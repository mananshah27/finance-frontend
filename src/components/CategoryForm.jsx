// src/components/CategoryForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApiService from '../services/api';
import './CategoryForm.css';

// eslint-disable-next-line no-unused-vars
function CategoryForm({ currentUser }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchCategoryDetails();
      setIsEdit(true);
    }
  }, [id]);

  const fetchCategoryDetails = async () => {
  try {
    // REMOVE: currentUser.id parameter
    const data = await ApiService.getCategoryById(id);
    setFormData({
      name: data.name,
      type: data.type
    });
  } catch (err) {
    setError('Failed to fetch category details: ' + err.message);
  }
};
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  if (!formData.name.trim() || !formData.type) {
    setError('Please fill all required fields');
    setLoading(false);
    return;
  }

  try {
    if (isEdit) {
      // REMOVE: currentUser.id parameter
      await ApiService.updateCategory(id, formData);
    } else {
      // REMOVE: currentUser.id parameter
      await ApiService.createCategory(formData);
    }
    
    navigate('/categories');
  } catch (err) {
    setError(err.message || 'Failed to save category');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="form-page">
      <div className="form-card">
        <h1>{isEdit ? 'Edit Category' : 'Create New Category'}</h1>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Category Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Salary, Food, Rent, etc."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type" className="form-label">Category Type *</label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'income' })}
              >
                Income
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                Expense
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/categories')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryForm;
