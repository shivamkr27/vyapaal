import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download } from 'lucide-react';
import { Supplier, User, Inventory } from '../../types';
import SupplierForm from '../forms/SupplierForm';
import { exportToExcel, exportToPDF } from '../../utils/export';
import apiService from '../../services/api';

interface SupplierSectionProps {
  user: User;
}

const SupplierSection: React.FC<SupplierSectionProps> = ({ user }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      console.log('🔄 Loading suppliers and inventory from MongoDB API...');
      const [suppliersData, inventoryData] = await Promise.all([
        apiService.getCustomers(), // Using customers API as suppliers placeholder
        apiService.getInventory()
      ]);

      setSuppliers([]); // Suppliers not implemented in API yet
      setInventory(inventoryData || []);
      console.log('✅ Loaded from API:', {
        suppliers: 0, // Placeholder
        inventory: inventoryData?.length || 0
      });
    } catch (error) {
      console.error('❌ Error loading data:', error);
      alert('Failed to load supplier data. Please check your connection and try again.');
    }
  };

  const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id' | 'userId' | 'createdAt'>) => {
    try {
      // Note: Suppliers API not implemented yet, this is a placeholder
      console.log('🔄 Supplier functionality not implemented in API yet');
      alert('Supplier functionality is not available yet. Please use other sections for now.');
      setShowForm(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('❌ Error saving supplier:', error);
      alert('Failed to save supplier. Please try again.');
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (window.confirm('Are you sure you want to delete this supplier record?')) {
      try {
        // Note: Suppliers API not implemented yet, this is a placeholder
        console.log('🔄 Supplier delete functionality not implemented in API yet');
        alert('Supplier functionality is not available yet. Please use other sections for now.');
      } catch (error) {
        console.error('❌ Error deleting supplier:', error);
        alert('Failed to delete supplier. Please try again.');
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = (type: 'excel' | 'pdf') => {
    const exportData = filteredSuppliers.map(supplier => ({
      'Supplier Name': supplier.supplierName,
      'Bill No': supplier.billNo,
      'Date': new Date(supplier.date).toLocaleDateString('en-IN'),
      'Item': supplier.item,
      'Category': supplier.category,
      'Rate (₹)': supplier.rate,
      'Quantity': supplier.quantity,
      'Total Amount (₹)': supplier.totalAmount,
      'Paid (₹)': supplier.paid,
      'Due (₹)': supplier.due,
      'Created At': new Date(supplier.createdAt).toLocaleDateString('en-IN')
    }));

    if (type === 'excel') {
      exportToExcel(exportData, 'Suppliers');
    } else {
      exportToPDF(exportData, 'Supplier Records', 'Suppliers');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-wrap items-center space-x-4">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingSupplier(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>

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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No suppliers found matching your search.' : 'No supplier records found. Add your first supplier to get started.'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {supplier.supplierName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.billNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(supplier.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.item}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{supplier.rate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{supplier.totalAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">₹{supplier.paid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{supplier.due}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Form Modal */}
      {showForm && (
        <SupplierForm
          user={user}
          supplier={editingSupplier}
          onSave={handleSaveSupplier}
          onCancel={() => {
            setShowForm(false);
            setEditingSupplier(null);
          }}
        />
      )}
    </div>
  );
};

export default SupplierSection;