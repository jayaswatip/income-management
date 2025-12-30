const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { user: req.user.id };
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
router.post('/', protect, [
  body('title', 'Title is required').not().isEmpty(),
  body('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  body('type', 'Type must be income or expense').isIn(['income', 'expense']),
  body('category', 'Category is required').not().isEmpty(),
  body('date', 'Date is required').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, amount, type, category, description, date } = req.body;

    const transaction = await Transaction.create({
      user: req.user.id,
      title,
      amount,
      type,
      category,
      description,
      date
    });

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
router.put('/:id', protect, [
  body('title', 'Title is required').not().isEmpty(),
  body('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  body('type', 'Type must be income or expense').isIn(['income', 'expense']),
  body('category', 'Category is required').not().isEmpty(),
  body('date', 'Date is required').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { title, amount, type, category, description, date } = req.body;

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { title, amount, type, category, description, date },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { user: req.user.id };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Transaction.aggregate([
      { $match: { ...filter, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats,
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
