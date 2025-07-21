export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Mock data for testing
    const mockInventory = [
      {
        id: '1',
        item: 'Product A',
        category: 'Electronics',
        quantity: 50,
        unit: 'pieces',
        minStock: 10,
        maxStock: 100,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        item: 'Product B',
        category: 'Clothing',
        quantity: 25,
        unit: 'pieces',
        minStock: 5,
        maxStock: 50,
        createdAt: new Date().toISOString()
      }
    ];

    switch (req.method) {
      case 'GET':
        return res.json(mockInventory);

      case 'POST':
        const newItem = {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date().toISOString()
        };
        return res.status(201).json(newItem);

      case 'PUT':
        const updateId = req.url.split('/').pop();
        const updatedItem = {
          id: updateId,
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.json(updatedItem);

      case 'DELETE':
        const deleteId = req.url.split('/').pop();
        return res.json({ message: 'Inventory item deleted', id: deleteId });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory API error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}