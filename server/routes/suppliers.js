import express from 'express';
import Supplier from '../models/Supplier.js';
import Inventory from '../models/Inventory.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all suppliers for a user or business
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // If user is part of a business, get all suppliers for that business
    if (req.businessCode) {
      // Find all users in this business
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());

      // Get suppliers from all users in this business
      query.userId = { $in: userIds };

      console.log(`Getting suppliers for business ${req.businessCode} with ${userIds.length} users`);
    } else {
      // Just get suppliers for this user
      query.userId = req.userId;
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    console.log(`Found ${suppliers.length} suppliers for query:`, query);

    // Transform _id to id for frontend compatibility
    const transformedSuppliers = suppliers.map(s => ({
      ...s.toObject(),
      id: s._id.toString()
    }));

    res.json(transformedSuppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new supplier entry
router.post('/', auth, async (req, res) => {
  try {
    const supplierData = req.body;
    supplierData.userId = req.userId;

    console.log('Creating supplier with data:', supplierData);

    // Create supplier entry
    const supplier = new Supplier(supplierData);
    await supplier.save();

    // Update inventory - add the supplied quantity to existing inventory
    let inventoryQuery = {
      item: supplierData.item,
      category: supplierData.category
    };

    // If user is part of a business, find inventory from any user in the business
    if (req.businessCode) {
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());
      inventoryQuery.userId = { $in: userIds };
    } else {
      inventoryQuery.userId = req.userId;
    }

    let inventoryItem = await Inventory.findOne(inventoryQuery);

    if (inventoryItem) {
      // Update existing inventory
      inventoryItem.quantity += supplierData.quantity;
      await inventoryItem.save();
      console.log(`Updated existing inventory for ${supplierData.item}: ${inventoryItem.quantity} total`);
    } else {
      // Create new inventory item
      const newInventoryItem = new Inventory({
        userId: req.userId,
        item: supplierData.item,
        category: supplierData.category,
        quantity: supplierData.quantity,
        threshold: 10 // Default threshold
      });
      await newInventoryItem.save();
      console.log(`Created new inventory item for ${supplierData.item}: ${supplierData.quantity} units`);
    }

    // Transform _id to id for frontend compatibility
    const transformedSupplier = {
      ...supplier.toObject(),
      id: supplier._id.toString()
    };

    res.status(201).json(transformedSupplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update supplier entry
router.put('/:id', auth, async (req, res) => {
  try {
    // Allow business owners or staff with update permission to update any supplier in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own suppliers
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const supplier = await Supplier.findOne(query);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier entry not found or you do not have permission to update it' });
    }

    console.log('Updating supplier:', supplier._id, 'with data:', req.body);

    // Calculate the difference in quantity to update inventory
    const oldQuantity = supplier.quantity;
    const newQuantity = req.body.quantity;
    const quantityDifference = newQuantity - oldQuantity;

    // Update supplier
    Object.assign(supplier, req.body);
    await supplier.save();

    // Update inventory if quantity changed
    if (quantityDifference !== 0) {
      let inventoryQuery = {
        item: supplier.item,
        category: supplier.category
      };

      if (req.businessCode) {
        const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
        const userIds = usersInBusiness.map(user => user._id.toString());
        inventoryQuery.userId = { $in: userIds };
      } else {
        inventoryQuery.userId = supplier.userId;
      }

      const inventoryItem = await Inventory.findOne(inventoryQuery);
      if (inventoryItem) {
        inventoryItem.quantity += quantityDifference;
        await inventoryItem.save();
        console.log(`Updated inventory for ${supplier.item}: ${inventoryItem.quantity} total (${quantityDifference > 0 ? '+' : ''}${quantityDifference})`);
      }
    }

    // Transform _id to id for frontend compatibility
    const transformedSupplier = {
      ...supplier.toObject(),
      id: supplier._id.toString()
    };

    res.json(transformedSupplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete supplier entry
router.delete('/:id', auth, async (req, res) => {
  try {
    // Allow business owners or staff with delete permission to delete any supplier in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own suppliers
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const supplier = await Supplier.findOne(query);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier entry not found or you do not have permission to delete it' });
    }

    console.log('Deleting supplier:', supplier._id);

    // Remove the supplier quantity from inventory
    let inventoryQuery = {
      item: supplier.item,
      category: supplier.category
    };

    if (req.businessCode) {
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());
      inventoryQuery.userId = { $in: userIds };
    } else {
      inventoryQuery.userId = supplier.userId;
    }

    const inventoryItem = await Inventory.findOne(inventoryQuery);
    if (inventoryItem) {
      inventoryItem.quantity = Math.max(0, inventoryItem.quantity - supplier.quantity);
      await inventoryItem.save();
      console.log(`Updated inventory for ${supplier.item}: ${inventoryItem.quantity} remaining after removing supplier quantity`);
    }

    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier entry deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;