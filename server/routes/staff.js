import express from 'express';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all staff for a user or business
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // If user is part of a business, get all staff for that business
    if (req.businessCode) {
      // Find all users in this business
      const usersInBusiness = await User.find({ 'business.businessCode': req.businessCode });
      const userIds = usersInBusiness.map(user => user._id.toString());

      // Get staff from all users in this business
      query.userId = { $in: userIds };

      console.log(`Getting staff for business ${req.businessCode} with ${userIds.length} users`);
    } else {
      // Just get staff for this user
      query.userId = req.userId;
    }

    const staff = await Staff.find(query).sort({ createdAt: -1 });
    console.log(`Found ${staff.length} staff members for query:`, query);

    // Transform _id to id for frontend compatibility
    const transformedStaff = staff.map(s => {
      const staffObj = s.toObject();
      return {
        ...staffObj,
        id: s._id.toString(),
        _id: s._id.toString() // Keep both for compatibility
      };
    });

    res.json(transformedStaff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new staff member
router.post('/', auth, async (req, res) => {
  try {
    const staffData = req.body;
    staffData.userId = req.userId;

    console.log('Creating staff with data:', staffData);

    // Create staff member
    const staff = new Staff(staffData);
    await staff.save();

    console.log('Staff member created successfully:', staff._id);

    // Transform _id to id for frontend compatibility
    const staffObj = staff.toObject();
    const transformedStaff = {
      ...staffObj,
      id: staff._id.toString(),
      _id: staff._id.toString() // Keep both for compatibility
    };

    res.status(201).json(transformedStaff);
  } catch (error) {
    console.error('Create staff error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Staff ID already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update staff member
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Update staff request - ID:', req.params.id, 'Data:', req.body);

    // Validate ObjectId format
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Invalid staff ID format' });
    }

    // Allow business owners or staff with update permission to update any staff in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own staff
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const staff = await Staff.findOne(query);
    if (!staff) {
      console.log('Staff not found with query:', query);
      return res.status(404).json({ message: 'Staff member not found or you do not have permission to update it' });
    }

    console.log('Updating staff:', staff._id, 'with data:', req.body);

    // Update staff
    Object.assign(staff, req.body);
    await staff.save();

    console.log('Staff member updated successfully');

    // Transform _id to id for frontend compatibility
    const staffObj = staff.toObject();
    const transformedStaff = {
      ...staffObj,
      id: staff._id.toString(),
      _id: staff._id.toString() // Keep both for compatibility
    };

    res.json(transformedStaff);
  } catch (error) {
    console.error('Update staff error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Staff ID already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Assign role to staff member
router.put('/:id/role', auth, async (req, res) => {
  try {
    const { role, roleCode, permissions } = req.body;

    let query = { _id: req.params.id };

    // If not a business owner, restrict to own staff
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const staff = await Staff.findOne(query);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found or you do not have permission to update it' });
    }

    console.log('Assigning role to staff:', staff._id, 'role:', role);

    // Update role and permissions
    staff.role = role || '';
    staff.roleCode = roleCode || '';
    staff.permissions = permissions || [];
    await staff.save();

    console.log('Role assigned successfully');

    // Transform _id to id for frontend compatibility
    const staffObj = staff.toObject();
    const transformedStaff = {
      ...staffObj,
      id: staff._id.toString(),
      _id: staff._id.toString() // Keep both for compatibility
    };

    res.json(transformedStaff);
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete staff member
router.delete('/:id', auth, async (req, res) => {
  try {
    // Allow business owners or staff with delete permission to delete any staff in the business
    let query = { _id: req.params.id };

    // If not a business owner, restrict to own staff
    if (!req.isBusinessOwner) {
      query.userId = req.userId;
    }

    const staff = await Staff.findOne(query);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found or you do not have permission to delete it' });
    }

    console.log('Deleting staff:', staff._id);

    await Staff.findByIdAndDelete(req.params.id);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to test staff data structure
router.get('/debug', auth, async (req, res) => {
  try {
    const staff = await Staff.find({ userId: req.userId }).limit(1);
    res.json({
      message: 'Debug info',
      sampleStaff: staff[0] ? {
        original: staff[0],
        transformed: {
          ...staff[0].toObject(),
          id: staff[0]._id.toString(),
          _id: staff[0]._id.toString()
        }
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;