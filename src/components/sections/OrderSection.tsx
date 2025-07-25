import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Search, Edit, Trash2, Check, Clock, Download } from 'lucide-react';
import { Order, Rate, Inventory, User, Customer, Permission } from '../../types';
import OrderForm from '../forms/OrderForm';
import { exportToExcel, exportToPDF } from '../../utils/export';
import { useDataUserId, useDataSource } from '../UserDataProvider';
import apiService from '../../services/api';
import { hasPermission } from '../../utils/businessUtils';

interface OrderSectionProps {
  user: User;
  userPermissions?: Permission[];
}

const OrderSection: React.FC<OrderSectionProps> = ({ user, userPermissions = [] }) => {
  const dataUserId = useDataUserId();
  const { useApi } = useDataSource();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [dataUserId, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load data from MongoDB API only
      console.log('🔄 Loading data from MongoDB API...');
      const [ordersData, ratesData, inventoryData] = await Promise.all([
        apiService.getOrders(selectedDate),
        apiService.getRates(),
        apiService.getInventory()
      ]);

      setOrders(ordersData || []);
      setRates(ratesData || []);
      setInventory(inventoryData || []);

      console.log('✅ Loaded from API:', {
        orders: ordersData?.length || 0,
        rates: ratesData?.length || 0,
        inventory: inventoryData?.length || 0
      });
    } catch (error) {
      console.error('❌ Error loading data:', error);
      alert('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async (orderData: Omit<Order, 'id' | 'userId' | 'createdAt'>) => {
    try {
      // Save to MongoDB API only
      if (editingOrder && editingOrder.id) {
        // When editing, update the existing order
        await apiService.updateOrder(editingOrder.id, orderData);
      } else {
        // When creating new, create a new order
        await apiService.createOrder(orderData);
      }
      // Reload data after save
      await loadData();
      setShowForm(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order. Please try again.');
    }
  };

  // Customer records are now handled by the API automatically

  const handleDeleteOrder = async (order: Order) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        // Delete from MongoDB API only
        if (!order.id) {
          console.error('Cannot delete order: order.id is undefined');
          return;
        }
        await apiService.deleteOrder(order.id);
        // Reload data after delete
        await loadData();
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  const handleStatusToggle = async (order: Order) => {
    try {
      const newStatus: 'pending' | 'delivered' = order.status === 'pending' ? 'delivered' : 'pending';

      // Update status via MongoDB API only
      const updateData = {
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        item: order.item,
        category: order.category,
        quantity: order.quantity,
        rate: order.rate,
        totalAmount: order.totalAmount,
        paid: order.paid,
        due: order.due,
        deliveryDate: order.deliveryDate,
        status: newStatus
      };
      if (!order.id) {
        console.error('Cannot update order: order.id is undefined');
        return;
      }
      await apiService.updateOrder(order.id, updateData);
      // Reload data after update
      await loadData();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const filteredOrders = orders.filter(order => {
    // Skip orders with missing required fields
    if (!order || !order.createdAt) return false;

    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    const matchesDate = orderDate === selectedDate;

    const matchesSearch = searchTerm === '' ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customerPhone && order.customerPhone.includes(searchTerm)) ||
      (order.item && order.item.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.category && order.category.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesDate && matchesSearch;
  });

  // Group orders by customer to show multiple items
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const key = `${order.customerName}-${order.customerPhone}`;
    if (!acc[key]) {
      acc[key] = {
        customer: {
          name: order.customerName,
          phone: order.customerPhone
        },
        orders: [],
        totalAmount: 0,
        totalPaid: 0,
        totalDue: 0
      };
    }
    acc[key].orders.push(order);
    acc[key].totalAmount += order.totalAmount;
    acc[key].totalPaid += order.paid;
    acc[key].totalDue += order.due;
    return acc;
  }, {} as Record<string, {
    customer: { name: string; phone: string };
    orders: Order[];
    totalAmount: number;
    totalPaid: number;
    totalDue: number;
  }>);

  const groupedOrdersArray = Object.values(groupedOrders);

  const handleExport = (type: 'excel' | 'pdf') => {
    const exportData = filteredOrders.map(order => ({
      'Order ID': order.id || 'N/A',
      'Customer Name': order.customerName,
      'Customer Phone': order.customerPhone,
      'Item': order.item,
      'Category': order.category,
      'Quantity': order.quantity,
      'Rate': order.rate,
      'Total Amount': order.totalAmount,
      'Paid': order.paid,
      'Due': order.due,
      'Status': order.status,
      'Delivery Date': order.deliveryDate,
      'Created At': new Date(order.createdAt).toLocaleDateString('en-IN')
    }));

    if (type === 'excel') {
      exportToExcel(exportData, `Orders_${selectedDate}`);
    } else {
      exportToPDF(exportData, `Orders for ${selectedDate}`, `Orders_${selectedDate}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="glass-cream rounded-3xl shadow-elegant p-4 lg:p-8">
        <div className="flex flex-col space-y-4 lg:space-y-6">
          {/* Top Row - Date and Add Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 gap-4">
            <div className="flex items-center space-x-3 bg-white/60 rounded-xl px-4 py-3 shadow-warm w-full sm:w-auto">
              <Calendar className="h-5 w-5 text-amber-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700 font-medium w-full sm:w-auto"
              />
            </div>

            <button
              onClick={() => {
                setShowForm(true);
                setEditingOrder(null);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl flex items-center justify-center space-x-2 transition-elegant shadow-warm w-full sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Add Order</span>
            </button>
          </div>

          {/* Bottom Row - Export and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleExport('excel')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl flex items-center justify-center space-x-2 transition-elegant shadow-warm w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Excel</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl flex items-center justify-center space-x-2 transition-elegant shadow-warm w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">PDF</span>
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="glass-cream rounded-3xl shadow-elegant overflow-hidden">
          <div className="px-4 lg:px-8 py-6 border-b border-amber-200/50 bg-gradient-to-r from-amber-100/50 to-orange-100/50">
            <div className="flex items-center justify-between">
              <h4 className="text-xl lg:text-2xl font-display font-bold gradient-text-warm">Today's Orders</h4>
              {loading && (
                <div className="flex items-center space-x-2 text-amber-600">
                  <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-200/50">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Due</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Delivery</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-amber-200/30">
                {groupedOrdersArray.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-8 py-12 text-center text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-lg">
                        {searchTerm ? 'No orders found matching your search.' : 'No orders found for the selected date.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  groupedOrdersArray.map((group, groupIndex) => (
                    <React.Fragment key={`group-${groupIndex}`}>
                      {group.orders.map((order, orderIndex) => (
                        <tr key={order.id || `order-${Math.random()}`} className={`hover:bg-white/80 transition-colors ${orderIndex === 0 ? 'border-t-4 border-amber-400 bg-amber-50/30' : 'border-t border-amber-100'}`}>
                          {orderIndex === 0 && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-amber-700" rowSpan={group.orders.length}>
                                Multiple Items
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap" rowSpan={group.orders.length}>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">{group.customer.name}</div>
                                  <div className="text-sm text-gray-600">{group.customer.phone}</div>
                                  <div className="text-xs text-blue-600 mt-1">{group.orders.length} items</div>
                                </div>
                              </td>
                            </>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{order.item}</div>
                              <div className="text-sm text-gray-600">{order.category}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{order.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">₹{order.rate.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                          {orderIndex === 0 && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600" rowSpan={group.orders.length}>
                                ₹{group.totalPaid.toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600" rowSpan={group.orders.length}>
                                ₹{group.totalDue.toLocaleString('en-IN')}
                              </td>
                            </>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleStatusToggle(order)}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-elegant ${order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                            >
                              {order.status === 'delivered' ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Delivered
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                            {new Date(order.deliveryDate).toLocaleDateString('en-IN')}
                          </td>
                          {orderIndex === 0 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" rowSpan={group.orders.length}>
                              <div className="flex items-center space-x-3">
                                {hasPermission(userPermissions, 'orders', 'update') && (
                                  <button
                                    onClick={() => {
                                      // Create a combined order for editing multiple items
                                      const combinedOrder = {
                                        ...group.orders[0],
                                        items: group.orders.map(o => ({
                                          item: o.item,
                                          category: o.category,
                                          quantity: o.quantity,
                                          rate: o.rate,
                                          amount: o.totalAmount
                                        })),
                                        totalAmount: group.totalAmount,
                                        paid: group.totalPaid,
                                        due: group.totalDue
                                      };
                                      setEditingOrder(combinedOrder);
                                      setShowForm(true);
                                    }}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-elegant"
                                    title="Edit All Items"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                )}
                                {hasPermission(userPermissions, 'orders', 'delete') && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete all ${group.orders.length} items for ${group.customer.name}?`)) {
                                        // Delete all orders for this customer
                                        Promise.all(group.orders.map(order =>
                                          order.id ? apiService.deleteOrder(order.id) : Promise.resolve()
                                        )).then(() => {
                                          loadData();
                                        }).catch(error => {
                                          console.error('Error deleting orders:', error);
                                          alert('Failed to delete some orders. Please try again.');
                                        });
                                      }
                                    }}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-elegant"
                                    title="Delete All Items"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                                {!hasPermission(userPermissions, 'orders', 'update') && !hasPermission(userPermissions, 'orders', 'delete') && (
                                  <span className="text-gray-400 text-xs">View Only</span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Form Modal */}
        {showForm && (
          <OrderForm
            user={user}
            order={editingOrder}
            rates={rates}
            inventory={inventory}
            onSave={handleSaveOrder}
            onCancel={() => {
              setShowForm(false);
              setEditingOrder(null);
            }}
          />
        )}
      </div>
      );
};

      export default OrderSection;