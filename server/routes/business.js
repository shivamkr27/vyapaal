import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import '../models/Business.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get business details
router.get('/details', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.business || !user.business.businessCode) {
      // If user has no business, return empty business object
      return res.json({
        business: {
          staff: [],
          roles: []
        }
      });
    }

    // Get business details
    const Business = mongoose.model('Business');
    const business = await Business.findOne({ businessCode: user.business.businessCode });

    if (!business) {
      // Create a new business record if it doesn't exist
      const newBusiness = new Business({
        businessCode: user.business.businessCode,
        businessName: user.business.businessName,
        ownerEmail: user.email,
        ownerId: user._id,
        staff: [],
        roles: []
      });

      await newBusiness.save();
      console.log(`Created new business: ${user.business.businessName} (${user.business.businessCode})`);
      return res.json({ business: newBusiness });
    }

    // If the user is not the business owner, ensure their permissions are correctly set
    if (!user.business.isBusinessOwner) {
      // Find the staff member in the business
      const staffMember = business.staff.find(s => s.email === user.email);

      if (staffMember) {
        // Update the user's business object with the correct permissions
        user.business.permissions = staffMember.permissions;
        user.business.role = staffMember.role;

        // Save the updated user
        await user.save();

        console.log(`Updated user ${user.email} with role ${staffMember.role} and permissions:`,
          staffMember.permissions);
      } else {
        console.log(`User ${user.email} not found in business staff list`);
      }
    }

    console.log(`Returning business details for ${business.businessName} with ${business.staff.length} staff members and ${business.roles.length} roles`);
    res.json({ business });
  } catch (error) {
    console.error('Get business details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join business with role code
router.post('/join', auth, async (req, res) => {
  try {
    const { businessCode, roleCode, phone } = req.body;

    // Find the user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Import Business model
    const Business = mongoose.model('Business');

    // Find the business by business code
    const business = await Business.findOne({ businessCode });
    if (!business) {
      return res.status(404).json({ message: 'Business not found with this code' });
    }

    // Find the role by role code
    const role = business.roles.find(r => r.roleCode === roleCode);
    if (!role) {
      return res.status(404).json({ message: 'Invalid role code' });
    }

    // Check if user is already part of this business
    const existingStaff = business.staff.find(s => s.email === user.email);
    if (existingStaff) {
      // If user is already part of this business, update their permissions
      // This ensures that if they're trying to join again, they get the correct permissions
      user.business = {
        id: business._id.toString(),
        businessName: business.businessName,
        businessCode: business.businessCode,
        isBusinessOwner: false,
        role: existingStaff.role,
        permissions: existingStaff.permissions
      };

      await user.save();

      return res.json({
        message: 'You are already part of this business. Your permissions have been updated.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          business: user.business,
          preferences: user.preferences,
          alerts: user.alerts
        }
      });
    }

    // Generate staff ID
    const staffCount = business.staff.length + 1;
    const staffId = `${businessCode}${staffCount.toString().padStart(3, '0')}`;

    // Add user to business staff
    const newStaff = {
      id: Date.now().toString(),
      staffId,
      name: user.name,
      email: user.email,
      phone,
      role: role.roleName,
      permissions: role.permissions,
      salary: 0, // Default salary
      joinedAt: new Date(),
      isActive: true
    };

    business.staff.push(newStaff);
    await business.save();

    // Update user with business info
    user.business = {
      id: business._id.toString(),
      businessName: business.businessName,
      businessCode: business.businessCode,
      isBusinessOwner: false,
      role: role.roleName,
      permissions: role.permissions
    };

    await user.save();

    console.log(`User ${user.email} joined business ${business.businessName} with role ${role.roleName} and permissions:`, role.permissions);

    res.json({
      message: 'Successfully joined business',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        business: user.business,
        preferences: user.preferences,
        alerts: user.alerts
      }
    });
  } catch (error) {
    console.error('Join business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update role
router.post('/roles', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.business || !user.business.isBusinessOwner) {
      return res.status(403).json({ message: 'Only business owners can manage roles' });
    }

    const { id, roleName, permissions } = req.body;

    // Get business
    const Business = mongoose.model('Business');
    const business = await Business.findOne({ businessCode: user.business.businessCode });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (id) {
      // Update existing role
      const roleIndex = business.roles.findIndex(r => r.id === id);
      if (roleIndex === -1) {
        return res.status(404).json({ message: 'Role not found' });
      }

      business.roles[roleIndex].roleName = roleName;
      business.roles[roleIndex].permissions = permissions;
    } else {
      // Create new role
      const generateRoleCode = (businessCode, roleName) => {
        const rolePrefix = roleName.substring(0, 3).toUpperCase();
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${businessCode}-${rolePrefix}${randomSuffix}`;
      };

      const newRole = {
        id: `role_${Date.now()}`,
        roleName,
        permissions,
        roleCode: generateRoleCode(business.businessCode, roleName),
        createdAt: new Date()
      };

      business.roles.push(newRole);
    }

    await business.save();
    res.json({ business });
  } catch (error) {
    console.error('Create/update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete role
router.delete('/roles/:roleId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.business || !user.business.isBusinessOwner) {
      return res.status(403).json({ message: 'Only business owners can manage roles' });
    }

    const { roleId } = req.params;

    // Get business
    const Business = mongoose.model('Business');
    const business = await Business.findOne({ businessCode: user.business.businessCode });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if role is in use by any staff
    const isRoleInUse = business.staff.some(s => {
      const role = business.roles.find(r => r.id === roleId);
      return role && s.role === role.roleName;
    });

    if (isRoleInUse) {
      return res.status(400).json({ message: 'Cannot delete role that is assigned to staff members' });
    }

    // Check if it's a default role (first 6 roles)
    if (roleId.startsWith('role_') && business.roles.findIndex(r => r.id === roleId) < 6) {
      return res.status(400).json({ message: 'Cannot delete default roles' });
    }

    business.roles = business.roles.filter(r => r.id !== roleId);
    await business.save();

    res.json({ business });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add staff member
router.post('/staff', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const { name, email, phone, role, salary } = req.body;

    // Get business
    const Business = mongoose.model('Business');
    const business = await Business.findOne({ businessCode: user.business.businessCode });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if staff with this email already exists
    if (business.staff.some(s => s.email === email)) {
      return res.status(400).json({ message: 'Staff member with this email already exists' });
    }

    // Find role
    const selectedRole = business.roles.find(r => r.roleName === role);
    if (!selectedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Generate staff ID
    const staffCount = business.staff.length + 1;
    const staffId = `${business.businessCode}${staffCount.toString().padStart(3, '0')}`;

    // Add staff
    const newStaff = {
      id: `staff_${Date.now()}`,
      staffId,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@temp.com`, // Use temp email if not provided
      phone: phone || '',
      role,
      permissions: selectedRole.permissions,
      salary: Number(salary) || 0, // Ensure salary is a number
      joinedAt: new Date(),
      isActive: true
    };

    business.staff.push(newStaff);
    await business.save();

    res.json({ staff: newStaff, business });
  } catch (error) {
    console.error('Add staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update staff member (role, salary, etc.)
router.put('/staff/:staffId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.business || !user.business.isBusinessOwner) {
      return res.status(403).json({ message: 'Only business owners can update staff' });
    }

    const { staffId } = req.params;
    const { role, salary, name, phone } = req.body;

    console.log('Updating staff:', staffId, { role, salary, name, phone });

    // Get business
    const Business = mongoose.model('Business');
    const business = await Business.findOne({ businessCode: user.business.businessCode });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Find staff by ID - try both string and exact match
    let staffIndex = business.staff.findIndex(s => s.id === staffId);

    // If not found by exact match, try to find by string conversion
    if (staffIndex === -1) {
      staffIndex = business.staff.findIndex(s => String(s.id) === String(staffId));
    }

    // If still not found, try to find by staffId field
    if (staffIndex === -1) {
      staffIndex = business.staff.findIndex(s => s.staffId === staffId);
    }

    if (staffIndex === -1) {
      console.log('Staff not found by any ID method. Available staff:', business.staff.map(s => ({
        id: s.id,
        staffId: s.staffId,
        name: s.name
      })));
      console.log('Looking for staffId:', staffId);
      return res.status(404).json({ message: 'Staff member not found' });
    }

    console.log('Found staff at index:', staffIndex, business.staff[staffIndex]);

    // Update staff data
    if (role) {
      // Find role
      const selectedRole = business.roles.find(r => r.roleName === role);
      if (!selectedRole) {
        return res.status(404).json({ message: 'Role not found' });
      }
      business.staff[staffIndex].role = role;
      business.staff[staffIndex].permissions = selectedRole.permissions;
    }

    if (salary !== undefined && salary !== null) {
      business.staff[staffIndex].salary = Number(salary);
      console.log('Updated salary to:', business.staff[staffIndex].salary);
    }

    if (name) {
      business.staff[staffIndex].name = name;
    }

    if (phone) {
      business.staff[staffIndex].phone = phone;
    }

    // Mark the staff array as modified to ensure Mongoose saves it
    business.markModified('staff');
    await business.save();

    console.log('Staff updated successfully:', business.staff[staffIndex]);

    res.json({ staff: business.staff[staffIndex], business });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update staff role (legacy endpoint for backward compatibility)
router.put('/staff/:staffId/role', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.business || !user.business.isBusinessOwner) {
      return res.status(403).json({ message: 'Only business owners can update staff roles' });
    }

    const { staffId } = req.params;
    const { role } = req.body;

    // Get business
    const Business = mongoose.model('Business');
    const business = await Business.findOne({ businessCode: user.business.businessCode });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Find staff
    const staffIndex = business.staff.findIndex(s => s.id === staffId);
    if (staffIndex === -1) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Find role
    const selectedRole = business.roles.find(r => r.roleName === role);
    if (!selectedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Update staff role
    business.staff[staffIndex].role = role;
    business.staff[staffIndex].permissions = selectedRole.permissions;

    await business.save();

    res.json({ staff: business.staff[staffIndex], business });
  } catch (error) {
    console.error('Update staff role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove staff member
router.delete('/staff/:staffId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.business || !user.business.isBusinessOwner) {
      return res.status(403).json({ message: 'Only business owners can remove staff members' });
    }

    const { staffId } = req.params;

    // Get business
    const Business = mongoose.model('Business');
    const business = await Business.findOne({ businessCode: user.business.businessCode });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Remove staff
    business.staff = business.staff.filter(s => s.id !== staffId);
    await business.save();

    res.json({ message: 'Staff member removed successfully', business });
  } catch (error) {
    console.error('Remove staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;