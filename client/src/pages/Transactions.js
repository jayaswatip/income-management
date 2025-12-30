import React, { useState, useEffect } from 'react';
import { Plus, Download, Upload, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { transactionsAPI } from '../utils/api';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionList from '../components/transactions/TransactionList';
import TransactionFilters from '../components/transactions/TransactionFilters';
import toast from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters, searchTerm, pagination.page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      if (searchTerm) {
        // Note: Backend would need to implement search functionality
        // For now, we'll filter on frontend
      }

      const response = await transactionsAPI.getAll(params);
      const { data, total, pages, page } = response.data;
      
      let filteredData = data;
      if (searchTerm) {
        filteredData = data.filter(transaction => 
          transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setTransactions(filteredData);
      setPagination(prev => ({ ...prev, total, pages, page }));
    } catch (error) {
      toast.error('Failed to fetch transactions');
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await transactionsAPI.getStats(filters);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionsAPI.delete(transaction._id);
      toast.success('Transaction deleted successfully!');
      fetchTransactions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleFormSuccess = () => {
    fetchTransactions();
    fetchStats();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalIncome = stats?.summary?.find(s => s._id === 'income')?.total || 0;
  const totalExpenses = stats?.summary?.find(s => s._id === 'expense')?.total || 0;
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage your income and expense transactions</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="btn btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button 
            onClick={handleAddTransaction}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              netBalance >= 0 ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                netBalance >= 0 ? 'text-success-600' : 'text-danger-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${
                netBalance >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      {/* Transaction List */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Transactions ({pagination.total})
          </h3>
          <div className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </div>
        </div>

        <TransactionList
          transactions={transactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          loading={loading}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6 pt-6 border-t">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                  className={`px-3 py-1 rounded ${
                    pagination.page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        transaction={editingTransaction}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Transactions;
