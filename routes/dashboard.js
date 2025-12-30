const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get total income and expenses
    const totals = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const income = totals.find(t => t._id === 'income')?.total || 0;
    const expenses = totals.find(t => t._id === 'expense')?.total || 0;
    const balance = income - expenses;

    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(5);

    // Get category breakdown for expenses
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // Get monthly trend (last 6 months)
    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id,
          date: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get active budgets with progress
    const activeBudgets = await Budget.find({
      user: req.user.id,
      isActive: true,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    }).limit(3);

    const budgetsWithProgress = await Promise.all(
      activeBudgets.map(async (budget) => {
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
          _id: budget._id,
          category: budget.category,
          budgetAmount: budget.budgetAmount,
          spentAmount,
          percentage: Math.round(percentage * 100) / 100,
          isOverBudget: spentAmount > budget.budgetAmount
        };
      })
    );

    res.json({
      success: true,
      data: {
        summary: {
          income,
          expenses,
          balance,
          period
        },
        recentTransactions,
        categoryBreakdown,
        monthlyTrend,
        budgets: budgetsWithProgress
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get financial insights
// @route   GET /api/dashboard/insights
// @access  Private
router.get('/insights', protect, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month vs last month comparison
    const currentMonthData = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const lastMonthData = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: lastMonth, $lte: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const currentIncome = currentMonthData.find(d => d._id === 'income')?.total || 0;
    const currentExpenses = currentMonthData.find(d => d._id === 'expense')?.total || 0;
    const lastIncome = lastMonthData.find(d => d._id === 'income')?.total || 0;
    const lastExpenses = lastMonthData.find(d => d._id === 'expense')?.total || 0;

    // Calculate percentage changes
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;

    // Top spending categories this month
    const topCategories = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id,
          type: 'expense',
          date: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 3 }
    ]);

    // Savings rate
    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;

    // Budget alerts
    const budgetAlerts = await Budget.find({
      user: req.user.id,
      isActive: true,
      endDate: { $gte: now }
    });

    let alertCount = 0;
    for (const budget of budgetAlerts) {
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
        alertCount++;
      }
    }

    const insights = [];

    // Generate insights based on data
    if (incomeChange > 10) {
      insights.push({
        type: 'positive',
        title: 'Income Growth',
        message: `Your income increased by ${incomeChange.toFixed(1)}% compared to last month!`
      });
    }

    if (expenseChange > 20) {
      insights.push({
        type: 'warning',
        title: 'Spending Alert',
        message: `Your expenses increased by ${expenseChange.toFixed(1)}% compared to last month.`
      });
    }

    if (savingsRate > 20) {
      insights.push({
        type: 'positive',
        title: 'Great Savings',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income this month!`
      });
    } else if (savingsRate < 0) {
      insights.push({
        type: 'warning',
        title: 'Overspending',
        message: 'You\'re spending more than you earn this month. Consider reviewing your expenses.'
      });
    }

    if (alertCount > 0) {
      insights.push({
        type: 'info',
        title: 'Budget Alerts',
        message: `You have ${alertCount} budget(s) that need attention.`
      });
    }

    res.json({
      success: true,
      data: {
        comparison: {
          income: { current: currentIncome, last: lastIncome, change: incomeChange },
          expenses: { current: currentExpenses, last: lastExpenses, change: expenseChange }
        },
        topCategories,
        savingsRate: Math.round(savingsRate * 100) / 100,
        budgetAlerts: alertCount,
        insights
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
