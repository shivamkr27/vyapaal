module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Mock data for testing
    const mockOrders = [
      {
        id: '1',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        item: 'Product A',
        category: 'Electronics',
        quantity: 2,
        rate: 500,
        totalAmount: 1000,
        paid: 500,
        due: 500,
        deliveryDate: '2025-01-25',
        createdAt: new Date().toISOString()
      }
    ];

    switch (req.method) {
      case 'GET':
        return res.json(mockOrders);

      case 'POST':
        const newOrder = {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date().toISOString()
        };
        return res.status(201).json(newOrder);

      case 'PUT':
        // Extract ID from URL path
        const updateId = req.url.split('/').pop();
        const updatedOrder = {
          id: updateId,
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.json(updatedOrder);

      case 'DELETE':
        const deleteId = req.url.split('/').pop();
        return res.json({ message: 'Order deleted', id: deleteId });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}