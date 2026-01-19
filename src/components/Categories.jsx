import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../services/api';
import './Categories.css';

function Categories({ currentUser }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [currentUser]);

  const fetchCategories = async () => {
    try {
      const data = await ApiService.getCategories();
      console.log('Categories raw data:', data);
      
      // Handle different response formats
      const categoriesArray = Array.isArray(data) ? data : (data.categories || []);
      console.log('Categories array:', categoriesArray);
      
      setCategories(categoriesArray);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await ApiService.deleteCategory(categoryId);
        fetchCategories();
      } catch (err) {
        setError('Failed to delete category: ' + err.message);
      }
    }
  };

  // Fix: Get category ID properly
  const getCategoryId = (category) => {
    return category.id || category._id || category.categoryId || 'N/A';
  };

  // Fix: Get category type properly
  const getCategoryType = (category) => {
    return (category.type || 'expense').toLowerCase();
  };

  // Fix: Get category name properly
  const getCategoryName = (category) => {
    return category.name || 'Unnamed Category';
  };

  if (loading) {
    return (
      <div className="categories-page">
        <div className="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1>Categories</h1>
        <Link to="/categories/new" className="btn btn-primary">
          + Add New Category
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>No categories found. Create your first category!</p>
          <Link to="/categories/new" className="btn btn-primary">
            Create Category
          </Link>
        </div>
      ) : (
        <>
          <div className="categories-grid">
            {categories.map((category, index) => {
              const categoryId = getCategoryId(category);
              const categoryType = getCategoryType(category);
              const categoryName = getCategoryName(category);
              
              return (
                <div key={categoryId || index} className={`category-card ${categoryType}`}>
                  <div className="category-header">
                    <h3>{categoryName}</h3>
                    <span className={`category-type ${categoryType}`}>
                      {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)}
                    </span>
                  </div>
                  <p className="category-id">ID: {categoryId}</p>
                  <div className="category-actions">
                    <Link 
                      to={`/categories/edit/${categoryId}`}
                      className="btn btn-sm btn-outline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(categoryId)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="categories-summary">
            <p>
              <strong>Total Categories:</strong> {categories.length}
            </p>
            <p>
              <strong>Income Categories:</strong> {categories.filter(c => getCategoryType(c) === 'income').length}
            </p>
            <p>
              <strong>Expense Categories:</strong> {categories.filter(c => getCategoryType(c) === 'expense').length}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Categories;