module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Mock data for testing
    const mockCustomers = [
      {
        id: '1',
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        address: '123 Main St, City',
        totalOrders: 5,
        totalAmount: 2500,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Jane Smith',
        phone: '9876543211',
        email: 'jane@example.com',
        address: '456 Oak Ave, City',
        totalOrders: 3,
        totalAmount: 1800,
        createdAt: new Date().toISOString()
      }
    ];

    switch (req.method) {
      case 'GET':
        return res.json(mockCustomers);

      case 'POST':
        const newCustomer = {
          id: Date.now().toString(),
          ...req.body,
          totalOrders: 0,
          totalAmount: 0,
          createdAt: new Date().toISOString()
        };
        return res.status(201).json(newCustomer);

      case 'PUT':
        const updateId = req.url.split('/').pop();
        const updatedCustomer = {
          id: updateId,
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.json(updatedCustomer);

      case 'DELETE':
        const deleteId = req.url.split('/').pop();
        return res.json({ message: 'Customer deleted', id: deleteId });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Customers API error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}