import React, { useState, useEffect } from 'react';
import { Plus, Target, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';
import { budgetsAPI } from '../utils/api';
import BudgetForm from '../components/budgets/BudgetForm';
import BudgetCard from '../components/budgets/BudgetCard';
import toast from 'react-hot-toast';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchBudgets();
    fetchAlerts();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetsAPI.getAll();
      setBudgets(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch budgets');
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await budgetsAPI.getAlerts();
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleAddBudget = () => {
    setEditingBudget(null);
    setShowForm(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDeleteBudget = async (budget) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await budgetsAPI.delete(budget._id);
      toast.success('Budget deleted successfully!');
      fetchBudgets();
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to delete budget');
    }
  };

  const handleFormSuccess = () => {
    fetchBudgets();
    fetchAlerts();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate summary stats
  const totalBudgets = budgets.length;
  const activeBudgets = budgets.filter(b => b.isActive).length;
  const overBudgetCount = budgets.filter(b => b.isOverBudget).length;
  const nearLimitCount = budgets.filter(b => b.isNearLimit && !b.isOverBudget).length;
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpentAmount = budgets.reduce((sum, b) => sum + b.spentAmount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600">Set and track your spending budgets</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="card">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">Set and track your spending budgets</p>
        </div>
        <button 
          onClick={handleAddBudget}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budgets</p>
              <p className="text-2xl font-bold text-gray-900">{totalBudgets}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">On Track</p>
              <p className="text-2xl font-bold text-success-600">
                {activeBudgets - overBudgetCount - nearLimitCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Near Limit</p>
              <p className="text-2xl font-bold text-yellow-600">{nearLimitCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Over Budget</p>
              <p className="text-2xl font-bold text-danger-600">{overBudgetCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Budget Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.isOverBudget
                    ? 'bg-danger-50 border-danger-400'
                    : 'bg-yellow-50 border-yellow-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {alert.category.replace('-', ' ')} Budget
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(alert.spentAmount)} / {formatCurrency(alert.budgetAmount)}
                    </div>
                    <div className={`text-xs ${
                      alert.isOverBudget ? 'text-danger-600' : 'text-yellow-600'
                    }`}>
                      {alert.percentage.toFixed(1)}% used
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Overview */}
      {totalBudgets > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Total Budget</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(totalBudgetAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Total Spent</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(totalSpentAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Remaining</span>
                <span className={`text-sm font-bold ${
                  totalBudgetAmount - totalSpentAmount >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatCurrency(totalBudgetAmount - totalSpentAmount)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {totalBudgetAmount > 0 ? ((totalSpentAmount / totalBudgetAmount) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-gray-600">Overall Budget Usage</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      totalSpentAmount > totalBudgetAmount
                        ? 'bg-danger-600'
                        : totalSpentAmount / totalBudgetAmount > 0.8
                        ? 'bg-yellow-500'
                        : 'bg-success-600'
                    }`}
                    style={{ 
                      width: `${Math.min((totalSpentAmount / totalBudgetAmount) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget._id}
              budget={budget}
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <Target className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
          <p className="text-gray-500 mb-4">
            Start by creating your first budget to track your spending goals.
          </p>
          <button 
            onClick={handleAddBudget}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Budget
          </button>
        </div>
      )}

      {/* Budget Form Modal */}
      <BudgetForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        budget={editingBudget}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Budgets;
