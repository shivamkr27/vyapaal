// Catch-all API route for Vercel
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../server/config/database.js';

// Import routes
import authRoutes from '../server/routes/auth.js';
import orderRoutes from '../server/routes/orders.js';
import rateRoutes from '../server/routes/rates.js';
import inventoryRoutes from '../server/routes/inventory.js';
import supplierRoutes from '../server/routes/suppliers.js';
import staffRoutes from '../server/routes/staff.js';
import customerRoutes from '../server/routes/customers.js';
import businessRoutes from '../server/routes/business.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

// In production, allow the same domain
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rates', rateRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/business', businessRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: process.env.MONGODB_URI ? 'Connected' : 'Not configured',
    jwt: process.env.JWT_SECRET ? 'Configured' : 'Not configured'
  });
});

// Deployment test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Deployment test successful',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'Vercel' : 'Local',
    nodeVersion: process.version
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Vyapaal API is running',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/orders',
      '/api/rates',
      '/api/inventory',
      '/api/suppliers',
      '/api/staff',
      '/api/customers',
      '/api/business'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export as serverless function
export default app;