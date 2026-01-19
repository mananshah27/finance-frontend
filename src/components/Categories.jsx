// src/components/Categories.js
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
      setCategories(data);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Line 48-52 UPDATE handleDelete:
const handleDelete = async (categoryId) => {
  if (window.confirm('Are you sure you want to delete this category?')) {
    try {
      // REMOVE: currentUser.id parameter
      await ApiService.deleteCategory(categoryId);
      fetchCategories();
    } catch (err) {
      setError('Failed to delete category: ' + err.message);
    }
  }
};

  if (loading) {
    return <div className="loading">Loading categories...</div>;
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
            {categories.map(category => (
              <div key={category.categoryId} className={`category-card ${category.type}`}>
                <div className="category-header">
                  <h3>{category.name}</h3>
                  <span className={`category-type ${category.type}`}>
                    {category.type}
                  </span>
                </div>
                <p className="category-id">ID: {category.categoryId}</p>
                <div className="category-actions">
                  <Link 
                    to={`/categories/edit/${category.categoryId}`}
                    className="btn btn-sm btn-outline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(category.categoryId)}
                    className="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="categories-summary">
            <p>
              <strong>Total Categories:</strong> {categories.length}
            </p>
            <p>
              <strong>Income Categories:</strong> {categories.filter(c => c.type === 'income').length}
            </p>
            <p>
              <strong>Expense Categories:</strong> {categories.filter(c => c.type === 'expense').length}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Categories;