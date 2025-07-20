import express from 'express';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import Customer from '../models/Customer.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all orders for a user
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query;
    let query = { userId: req.userId };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const orderData = req.body;
    orderData.userId = req.userId;

    // Check inventory availability
    const inventoryItem = await Inventory.findOne({
      userId: req.userId,
      item: orderData.item,
      category: orderData.category
    });

    if (!inventoryItem || inventoryItem.quantity < orderData.quantity) {
      return res.status(400).json({
        message: `Insufficient inventory. Available: ${inventoryItem ? inventoryItem.quantity : 0}`
      });
    }

    // Create order
    const order = new Order(orderData);
    await order.save();

    // Update inventory
    inventoryItem.quantity -= orderData.quantity;
    await inventoryItem.save();

    // Create/update customer
    await Customer.findOneAndUpdate(
      { userId: req.userId, phone: orderData.customerPhone },
      {
        userId: req.userId,
        name: orderData.customerName,
        phone: orderData.customerPhone
      },
      { upsert: true, new: true }
    );

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restore previous inventory
    const oldInventoryItem = await Inventory.findOne({
      userId: req.userId,
      item: order.item,
      category: order.category
    });
    if (oldInventoryItem) {
      oldInventoryItem.quantity += order.quantity;
      await oldInventoryItem.save();
    }

    // Check new inventory availability
    const newInventoryItem = await Inventory.findOne({
      userId: req.userId,
      item: req.body.item,
      category: req.body.category
    });

    if (!newInventoryItem || newInventoryItem.quantity < req.body.quantity) {
      return res.status(400).json({
        message: `Insufficient inventory. Available: ${newInventoryItem ? newInventoryItem.quantity : 0}`
      });
    }

    // Update order
    Object.assign(order, req.body);
    await order.save();

    // Update new inventory
    newInventoryItem.quantity -= req.body.quantity;
    await newInventoryItem.save();

    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restore inventory
    const inventoryItem = await Inventory.findOne({
      userId: req.userId,
      item: order.item,
      category: order.category
    });
    if (inventoryItem) {
      inventoryItem.quantity += order.quantity;
      await inventoryItem.save();
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;