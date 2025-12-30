import React from 'react';
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

const TransactionList = ({ transactions, onEdit, onDelete, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      salary: '💼', freelance: '💻', business: '🏢', investment: '📈', gift: '🎁',
      food: '🍽️', transport: '🚗', housing: '🏠', utilities: '⚡', healthcare: '🏥',
      entertainment: '🎬', shopping: '🛍️', education: '📚', travel: '✈️', insurance: '🛡️',
      debt: '💳', savings: '💰'
    };
    return icons[category] || '📝';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-400 mb-4">
          <TrendingUp className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
        <p className="text-gray-500">Start by adding your first income or expense transaction.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction._id} className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${
                transaction.type === 'income' 
                  ? 'bg-success-100 text-success-600' 
                  : 'bg-danger-100 text-danger-600'
              }`}>
                {transaction.type === 'income' ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
                  <h3 className="font-semibold text-gray-900">{transaction.title}</h3>
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500 capitalize">
                    {transaction.category.replace('-', ' ')}
                  </span>
                  <span className="text-sm text-gray-400">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </span>
                </div>
                {transaction.description && (
                  <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
                <div className="text-xs text-gray-400">
                  {format(new Date(transaction.createdAt), 'HH:mm')}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(transaction)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Edit transaction"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(transaction)}
                  className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Delete transaction"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
