module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET request for testing
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Register endpoint is working',
      method: 'POST',
      endpoint: '/api/register'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: `Method ${req.method} not allowed. Use POST.` });
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // For now, return a mock successful response to test the connection
    // We'll add MongoDB later once the basic connection works
    const mockUser = {
      id: Date.now().toString(),
      name,
      email,
      createdAt: new Date().toISOString()
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    return res.status(201).json({
      token: mockToken,
      user: mockUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}