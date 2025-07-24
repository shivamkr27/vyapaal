import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import '../models/Business.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
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
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user business
router.put('/business', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { businessName, businessCode, isBusinessOwner } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Import Business model
    const Business = mongoose.model('Business');

    // Create default permissions for owner
    const ownerPermissions = [
      { module: 'dashboard', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'orders', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'inventory', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'staff', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'rates', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'suppliers', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'customers', actions: ['read', 'create', 'update', 'delete'] }
    ];

    // Update user with business info
    user.business = {
      id: Date.now().toString(),
      businessName,
      businessCode,
      isBusinessOwner,
      role: isBusinessOwner ? 'Business Owner' : '',
      permissions: isBusinessOwner ? ownerPermissions : []
    };

    await user.save();

    // If creating a new business, create a Business record
    if (isBusinessOwner) {
      // Generate role codes for different roles
      const generateRoleCode = (businessCode, roleName) => {
        const rolePrefix = roleName.substring(0, 3).toUpperCase();
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${businessCode}-${rolePrefix}${randomSuffix}`;
      };

      // Create default roles
      const defaultRoles = [
        {
          id: 'role_owner',
          roleName: 'Business Owner',
          permissions: ownerPermissions,
          roleCode: generateRoleCode(businessCode, 'Owner'),
          createdAt: new Date()
        },
        {
          id: 'role_manager',
          roleName: 'Manager',
          permissions: [
            { module: 'dashboard', actions: ['read'] },
            { module: 'orders', actions: ['read', 'create', 'update'] },
            { module: 'inventory', actions: ['read', 'create', 'update'] },
            { module: 'staff', actions: ['read'] },
            { module: 'rates', actions: ['read', 'update'] },
            { module: 'suppliers', actions: ['read', 'create', 'update'] },
            { module: 'customers', actions: ['read', 'create', 'update'] }
          ],
          roleCode: generateRoleCode(businessCode, 'Manager'),
          createdAt: new Date()
        },
        {
          id: 'role_accountant',
          roleName: 'Accountant',
          permissions: [
            { module: 'dashboard', actions: ['read'] },
            { module: 'orders', actions: ['read', 'update'] },
            { module: 'inventory', actions: ['read'] },
            { module: 'rates', actions: ['read'] },
            { module: 'suppliers', actions: ['read', 'create', 'update'] },
            { module: 'customers', actions: ['read'] }
          ],
          roleCode: generateRoleCode(businessCode, 'Accountant'),
          createdAt: new Date()
        }
      ];

      // Create business record
      const business = new Business({
        businessCode,
        businessName,
        ownerEmail: user.email,
        ownerId: user._id,
        staff: [],
        roles: defaultRoles
      });

      await business.save();
    }

    res.json({
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
    console.error('Business setup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { theme, notifications, language } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.preferences = { theme, notifications, language };
    await user.save();

    res.json({ message: 'Preferences updated', preferences: user.preferences });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add alert
router.post('/alerts', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { type, message } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAlert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      read: false
    };

    user.alerts.unshift(newAlert);
    user.alerts = user.alerts.slice(0, 50); // Keep only last 50 alerts
    await user.save();

    res.json({ alert: newAlert });
  } catch (error) {
    console.error('Add alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear alerts
router.delete('/alerts', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.alerts = [];
    await user.save();

    res.json({ message: 'Alerts cleared' });
  } catch (error) {
    console.error('Clear alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token and get current user
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      try {
        const user = await User.findById(decoded.userId);

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Return user data with token
        res.json({
          token, // Return the token back to ensure it's stored properly
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            business: user.business || null,
            preferences: user.preferences || { theme: 'light', notifications: false, language: 'en' },
            alerts: user.alerts || []
          }
        });
      } catch (dbError) {
        console.error('Database error during token verification:', dbError);
        return res.status(500).json({ message: 'Database error' });
      }
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Join business with role code
router.post('/business/join', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { businessCode, roleCode, phone } = req.body;

    // Find the user
    const user = await User.findById(decoded.userId);
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

export default router;