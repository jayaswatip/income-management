const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all budgets for user
// @route   GET /api/budgets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Calculate spent amount for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Transaction.aggregate([
          {
            $match: {
              user: req.user.id,
              type: 'expense',
              category: budget.category,
              date: {
                $gte: budget.startDate,
                $lte: budget.endDate
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const spentAmount = spent.length > 0 ? spent[0].total : 0;
        const percentage = budget.budgetAmount > 0 ? (spentAmount / budget.budgetAmount) * 100 : 0;

        return {
          ...budget.toObject(),
          spentAmount,
          percentage: Math.round(percentage * 100) / 100,
          remainingAmount: budget.budgetAmount - spentAmount,
          isOverBudget: spentAmount > budget.budgetAmount,
          isNearLimit: percentage >= budget.alertThreshold
        };
      })
    );

    res.json({
      success: true,
      count: budgetsWithSpent.length,
      data: budgetsWithSpent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Calculate spent amount
    const spent = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id,
          type: 'expense',
          category: budget.category,
          date: {
            $gte: budget.startDate,
            $lte: budget.endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const spentAmount = spent.length > 0 ? spent[0].total : 0;
    const percentage = budget.budgetAmount > 0 ? (spentAmount / budget.budgetAmount) * 100 : 0;

    const budgetWithSpent = {
      ...budget.toObject(),
      spentAmount,
      percentage: Math.round(percentage * 100) / 100,
      remainingAmount: budget.budgetAmount - spentAmount,
      isOverBudget: spentAmount > budget.budgetAmount,
      isNearLimit: percentage >= budget.alertThreshold
    };

    res.json({
      success: true,
      data: budgetWithSpent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
router.post('/', protect, [
  body('category', 'Category is required').not().isEmpty(),
  body('budgetAmount', 'Budget amount must be a positive number').isFloat({ min: 0.01 }),
  body('period', 'Period must be monthly, weekly, or yearly').isIn(['monthly', 'weekly', 'yearly']),
  body('startDate', 'Start date is required').isISO8601(),
  body('endDate', 'End date is required').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, budgetAmount, period, startDate, endDate, alertThreshold } = req.body;

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      user: req.user.id,
      category,
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    });

    if (existingBudget) {
      return res.status(400).json({ message: 'Budget already exists for this category and period' });
    }

    const budget = await Budget.create({
      user: req.user.id,
      category,
      budgetAmount,
      period,
      startDate,
      endDate,
      alertThreshold: alertThreshold || 80
    });

    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
router.put('/:id', protect, [
  body('category', 'Category is required').not().isEmpty(),
  body('budgetAmount', 'Budget amount must be a positive number').isFloat({ min: 0.01 }),
  body('period', 'Period must be monthly, weekly, or yearly').isIn(['monthly', 'weekly', 'yearly']),
  body('startDate', 'Start date is required').isISO8601(),
  body('endDate', 'End date is required').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const { category, budgetAmount, period, startDate, endDate, alertThreshold, isActive } = req.body;

    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      { category, budgetAmount, period, startDate, endDate, alertThreshold, isActive },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get budget alerts
// @route   GET /api/budgets/alerts
// @access  Private
router.get('/alerts/check', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ 
      user: req.user.id, 
      isActive: true,
      endDate: { $gte: new Date() }
    });

    const alerts = [];

    for (const budget of budgets) {
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: req.user.id,
            type: 'expense',
            category: budget.category,
            date: {
              $gte: budget.startDate,
              $lte: budget.endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const spentAmount = spent.length > 0 ? spent[0].total : 0;
      const percentage = budget.budgetAmount > 0 ? (spentAmount / budget.budgetAmount) * 100 : 0;

      if (percentage >= budget.alertThreshold) {
        alerts.push({
          budgetId: budget._id,
          category: budget.category,
          budgetAmount: budget.budgetAmount,
          spentAmount,
          percentage: Math.round(percentage * 100) / 100,
          isOverBudget: spentAmount > budget.budgetAmount,
          message: spentAmount > budget.budgetAmount 
            ? `You've exceeded your ${budget.category} budget by $${(spentAmount - budget.budgetAmount).toFixed(2)}`
            : `You've used ${Math.round(percentage)}% of your ${budget.category} budget`
        });
      }
    }

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
