import React from 'react';
import { Edit, Trash2, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { format } from 'date-fns';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: '🍽️', transport: '🚗', housing: '🏠', utilities: '⚡', healthcare: '🏥',
      entertainment: '🎬', shopping: '🛍️', education: '📚', travel: '✈️', insurance: '🛡️',
      debt: '💳', savings: '💰', 'other-expense': '📝'
    };
    return icons[category] || '📝';
  };

  const getStatusColor = () => {
    if (budget.isOverBudget) return 'danger';
    if (budget.isNearLimit) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (budget.isOverBudget) return <AlertTriangle className="h-5 w-5" />;
    if (budget.isNearLimit) return <AlertTriangle className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const statusColor = getStatusColor();

  return (
    <div className={`card hover:shadow-md transition-shadow border-l-4 border-${statusColor}-500`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getCategoryIcon(budget.category)}</div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">
              {budget.category.replace('-', ' ')} Budget
            </h3>
            <p className="text-sm text-gray-500 capitalize">
              {budget.period} • {format(new Date(budget.startDate), 'MMM dd')} - {format(new Date(budget.endDate), 'MMM dd')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg bg-${statusColor}-100 text-${statusColor}-600`}>
            {getStatusIcon()}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(budget)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit budget"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(budget)}
              className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              title="Delete budget"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {budget.percentage.toFixed(1)}% used
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              budget.isOverBudget
                ? 'bg-danger-600'
                : budget.isNearLimit
                ? 'bg-yellow-500'
                : 'bg-success-600'
            }`}
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-600">Spent: </span>
            <span className={`font-medium ${
              budget.isOverBudget ? 'text-danger-600' : 'text-gray-900'
            }`}>
              {formatCurrency(budget.spentAmount)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Budget: </span>
            <span className="font-medium text-gray-900">
              {formatCurrency(budget.budgetAmount)}
            </span>
          </div>
        </div>

        {/* Remaining/Over Budget */}
        <div className="pt-2 border-t">
          {budget.isOverBudget ? (
            <div className="flex items-center space-x-2 text-danger-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Over budget by {formatCurrency(Math.abs(budget.remainingAmount))}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Remaining:</span>
              <span className={`text-sm font-medium ${
                budget.isNearLimit ? 'text-yellow-600' : 'text-success-600'
              }`}>
                {formatCurrency(budget.remainingAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Alert Threshold Info */}
        {budget.isNearLimit && !budget.isOverBudget && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Approaching budget limit ({budget.alertThreshold}% threshold)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetCard;
