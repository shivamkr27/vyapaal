module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Mock data for testing
    const mockRates = [
      {
        id: '1',
        item: 'Product A',
        category: 'Electronics',
        rate: 500,
        unit: 'piece',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        item: 'Product B',
        category: 'Clothing',
        rate: 250,
        unit: 'piece',
        createdAt: new Date().toISOString()
      }
    ];

    switch (req.method) {
      case 'GET':
        return res.json(mockRates);

      case 'POST':
        const newRate = {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date().toISOString()
        };
        return res.status(201).json(newRate);

      case 'PUT':
        const updateId = req.url.split('/').pop();
        const updatedRate = {
          id: updateId,
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.json(updatedRate);

      case 'DELETE':
        const deleteId = req.url.split('/').pop();
        return res.json({ message: 'Rate deleted', id: deleteId });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Rates API error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}