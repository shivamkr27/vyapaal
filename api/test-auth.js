export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Auth test endpoint working!',
      timestamp: new Date().toISOString(),
      endpoints: {
        register: '/api/auth/register',
        login: '/api/auth/login'
      }
    });
  }

  if (req.method === 'POST') {
    return res.status(200).json({
      message: 'POST request received',
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
};