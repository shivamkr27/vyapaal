import express from 'express';
import Inventory from '../models/Inventory.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all inventory for a user
router.get('/', auth, async (req, res) => {
  try {
    const inventory = await Inventory.find({ userId: req.userId }).sort({ createdAt: -1 });
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
    const inventoryItem = await Inventory.findOne({ _id: req.params.id, userId: req.userId });
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
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
    const inventoryItem = await Inventory.findOne({ _id: req.params.id, userId: req.userId });
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;