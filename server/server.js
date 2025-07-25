import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import rateRoutes from './routes/rates.js';
import inventoryRoutes from './routes/inventory.js';
import supplierRoutes from './routes/suppliers.js';
import staffRoutes from './routes/staff.js';
import customerRoutes from './routes/customers.js';
import businessRoutes from './routes/business.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  // Add your Vercel domain here when you get it
  // 'https://your-app-name.vercel.app'
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
      '/api/customers'
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

// Export the app for Vercel serverless functions
export default app;

// Start server only in development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;

  // Try to start the server, and if port 5000 is in use, try port 5001
  const startServer = (port) => {
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📍 API available at http://localhost:${port}/api`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE' && port === 5000) {
        console.log(`⚠️ Port ${port} is already in use, trying port 5001...`);
        startServer(5001);
      } else {
        console.error('❌ Server error:', err);
      }
    });
  };

  startServer(PORT);
}