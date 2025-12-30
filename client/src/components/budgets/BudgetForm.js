import React, { useState, useEffect } from 'react';
import { X, Target, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { budgetsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const BudgetForm = ({ isOpen, onClose, budget, onSuccess }) => {
  const [formData, setFormData] = useState({
    category: '',
    budgetAmount: '',
    period: 'monthly',
    startDate: '',
    endDate: '',
    alertThreshold: '80'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const expenseCategories = [
    'food', 'transport', 'housing', 'utilities', 'healthcare', 'entertainment',
    'shopping', 'education', 'travel', 'insurance', 'debt', 'savings', 'other-expense'
  ];

  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        budgetAmount: budget.budgetAmount.toString(),
        period: budget.period,
        startDate: new Date(budget.startDate).toISOString().split('T')[0],
        endDate: new Date(budget.endDate).toISOString().split('T')[0],
        alertThreshold: budget.alertThreshold.toString()
      });
    } else {
      // Set default dates based on period
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setFormData({
        category: '',
        budgetAmount: '',
        period: 'monthly',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        alertThreshold: '80'
      });
    }
    setErrors({});
  }, [budget, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate dates when period changes
      if (name === 'period') {
        const now = new Date();
        let startDate, endDate;
        
        switch (value) {
          case 'weekly':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        
        newData.startDate = startDate.toISOString().split('T')[0];
        newData.endDate = endDate.toISOString().split('T')[0];
      }
      
      return newData;
    });
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.budgetAmount || parseFloat(formData.budgetAmount) <= 0) {
      newErrors.budgetAmount = 'Budget amount must be greater than 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.alertThreshold || parseFloat(formData.alertThreshold) < 0 || parseFloat(formData.alertThreshold) > 100) {
      newErrors.alertThreshold = 'Alert threshold must be between 0 and 100';
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
        budgetAmount: parseFloat(formData.budgetAmount),
        alertThreshold: parseFloat(formData.alertThreshold)
      };

      if (budget) {
        await budgetsAPI.update(budget._id, data);
        toast.success('Budget updated successfully!');
      } else {
        await budgetsAPI.create(data);
        toast.success('Budget created successfully!');
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
            {budget ? 'Edit Budget' : 'Create New Budget'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="form-label">
              <Target className="h-4 w-4 inline mr-2" />
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`form-input ${errors.category ? 'border-danger-300' : ''}`}
            >
              <option value="">Select a category</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
            {errors.category && <p className="form-error">{errors.category}</p>}
          </div>

          {/* Budget Amount */}
          <div>
            <label className="form-label">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Budget Amount
            </label>
            <input
              type="number"
              name="budgetAmount"
              value={formData.budgetAmount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`form-input ${errors.budgetAmount ? 'border-danger-300' : ''}`}
              placeholder="0.00"
            />
            {errors.budgetAmount && <p className="form-error">{errors.budgetAmount}</p>}
          </div>

          {/* Period */}
          <div>
            <label className="form-label">Period</label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="form-input"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                <Calendar className="h-4 w-4 inline mr-2" />
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`form-input ${errors.startDate ? 'border-danger-300' : ''}`}
              />
              {errors.startDate && <p className="form-error">{errors.startDate}</p>}
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`form-input ${errors.endDate ? 'border-danger-300' : ''}`}
              />
              {errors.endDate && <p className="form-error">{errors.endDate}</p>}
            </div>
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="form-label">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Alert Threshold (%)
            </label>
            <input
              type="number"
              name="alertThreshold"
              value={formData.alertThreshold}
              onChange={handleChange}
              min="0"
              max="100"
              className={`form-input ${errors.alertThreshold ? 'border-danger-300' : ''}`}
              placeholder="80"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get notified when you've spent this percentage of your budget
            </p>
            {errors.alertThreshold && <p className="form-error">{errors.alertThreshold}</p>}
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
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                budget ? 'Update Budget' : 'Create Budget'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
