import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  threshold: {
    type: Number,
    required: true,
    min: 0,
    default: 5
  }
}, {
  timestamps: true
});

// Compound index to ensure unique item-category combination per user
inventorySchema.index({ userId: 1, item: 1, category: 1 }, { unique: true });

export default mongoose.model('Inventory', inventorySchema);