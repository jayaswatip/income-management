import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { transactionsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const TransactionForm = ({ isOpen, onClose, transaction, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = {
    income: [
      'salary', 'freelance', 'business', 'investment', 'gift', 'other-income'
    ],
    expense: [
      'food', 'transport', 'housing', 'utilities', 'healthcare', 'entertainment',
      'shopping', 'education', 'travel', 'insurance', 'debt', 'savings', 'other-expense'
    ]
  };

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString().split('T')[0]
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({});
  }, [transaction, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset category when type changes
      ...(name === 'type' && { category: '' })
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (transaction) {
        await transactionsAPI.update(transaction._id, data);
        toast.success('Transaction updated successfully!');
      } else {
        await transactionsAPI.create(data);
        toast.success('Transaction created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="form-label">
              <FileText className="h-4 w-4 inline mr-2" />
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'border-danger-300' : ''}`}
              placeholder="Enter transaction title"
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="form-label">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`form-input ${errors.amount ? 'border-danger-300' : ''}`}
              placeholder="0.00"
            />
            {errors.amount && <p className="form-error">{errors.amount}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="form-label">Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-success-600">Income</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-danger-600">Expense</span>
              </label>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="form-label">
              <Tag className="h-4 w-4 inline mr-2" />
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`form-input ${errors.category ? 'border-danger-300' : ''}`}
            >
              <option value="">Select a category</option>
              {categories[formData.type].map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
            {errors.category && <p className="form-error">{errors.category}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="form-label">
              <Calendar className="h-4 w-4 inline mr-2" />
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`form-input ${errors.date ? 'border-danger-300' : ''}`}
            />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="form-input"
              placeholder="Add a description..."
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn flex-1 ${
                formData.type === 'income' ? 'btn-success' : 'btn-danger'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                transaction ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
