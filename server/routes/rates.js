import express from 'express';
import Rate from '../models/Rate.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all rates for a user or business
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // If user is part of a business, get all rates for that business
    if (req.businessCode) {
      // Find all users in this business
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());

      // Get rates from all users in this business
      query.userId = { $in: userIds };

      console.log(`Getting rates for business ${req.businessCode} with ${userIds.length} users`);
    } else {
      // Just get rates for this user
      query.userId = req.userId;
    }

    const rates = await Rate.find(query).sort({ createdAt: -1 });
    console.log(`Found ${rates.length} rates for query:`, query);
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
    // Allow business owners or staff with update permission to update any rate in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own rates
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const rate = await Rate.findOne(query);
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found or you do not have permission to update it' });
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
    // Allow business owners or staff with delete permission to delete any rate in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own rates
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const rate = await Rate.findOne(query);
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found or you do not have permission to delete it' });
    }

    await Rate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rate deleted successfully' });
  } catch (error) {
    console.error('Delete rate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;