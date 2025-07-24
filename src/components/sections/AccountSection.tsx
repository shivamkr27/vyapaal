import React, { useState, useEffect } from 'react';
import { Search, Download, User as UserIcon } from 'lucide-react';
import { Order, Customer, User, Permission } from '../../types';
import { exportToExcel, exportToPDF } from '../../utils/export';
import { useDataUserId, useDataSource } from '../UserDataProvider';
import apiService from '../../services/api';

interface AccountSectionProps {
  user: User;
  userPermissions?: Permission[];
}

const AccountSection: React.FC<AccountSectionProps> = ({ user }) => {
  const dataUserId = useDataUserId();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [dataUserId]);

  const loadData = async () => {
    if (!dataUserId) return;

    setLoading(true);
    try {
      console.log('🔄 Loading customers and orders from MongoDB API...');
      const [customersData, ordersData] = await Promise.all([
        apiService.getCustomers(),
        apiService.getOrders()
      ]);

      setCustomers(customersData || []);
      setOrders(ordersData || []);
      console.log('✅ Loaded from API:', {
        customers: customersData?.length || 0,
        orders: ordersData?.length || 0
      });
    } catch (error) {
      console.error('❌ Error loading data:', error);
      alert('Failed to load customer data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    const customerOrderHistory = orders.filter(
      order => order.customerPhone === customer.phone
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCustomerOrders(customerOrderHistory);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const calculateTotals = () => {
    const totalAmount = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPaid = customerOrders.reduce((sum, order) => sum + order.paid, 0);

    // Calculate net balance: Paid - Amount
    const netBalance = totalPaid - totalAmount;

    // If positive = credit (customer overpaid), if negative = due (customer owes money)
    const creditBalance = netBalance > 0 ? netBalance : 0;
    const totalDue = netBalance < 0 ? Math.abs(netBalance) : 0;

    return {
      totalAmount,
      totalPaid,
      totalDue,
      creditBalance,
      netBalance // Add net balance for reference
    };
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    if (!selectedCustomer || customerOrders.length === 0) {
      alert('Please select a customer with orders to export');
      return;
    }

    const exportData = customerOrders.map(order => ({
      'Date': new Date(order.createdAt).toLocaleDateString('en-IN'),
      'Order ID': order.id,
      'Item': order.item,
      'Category': order.category,
      'Quantity': order.quantity.toString(),
      'Rate (₹)': order.rate.toString(),
      'Total Amount (₹)': order.totalAmount.toString(),
      'Paid (₹)': order.paid.toString(),
      'Due (₹)': order.due.toString(),
      'Status': order.status,
      'Delivery Date': new Date(order.deliveryDate).toLocaleDateString('en-IN')
    }));

    const { totalAmount, totalPaid, totalDue } = calculateTotals();

    // Add summary row
    exportData.push({
      'Date': '',
      'Order ID': 'TOTAL',
      'Item': '',
      'Category': '',
      'Quantity': '',
      'Rate (₹)': '',
      'Total Amount (₹)': totalAmount.toString(),
      'Paid (₹)': totalPaid.toString(),
      'Due (₹)': totalDue.toString(),
      'Status': 'pending' as 'pending' | 'delivered',
      'Delivery Date': ''
    });

    if (type === 'excel') {
      exportToExcel(exportData, `Account_${selectedCustomer.name}_${selectedCustomer.phone}`);
    } else {
      exportToPDF(exportData, `Account Statement - ${selectedCustomer.name}`, `Account_${selectedCustomer.name}_${selectedCustomer.phone}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="glass-cream rounded-3xl shadow-elegant p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-6 sm:space-y-0">
          <h3 className="text-2xl font-display font-bold gradient-text-warm">Search Customer Account</h3>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-elegant bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Customer List */}
        {searchTerm && (
          <div className="mt-6 max-h-60 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No customers found matching your search.</p>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className="w-full text-left p-4 bg-white/60 backdrop-blur-sm border border-amber-200/50 rounded-2xl hover:bg-white/80 hover:shadow-warm transition-elegant"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                        {/* Remove old credit balance display from customer list */}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Account Details */}
      {selectedCustomer && (
        <div className="space-y-6">
          {/* Customer Info & Export */}
          <div className="glass-cream rounded-3xl shadow-elegant p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-6 sm:space-y-0">
              <div className="space-y-2">
                <h3 className="text-3xl font-display font-bold gradient-text-warm">{selectedCustomer.name}</h3>
                <p className="text-lg text-gray-700 font-medium">{selectedCustomer.phone}</p>
                <p className="text-sm text-gray-600">
                  Customer since: {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}
                </p>
                {(() => {
                  const { creditBalance, totalDue } = calculateTotals();
                  if (creditBalance > 0) {
                    return (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        Credit Balance: ₹{creditBalance.toLocaleString('en-IN')}
                      </div>
                    );
                  } else if (totalDue > 0) {
                    return (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                        Amount Due: ₹{totalDue.toLocaleString('en-IN')}
                      </div>
                    );
                  } else {
                    return (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        Account Clear
                      </div>
                    );
                  }
                })()}
              </div>

              {customerOrders.length > 0 && (
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
              )}
            </div>
          </div>

          {/* Order History */}
          <div className="glass-cream rounded-3xl shadow-elegant overflow-hidden">
            <div className="px-8 py-6 border-b border-amber-200/50 bg-gradient-to-r from-amber-100/50 to-orange-100/50">
              <h4 className="text-2xl font-display font-bold gradient-text-warm">Order History</h4>
            </div>

            {customerOrders.length === 0 ? (
              <div className="px-8 py-12 text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg">No orders found for this customer.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-amber-200/50">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Rate</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Paid</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Due</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-amber-200/30">
                      {customerOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-amber-700">
                            #{order.id ? order.id.slice(-6) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{order.item}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">₹{order.rate.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">₹{order.paid.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">₹{order.due.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                              }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 px-8 py-6 border-t border-amber-200/50">
                  <div className="flex justify-end">
                    <div className="text-right space-y-2">
                      {(() => {
                        const { totalAmount, totalPaid, totalDue, creditBalance } = calculateTotals();
                        return (
                          <>
                            <p className="text-base text-gray-700">
                              Total Amount: <span className="font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                            </p>
                            <p className="text-base text-gray-700">
                              Total Paid: <span className="font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</span>
                            </p>
                            <p className="text-base text-gray-700">
                              Total Due: <span className={`font-bold ${totalDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                ₹{totalDue.toLocaleString('en-IN')}
                              </span>
                            </p>
                            {creditBalance > 0 && (
                              <p className="text-base text-gray-700">
                                Credit Balance: <span className="font-bold text-blue-600">
                                  ₹{creditBalance.toLocaleString('en-IN')}
                                </span>
                              </p>
                            )}
                            <div className="pt-3 border-t border-amber-300/50">
                              <p className="text-lg font-display font-bold">
                                Account Status: <span className={(() => {
                                  if (totalDue > 0) return 'text-red-600';
                                  if (creditBalance > 0) return 'text-blue-600';
                                  return 'text-emerald-600';
                                })()}>
                                  {(() => {
                                    if (totalDue > 0) return `₹${totalDue.toLocaleString('en-IN')} Due`;
                                    if (creditBalance > 0) return `₹${creditBalance.toLocaleString('en-IN')} Credit`;
                                    return 'Clear';
                                  })()}
                                </span>
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSection;