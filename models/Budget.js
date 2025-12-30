const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'food', 'transport', 'housing', 'utilities', 'healthcare', 'entertainment',
      'shopping', 'education', 'travel', 'insurance', 'debt', 'savings', 'other-expense'
    ]
  },
  budgetAmount: {
    type: Number,
    required: [true, 'Please provide a budget amount'],
    min: [0, 'Budget amount must be positive']
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  alertThreshold: {
    type: Number,
    default: 80, // Alert when 80% of budget is used
    min: [0, 'Alert threshold must be positive'],
    max: [100, 'Alert threshold cannot exceed 100%']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique budget per category per user per period
BudgetSchema.index({ user: 1, category: 1, startDate: 1 }, { unique: true });

// Virtual for spent amount (calculated from transactions)
BudgetSchema.virtual('spentAmount', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'budget',
  justOne: false
});

module.exports = mongoose.model('Budget', BudgetSchema);
