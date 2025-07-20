export default function handler(req, res) {
  res.status(200).json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
}