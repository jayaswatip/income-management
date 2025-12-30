const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a transaction title'],
    maxlength: 100
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0.01, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify transaction type']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      // Income categories
      'salary', 'freelance', 'business', 'investment', 'gift', 'other-income',
      // Expense categories
      'food', 'transport', 'housing', 'utilities', 'healthcare', 'entertainment',
      'shopping', 'education', 'travel', 'insurance', 'debt', 'savings', 'other-expense'
    ]
  },
  description: {
    type: String,
    maxlength: 500
  },
  date: {
    type: Date,
    required: [true, 'Please provide a transaction date'],
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for better query performance
TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, type: 1 });
TransactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
