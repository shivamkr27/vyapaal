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
      if (editingOrder) {
        await apiService.updateOrder(editingOrder.id, orderData);
      } else {
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
      await apiService.updateOrder(order.id, updateData);
      // Reload data after update
      await loadData();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    const matchesDate = orderDate === selectedDate;
    const matchesSearch = searchTerm === '' ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch;
  });

  const handleExport = (type: 'excel' | 'pdf') => {
    const exportData = filteredOrders.map(order => ({
      'Order ID': order.id,
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
      <div className="glass-cream rounded-3xl shadow-elegant p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-3 bg-white/60 rounded-xl px-4 py-3 shadow-warm">
              <Calendar className="h-5 w-5 text-amber-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700 font-medium"
              />
            </div>

            <button
              onClick={() => {
                setShowForm(true);
                setEditingOrder(null);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-elegant shadow-warm"
            >
              <Plus className="h-5 w-5" />
              <span>Add Order</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('excel')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-elegant shadow-warm"
              >
                <Download className="h-5 w-5" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-elegant shadow-warm"
              >
                <Download className="h-5 w-5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-cream rounded-3xl shadow-elegant overflow-hidden">
        <div className="px-8 py-6 border-b border-amber-200/50 bg-gradient-to-r from-amber-100/50 to-orange-100/50">
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-display font-bold gradient-text-warm">Today's Orders</h4>
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
              {filteredOrders.length === 0 ? (
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
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-amber-700">
                      #{order.id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{order.customerName}</div>
                        <div className="text-sm text-gray-600">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{order.item}</div>
                        <div className="text-sm text-gray-600">{order.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{order.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">₹{order.rate.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">₹{order.paid.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">₹{order.due.toLocaleString('en-IN')}</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {hasPermission(userPermissions, 'orders', 'update') && (
                          <button
                            onClick={() => {
                              setEditingOrder(order);
                              setShowForm(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-elegant"
                            title="Edit Order"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission(userPermissions, 'orders', 'delete') && (
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-elegant"
                            title="Delete Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {!hasPermission(userPermissions, 'orders', 'update') && !hasPermission(userPermissions, 'orders', 'delete') && (
                          <span className="text-gray-400 text-xs">View Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
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