import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Package, DollarSign, Users, Download, BarChart3 } from 'lucide-react';
import { Order, User } from '../../types';
import { exportToExcel, exportToPDF } from '../../utils/export';
import apiService from '../../services/api';

interface ReportsSectionProps {
  user: User;
}

interface MonthlySales {
  item: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalQuantity: 0,
    uniqueCustomers: 0,
    averageOrderValue: 0,
    totalPaid: 0,
    totalDue: 0
  });

  useEffect(() => {
    loadOrders();
  }, [user.id]);

  useEffect(() => {
    generateMonthlyReport();
  }, [orders, selectedMonth]);

  const loadOrders = async () => {
    try {
      console.log('🔄 Loading orders from MongoDB API...');
      const ordersData = await apiService.getOrders();
      setOrders(ordersData || []);
      console.log('✅ Loaded orders from API:', ordersData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      alert('Failed to load orders. Please check your connection and try again.');
    }
  };

  const generateMonthlyReport = () => {
    const [year, month] = selectedMonth.split('-');
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getFullYear() === parseInt(year) &&
        orderDate.getMonth() === parseInt(month) - 1;
    });

    // Calculate monthly sales by item and category
    const salesMap = new Map<string, MonthlySales>();

    filteredOrders.forEach(order => {
      const key = `${order.item}-${order.category}`;
      if (salesMap.has(key)) {
        const existing = salesMap.get(key)!;
        existing.totalQuantity += order.quantity;
        existing.totalRevenue += order.totalAmount;
        existing.orderCount += 1;
      } else {
        salesMap.set(key, {
          item: order.item,
          category: order.category,
          totalQuantity: order.quantity,
          totalRevenue: order.totalAmount,
          orderCount: 1
        });
      }
    });

    const salesData = Array.from(salesMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
    setMonthlySales(salesData);

    // Calculate monthly statistics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPaid = filteredOrders.reduce((sum, order) => sum + order.paid, 0);
    const totalDue = filteredOrders.reduce((sum, order) => sum + order.due, 0);
    const totalQuantity = filteredOrders.reduce((sum, order) => sum + order.quantity, 0);
    const uniqueCustomers = new Set(filteredOrders.map(order => order.customerPhone)).size;
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    setMonthlyStats({
      totalRevenue,
      totalOrders: filteredOrders.length,
      totalQuantity,
      uniqueCustomers,
      averageOrderValue,
      totalPaid,
      totalDue
    });
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    const exportData = monthlySales.map(sale => ({
      'Item': sale.item,
      'Category': sale.category,
      'Total Quantity Sold': sale.totalQuantity,
      'Total Revenue (₹)': sale.totalRevenue,
      'Number of Orders': sale.orderCount,
      'Average per Order': Math.round(sale.totalQuantity / sale.orderCount)
    }));

    // Add summary row
    exportData.push({
      'Item': 'TOTAL',
      'Category': '',
      'Total Quantity Sold': monthlyStats.totalQuantity,
      'Total Revenue (₹)': monthlyStats.totalRevenue,
      'Number of Orders': monthlyStats.totalOrders,
      'Average per Order': Math.round(monthlyStats.averageOrderValue)
    });

    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long'
    });

    if (type === 'excel') {
      exportToExcel(exportData, `Monthly_Sales_Report_${selectedMonth}`);
    } else {
      exportToPDF(exportData, `Monthly Sales Report - ${monthName}`, `Monthly_Sales_Report_${selectedMonth}`);
    }
  };

  const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Sales Report</h2>
          <p className="text-gray-600">Analyze your business performance and sales trends</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('excel')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">₹{monthlyStats.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{monthlyStats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Items Sold</p>
              <p className="text-2xl font-semibold text-gray-900">{monthlyStats.totalQuantity}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unique Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{monthlyStats.uniqueCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Average Order Value</h3>
          <p className="text-3xl font-bold text-blue-600">₹{Math.round(monthlyStats.averageOrderValue).toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Paid</h3>
          <p className="text-3xl font-bold text-green-600">₹{monthlyStats.totalPaid.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Due</h3>
          <p className="text-3xl font-bold text-red-600">₹{monthlyStats.totalDue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Monthly Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Sales by Product - {monthName}
          </h3>
        </div>

        {monthlySales.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No sales data found for {monthName}</p>
            <p className="text-sm mt-1">Try selecting a different month or add some orders</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Order</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlySales.map((sale, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.item}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{sale.totalRevenue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(sale.totalQuantity / sale.orderCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsSection;