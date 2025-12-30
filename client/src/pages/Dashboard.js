import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI } from '../utils/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchDashboardData();
    fetchInsights();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getOverview({ period });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await dashboardAPI.getInsights();
      setInsights(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your financial status</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="form-input py-2 px-3 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.summary.income)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-danger-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.summary.expenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                dashboardData.summary.balance >= 0 ? 'bg-success-100' : 'bg-danger-100'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  dashboardData.summary.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  dashboardData.summary.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatCurrency(dashboardData.summary.balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.recentTransactions.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights && insights.insights.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Insights</h3>
          <div className="space-y-3">
            {insights.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive'
                    ? 'bg-success-50 border-success-400'
                    : insight.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 mr-3 ${
                    insight.type === 'positive'
                      ? 'text-success-600'
                      : insight.type === 'warning'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        {dashboardData && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-success-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-danger-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{transaction.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {dashboardData && dashboardData.categoryBreakdown.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {dashboardData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Budget Progress */}
      {dashboardData && dashboardData.budgets.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
          <div className="space-y-4">
            {dashboardData.budgets.map((budget) => (
              <div key={budget._id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {budget.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      budget.isOverBudget
                        ? 'bg-danger-600'
                        : budget.percentage >= 80
                        ? 'bg-yellow-500'
                        : 'bg-success-600'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{budget.percentage.toFixed(1)}% used</span>
                  {budget.isOverBudget && (
                    <span className="text-danger-600 font-medium">Over budget!</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
