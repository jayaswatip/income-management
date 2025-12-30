import React, { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import { transactionsAPI, dashboardAPI } from '../utils/api';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [reportData, setReportData] = useState({
    monthlyTrend: [],
    categoryBreakdown: [],
    incomeVsExpenses: [],
    topCategories: []
  });
  const [stats, setStats] = useState(null);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      let startDate, endDate;
      
      switch (dateRange) {
        case '1month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case '3months':
          startDate = startOfMonth(subMonths(now, 2));
          endDate = endOfMonth(now);
          break;
        case '6months':
          startDate = startOfMonth(subMonths(now, 5));
          endDate = endOfMonth(now);
          break;
        case '1year':
          startDate = startOfMonth(subMonths(now, 11));
          endDate = endOfMonth(now);
          break;
        default:
          startDate = startOfMonth(subMonths(now, 5));
          endDate = endOfMonth(now);
      }

      // Fetch transaction stats
      const statsResponse = await transactionsAPI.getStats({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Fetch dashboard data for trends
      const dashboardResponse = await dashboardAPI.getOverview({
        period: dateRange === '1month' ? 'month' : 'year'
      });

      // Process monthly trend data
      const monthlyTrend = generateMonthlyTrend(startDate, endDate);
      
      // Process category breakdown
      const categoryBreakdown = statsResponse.data.data.categoryBreakdown || [];
      
      // Generate income vs expenses data
      const incomeVsExpenses = generateIncomeVsExpenses(monthlyTrend);

      setReportData({
        monthlyTrend,
        categoryBreakdown: categoryBreakdown.slice(0, 8), // Top 8 categories
        incomeVsExpenses,
        topCategories: categoryBreakdown.slice(0, 5)
      });

      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrend = (startDate, endDate) => {
    const months = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      months.push({
        month: format(current, 'MMM yyyy'),
        income: Math.floor(Math.random() * 5000) + 3000, // Mock data
        expenses: Math.floor(Math.random() * 4000) + 2000,
        net: 0
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    return months.map(month => ({
      ...month,
      net: month.income - month.expenses
    }));
  };

  const generateIncomeVsExpenses = (monthlyData) => {
    return monthlyData.map(month => ({
      month: month.month,
      income: month.income,
      expenses: month.expenses
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalIncome = reportData.monthlyTrend.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = reportData.monthlyTrend.reduce((sum, month) => sum + month.expenses, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Detailed financial reports and analytics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="card">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Detailed financial reports and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-input py-2 px-3 text-sm"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
          <button className="btn btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-success-600">
                {formatCurrency(totalIncome)}
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
              <p className="text-2xl font-bold text-danger-600">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              netSavings >= 0 ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              <BarChart3 className={`h-6 w-6 ${
                netSavings >= 0 ? 'text-success-600' : 'text-danger-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Savings</p>
              <p className={`text-2xl font-bold ${
                netSavings >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(netSavings)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              savingsRate >= 20 ? 'bg-success-100' : savingsRate >= 10 ? 'bg-yellow-100' : 'bg-danger-100'
            }`}>
              <PieChart className={`h-6 w-6 ${
                savingsRate >= 20 ? 'text-success-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-danger-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Savings Rate</p>
              <p className={`text-2xl font-bold ${
                savingsRate >= 20 ? 'text-success-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-danger-600'
              }`}>
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stackId="1" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={reportData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {reportData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expenses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Worth Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Worth Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Categories Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.topCategories.map((category, index) => {
                const percentage = totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0;
                return (
                  <tr key={category._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3`} 
                             style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                        </div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {category._id.replace('-', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
