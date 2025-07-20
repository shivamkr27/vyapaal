import express from 'express';
import Rate from '../models/Rate.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all rates for a user
router.get('/', auth, async (req, res) => {
  try {
    const rates = await Rate.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(rates);
  } catch (error) {
    console.error('Get rates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new rate
router.post('/', auth, async (req, res) => {
  try {
    const rateData = req.body;
    rateData.userId = req.userId;

    const rate = new Rate(rateData);
    await rate.save();

    res.status(201).json(rate);
  } catch (error) {
    console.error('Create rate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update rate
router.put('/:id', auth, async (req, res) => {
  try {
    const rate = await Rate.findOne({ _id: req.params.id, userId: req.userId });
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    Object.assign(rate, req.body);
    await rate.save();

    res.json(rate);
  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete rate
router.delete('/:id', auth, async (req, res) => {
  try {
    const rate = await Rate.findOne({ _id: req.params.id, userId: req.userId });
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    await Rate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rate deleted successfully' });
  } catch (error) {
    console.error('Delete rate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;