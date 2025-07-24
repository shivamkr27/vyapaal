import express from 'express';
import Inventory from '../models/Inventory.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all inventory for a user or business
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // If user is part of a business, get all inventory for that business
    if (req.businessCode) {
      // Find all users in this business
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());

      // Get inventory from all users in this business
      query.userId = { $in: userIds };

      console.log(`Getting inventory for business ${req.businessCode} with ${userIds.length} users`);
    } else {
      // Just get inventory for this user
      query.userId = req.userId;
    }

    const inventory = await Inventory.find(query).sort({ createdAt: -1 });
    console.log(`Found ${inventory.length} inventory items for query:`, query);
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new inventory item
router.post('/', auth, async (req, res) => {
  try {
    const inventoryData = req.body;
    inventoryData.userId = req.userId;

    const inventoryItem = new Inventory(inventoryData);
    await inventoryItem.save();

    res.status(201).json(inventoryItem);
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update inventory item
router.put('/:id', auth, async (req, res) => {
  try {
    // Allow business owners or staff with update permission to update any inventory in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own inventory
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const inventoryItem = await Inventory.findOne(query);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found or you do not have permission to update it' });
    }

    Object.assign(inventoryItem, req.body);
    await inventoryItem.save();

    res.json(inventoryItem);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete inventory item
router.delete('/:id', auth, async (req, res) => {
  try {
    // Allow business owners or staff with delete permission to delete any inventory in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own inventory
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const inventoryItem = await Inventory.findOne(query);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found or you do not have permission to delete it' });
    }

    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;