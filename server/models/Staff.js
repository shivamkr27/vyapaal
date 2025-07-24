import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffId: {
    type: String,
    required: true,
    trim: true
  },
  staffName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  phoneNo: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    trim: true,
    default: '' // Allow empty role initially
  },
  roleCode: {
    type: String,
    trim: true,
    default: ''
  },
  permissions: [{
    module: {
      type: String,
      enum: ['orders', 'inventory', 'staff', 'rates', 'suppliers', 'customers', 'dashboard'],
      required: true
    },
    actions: [{
      type: String,
      enum: ['read', 'create', 'update', 'delete'],
      required: true
    }]
  }],
  joiningDate: {
    type: Date,
    required: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique staff ID per user
staffSchema.index({ userId: 1, staffId: 1 }, { unique: true });

export default mongoose.model('Staff', staffSchema);