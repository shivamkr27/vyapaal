import mongoose from 'mongoose';

const businessRoleSchema = new mongoose.Schema({
  id: String,
  roleName: String,
  permissions: [{
    module: { type: String, enum: ['dashboard', 'orders', 'inventory', 'staff', 'rates', 'suppliers', 'customers'] },
    actions: [{ type: String, enum: ['read', 'create', 'update', 'delete'] }]
  }],
  roleCode: String,
  createdAt: Date
});

const businessStaffSchema = new mongoose.Schema({
  id: String,
  staffId: String,
  name: String,
  email: String,
  phone: String,
  role: String,
  salary: {
    type: Number,
    default: 0
  },
  permissions: [{
    module: { type: String, enum: ['dashboard', 'orders', 'inventory', 'staff', 'rates', 'suppliers', 'customers'] },
    actions: [{ type: String, enum: ['read', 'create', 'update', 'delete'] }]
  }],
  joinedAt: Date,
  isActive: Boolean
});

const businessSchema = new mongoose.Schema({
  businessCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  ownerEmail: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staff: [businessStaffSchema],
  roles: [businessRoleSchema]
}, {
  timestamps: true
});

export default mongoose.model('Business', businessSchema);