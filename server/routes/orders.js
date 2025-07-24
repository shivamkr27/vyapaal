import express from 'express';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all orders for a user or business
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};

    // If user is part of a business, get all orders for that business
    if (req.businessCode) {
      // Find all users in this business
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());

      // Get orders from all users in this business
      query.userId = { $in: userIds };

      console.log(`Getting orders for business ${req.businessCode} with ${userIds.length} users`);
    } else {
      // Just get orders for this user
      query.userId = req.userId;
    }

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
    console.log(`Found ${orders.length} orders for query:`, query);
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

    console.log('Creating order with data:', orderData);

    // Handle multiple items if present
    const itemsToProcess = orderData.items && orderData.items.length > 0
      ? orderData.items
      : [{ item: orderData.item, category: orderData.category, quantity: orderData.quantity, rate: orderData.rate, amount: orderData.totalAmount }];

    // Check inventory availability for all items
    for (const item of itemsToProcess) {
      // Find inventory item for the business (not just the user)
      let inventoryQuery = { item: item.item, category: item.category };

      if (req.businessCode) {
        // Find all users in this business
        const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
        const userIds = usersInBusiness.map(user => user._id.toString());
        inventoryQuery.userId = { $in: userIds };
      } else {
        inventoryQuery.userId = req.userId;
      }

      const inventoryItem = await Inventory.findOne(inventoryQuery);

      if (!inventoryItem || inventoryItem.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient inventory for ${item.item} (${item.category}). Available: ${inventoryItem ? inventoryItem.quantity : 0}, Required: ${item.quantity}`
        });
      }
    }

    // If multiple items, create separate orders for each item
    const createdOrders = [];

    for (const item of itemsToProcess) {
      // Create individual order for each item
      const individualOrderData = {
        ...orderData,
        item: item.item,
        category: item.category,
        quantity: item.quantity,
        rate: item.rate,
        totalAmount: item.amount || (item.quantity * item.rate),
        // For multiple items, distribute payment proportionally
        paid: itemsToProcess.length > 1
          ? Math.round((orderData.paid * item.amount) / orderData.totalAmount)
          : orderData.paid,
        due: itemsToProcess.length > 1
          ? Math.round((orderData.due * item.amount) / orderData.totalAmount)
          : orderData.due
      };

      const order = new Order(individualOrderData);
      await order.save();
      createdOrders.push(order);

      // Update inventory
      let inventoryQuery = { item: item.item, category: item.category };

      if (req.businessCode) {
        // Find all users in this business
        const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
        const userIds = usersInBusiness.map(user => user._id.toString());
        inventoryQuery.userId = { $in: userIds };
      } else {
        inventoryQuery.userId = req.userId;
      }

      const inventoryItem = await Inventory.findOne(inventoryQuery);
      if (inventoryItem) {
        inventoryItem.quantity -= item.quantity;
        await inventoryItem.save();
        console.log(`Updated inventory for ${item.item}: ${inventoryItem.quantity} remaining`);
      }
    }

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

    console.log(`Created ${createdOrders.length} orders and updated inventory`);
    res.status(201).json(createdOrders.length === 1 ? createdOrders[0] : createdOrders);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order
router.put('/:id', auth, async (req, res) => {
  try {
    // Allow business owners or staff with update permission to update any order in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own orders
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found or you do not have permission to update it' });
    }

    console.log('Updating order:', order._id, 'with data:', req.body);

    // Restore previous inventory
    let oldInventoryQuery = { item: order.item, category: order.category };

    if (req.businessCode) {
      // Find all users in this business
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());
      oldInventoryQuery.userId = { $in: userIds };
    } else {
      oldInventoryQuery.userId = order.userId;
    }

    const oldInventoryItem = await Inventory.findOne(oldInventoryQuery);
    if (oldInventoryItem) {
      oldInventoryItem.quantity += order.quantity;
      await oldInventoryItem.save();
      console.log(`Restored ${order.quantity} units of ${order.item} to inventory`);
    }

    // Check new inventory availability
    let newInventoryQuery = { item: req.body.item, category: req.body.category };

    if (req.businessCode) {
      // Find all users in this business
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());
      newInventoryQuery.userId = { $in: userIds };
    } else {
      newInventoryQuery.userId = order.userId;
    }

    const newInventoryItem = await Inventory.findOne(newInventoryQuery);

    if (!newInventoryItem || newInventoryItem.quantity < req.body.quantity) {
      // Restore the old inventory since we can't complete the update
      if (oldInventoryItem) {
        oldInventoryItem.quantity -= order.quantity;
        await oldInventoryItem.save();
      }
      return res.status(400).json({
        message: `Insufficient inventory for ${req.body.item} (${req.body.category}). Available: ${newInventoryItem ? newInventoryItem.quantity : 0}, Required: ${req.body.quantity}`
      });
    }

    // Update order
    Object.assign(order, req.body);
    await order.save();

    // Update new inventory
    newInventoryItem.quantity -= req.body.quantity;
    await newInventoryItem.save();
    console.log(`Deducted ${req.body.quantity} units of ${req.body.item} from inventory`);

    console.log('Order updated successfully');
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    // Allow business owners or staff with delete permission to delete any order in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own orders
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found or you do not have permission to delete it' });
    }

    // Restore inventory
    const inventoryItem = await Inventory.findOne({
      userId: order.userId, // Use the original order's userId
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