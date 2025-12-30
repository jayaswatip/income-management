import React from 'react';
import { Search, Filter, Calendar, Tag } from 'lucide-react';

const TransactionFilters = ({ filters, onFilterChange, onSearch }) => {
  const categories = [
    'salary', 'freelance', 'business', 'investment', 'gift', 'other-income',
    'food', 'transport', 'housing', 'utilities', 'healthcare', 'entertainment',
    'shopping', 'education', 'travel', 'insurance', 'debt', 'savings', 'other-expense'
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-4 mb-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <h3 className="font-medium text-gray-900">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="form-label">
            <Search className="h-4 w-4 inline mr-2" />
            Search
          </label>
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search || ''}
            onChange={(e) => onSearch(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="form-label">Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="form-label">
            <Tag className="h-4 w-4 inline mr-2" />
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="form-input"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="form-label">
            <Calendar className="h-4 w-4 inline mr-2" />
            Date Range
          </label>
          <select
            value={filters.dateRange || ''}
            onChange={(e) => {
              const range = e.target.value;
              const now = new Date();
              let startDate = '';
              let endDate = now.toISOString().split('T')[0];

              switch (range) {
                case 'today':
                  startDate = endDate;
                  break;
                case 'week':
                  startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                  break;
                case 'month':
                  startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  break;
                case 'year':
                  startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                  break;
                default:
                  startDate = '';
                  endDate = '';
              }

              handleFilterChange('dateRange', range);
              handleFilterChange('startDate', startDate);
              handleFilterChange('endDate', endDate);
            }}
            className="form-input"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {filters.dateRange === 'custom' && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      )}

      {/* Active Filters */}
      {Object.keys(filters).some(key => filters[key] && key !== 'search') && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <button
              onClick={() => onFilterChange({})}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === 'search' || key === 'startDate' || key === 'endDate') return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {key}: {value}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;
