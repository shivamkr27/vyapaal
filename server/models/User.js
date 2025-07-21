import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  business: {
    id: String,
    businessName: String,
    businessCode: String,
    isBusinessOwner: { type: Boolean, default: false }
  },
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: false },
    language: { type: String, default: 'en' }
  },
  alerts: [
    {
      id: String,
      type: String,
      message: String,
      timestamp: Date,
      read: { type: Boolean, default: false }
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);