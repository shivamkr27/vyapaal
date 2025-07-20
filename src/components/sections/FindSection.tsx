import React, { useState, useEffect } from 'react';
import { Search, FileText, ShoppingCart, Package, Truck, Users } from 'lucide-react';
import { Order, Rate, Inventory, Supplier, Staff, Customer, User } from '../../types';

interface FindSectionProps {
  user: User;
}

interface SearchResult {
  type: 'order' | 'rate' | 'inventory' | 'supplier' | 'staff' | 'customer';
  data: any;
  matchedField: string;
}

const FindSection: React.FC<FindSectionProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [allData, setAllData] = useState({
    orders: [] as Order[],
    rates: [] as Rate[],
    inventory: [] as Inventory[],
    suppliers: [] as Supplier[],
    staff: [] as Staff[],
    customers: [] as Customer[],
  });

  useEffect(() => {
    loadAllData();
  }, [user.id]);

  const loadAllData = () => {
    const orders = JSON.parse(localStorage.getItem(`vyapaal_orders_${user.id}`) || '[]');
    const rates = JSON.parse(localStorage.getItem(`vyapaal_rates_${user.id}`) || '[]');
    const inventory = JSON.parse(localStorage.getItem(`vyapaal_inventory_${user.id}`) || '[]');
    const suppliers = JSON.parse(localStorage.getItem(`vyapaal_suppliers_${user.id}`) || '[]');
    const staff = JSON.parse(localStorage.getItem(`vyapaal_staff_${user.id}`) || '[]');
    const customers = JSON.parse(localStorage.getItem(`vyapaal_customers_${user.id}`) || '[]');

    setAllData({ orders, rates, inventory, suppliers, staff, customers });
  };

  const performSearch = (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const searchLower = term.toLowerCase();

    // Search in orders
    allData.orders.forEach(order => {
      const matches = [];
      if (order.id.toLowerCase().includes(searchLower)) matches.push('Order ID');
      if (order.customerName.toLowerCase().includes(searchLower)) matches.push('Customer Name');
      if (order.customerPhone.includes(searchLower)) matches.push('Customer Phone');
      if (order.item.toLowerCase().includes(searchLower)) matches.push('Item');
      if (order.category.toLowerCase().includes(searchLower)) matches.push('Category');
      
      if (matches.length > 0) {
        results.push({
          type: 'order',
          data: order,
          matchedField: matches.join(', ')
        });
      }
    });

    // Search in rates
    allData.rates.forEach(rate => {
      const matches = [];
      if (rate.item.toLowerCase().includes(searchLower)) matches.push('Item');
      if (rate.category.toLowerCase().includes(searchLower)) matches.push('Category');
      if (rate.rate.toString().includes(searchLower)) matches.push('Rate');
      
      if (matches.length > 0) {
        results.push({
          type: 'rate',
          data: rate,
          matchedField: matches.join(', ')
        });
      }
    });

    // Search in inventory
    allData.inventory.forEach(item => {
      const matches = [];
      if (item.item.toLowerCase().includes(searchLower)) matches.push('Item');
      if (item.category.toLowerCase().includes(searchLower)) matches.push('Category');
      if (item.quantity.toString().includes(searchLower)) matches.push('Quantity');
      
      if (matches.length > 0) {
        results.push({
          type: 'inventory',
          data: item,
          matchedField: matches.join(', ')
        });
      }
    });

    // Search in suppliers
    allData.suppliers.forEach(supplier => {
      const matches = [];
      if (supplier.supplierName.toLowerCase().includes(searchLower)) matches.push('Supplier Name');
      if (supplier.billNo.toLowerCase().includes(searchLower)) matches.push('Bill No');
      if (supplier.item.toLowerCase().includes(searchLower)) matches.push('Item');
      if (supplier.category.toLowerCase().includes(searchLower)) matches.push('Category');
      
      if (matches.length > 0) {
        results.push({
          type: 'supplier',
          data: supplier,
          matchedField: matches.join(', ')
        });
      }
    });

    // Search in staff
    allData.staff.forEach(staffMember => {
      const matches = [];
      if (staffMember.staffId.toLowerCase().includes(searchLower)) matches.push('Staff ID');
      if (staffMember.staffName.toLowerCase().includes(searchLower)) matches.push('Staff Name');
      if (staffMember.phoneNo.includes(searchLower)) matches.push('Phone No');
      if (staffMember.role.toLowerCase().includes(searchLower)) matches.push('Role');
      
      if (matches.length > 0) {
        results.push({
          type: 'staff',
          data: staffMember,
          matchedField: matches.join(', ')
        });
      }
    });

    // Search in customers
    allData.customers.forEach(customer => {
      const matches = [];
      if (customer.name.toLowerCase().includes(searchLower)) matches.push('Customer Name');
      if (customer.phone.includes(searchLower)) matches.push('Phone');
      
      if (matches.length > 0) {
        results.push({
          type: 'customer',
          data: customer,
          matchedField: matches.join(', ')
        });
      }
    });

    setSearchResults(results);
    setIsSearching(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, allData]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-5 w-5 text-blue-600" />;
      case 'rate': return <FileText className="h-5 w-5 text-green-600" />;
      case 'inventory': return <Package className="h-5 w-5 text-purple-600" />;
      case 'supplier': return <Truck className="h-5 w-5 text-orange-600" />;
      case 'staff': return <Users className="h-5 w-5 text-indigo-600" />;
      case 'customer': return <Users className="h-5 w-5 text-pink-600" />;
      default: return <Search className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order': return 'Order';
      case 'rate': return 'Rate';
      case 'inventory': return 'Inventory';
      case 'supplier': return 'Supplier';
      case 'staff': return 'Staff';
      case 'customer': return 'Customer';
      default: return type;
    }
  };

  const renderResultDetails = (result: SearchResult) => {
    switch (result.type) {
      case 'order':
        return (
          <div>
            <p className="font-medium">Order #{result.data.id.slice(-6)}</p>
            <p className="text-sm text-gray-600">{result.data.customerName} - {result.data.item} ({result.data.category})</p>
            <p className="text-sm text-gray-500">₹{result.data.totalAmount} - {result.data.status}</p>
          </div>
        );
      case 'rate':
        return (
          <div>
            <p className="font-medium">{result.data.item} - {result.data.category}</p>
            <p className="text-sm text-gray-600">Rate: ₹{result.data.rate}</p>
          </div>
        );
      case 'inventory':
        return (
          <div>
            <p className="font-medium">{result.data.item} - {result.data.category}</p>
            <p className="text-sm text-gray-600">Stock: {result.data.quantity} units</p>
            <p className="text-sm text-gray-500">Threshold: {result.data.threshold}</p>
          </div>
        );
      case 'supplier':
        return (
          <div>
            <p className="font-medium">{result.data.supplierName}</p>
            <p className="text-sm text-gray-600">Bill: {result.data.billNo} - {result.data.item} ({result.data.category})</p>
            <p className="text-sm text-gray-500">₹{result.data.totalAmount} - Due: ₹{result.data.due}</p>
          </div>
        );
      case 'staff':
        return (
          <div>
            <p className="font-medium">{result.data.staffName} ({result.data.staffId})</p>
            <p className="text-sm text-gray-600">{result.data.role} - {result.data.phoneNo}</p>
            <p className="text-sm text-gray-500">Salary: ₹{result.data.salary.toLocaleString('en-IN')}</p>
          </div>
        );
      case 'customer':
        return (
          <div>
            <p className="font-medium">{result.data.name}</p>
            <p className="text-sm text-gray-600">{result.data.phone}</p>
            <p className="text-sm text-gray-500">Customer since: {new Date(result.data.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Universal Search</h2>
          <p className="text-gray-600">Search across all your business data - orders, inventory, customers, and more</p>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, ID, item, category, or any other detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>

        {isSearching && (
          <div className="text-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchTerm && !isSearching && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Search Results ({searchResults.length})
            </h3>
          </div>

          {searchResults.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No results found for "{searchTerm}"</p>
              <p className="text-sm mt-1">Try searching with different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {searchResults.map((result, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.type === 'order' ? 'bg-blue-100 text-blue-800' :
                          result.type === 'rate' ? 'bg-green-100 text-green-800' :
                          result.type === 'inventory' ? 'bg-purple-100 text-purple-800' :
                          result.type === 'supplier' ? 'bg-orange-100 text-orange-800' :
                          result.type === 'staff' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {getTypeLabel(result.type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Matched: {result.matchedField}
                        </span>
                      </div>
                      {renderResultDetails(result)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!searchTerm && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">What you can search for:</h4>
              <ul className="space-y-1">
                <li>• Customer names and phone numbers</li>
                <li>• Order IDs and item names</li>
                <li>• Product categories and rates</li>
                <li>• Supplier names and bill numbers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Search examples:</h4>
              <ul className="space-y-1">
                <li>• "Ram" - Find all customers named Ram</li>
                <li>• "9608755124" - Find by phone number</li>
                <li>• "cement" - Find all cement-related records</li>
                <li>• "0102" - Find by bill number</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindSection;