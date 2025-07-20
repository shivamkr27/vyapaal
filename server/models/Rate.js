import mongoose from 'mongoose';

const rateSchema = new mongoose.Schema({
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
  rate: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure unique item-category combination per user
rateSchema.index({ userId: 1, item: 1, category: 1 }, { unique: true });

export default mongoose.model('Rate', rateSchema);