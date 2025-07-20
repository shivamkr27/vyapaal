import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download } from 'lucide-react';
import { Supplier, User, Inventory } from '../../types';
import SupplierForm from '../forms/SupplierForm';
import { exportToExcel, exportToPDF } from '../../utils/export';

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

  const loadData = () => {
    const storedSuppliers = JSON.parse(localStorage.getItem(`vyapaal_suppliers_${user.id}`) || '[]');
    const storedInventory = JSON.parse(localStorage.getItem(`vyapaal_inventory_${user.id}`) || '[]');
    setSuppliers(storedSuppliers);
    setInventory(storedInventory);
  };

  const handleSaveSupplier = (supplierData: Omit<Supplier, 'id' | 'userId' | 'createdAt'>) => {
    let updatedSuppliers: Supplier[] = [];
    let updatedInventory = [...inventory];

    if (editingSupplier) {
      // Editing existing supplier - restore previous inventory
      const oldInventoryItem = updatedInventory.find(
        item => item.item === editingSupplier.item && item.category === editingSupplier.category
      );
      if (oldInventoryItem) {
        oldInventoryItem.quantity -= editingSupplier.quantity;
      }

      updatedSuppliers = suppliers.map(supplier =>
        supplier.id === editingSupplier.id
          ? { ...supplierData, id: editingSupplier.id, userId: user.id, createdAt: editingSupplier.createdAt }
          : supplier
      );
    } else {
      const newSupplier: Supplier = {
        ...supplierData,
        id: Date.now().toString(),
        userId: user.id,
        createdAt: new Date().toISOString(),
      };
      updatedSuppliers = [...suppliers, newSupplier];
    }

    // Update inventory with new supplier data
    const inventoryItem = updatedInventory.find(
      item => item.item === supplierData.item && item.category === supplierData.category
    );

    if (inventoryItem) {
      inventoryItem.quantity += supplierData.quantity;
    } else {
      // Create new inventory item if it doesn't exist
      const newInventoryItem: Inventory = {
        id: Date.now().toString(),
        item: supplierData.item,
        category: supplierData.category,
        quantity: supplierData.quantity,
        threshold: 5, // Default threshold
        userId: user.id,
        createdAt: new Date().toISOString(),
      };
      updatedInventory.push(newInventoryItem);
    }

    // Save to localStorage
    localStorage.setItem(`vyapaal_suppliers_${user.id}`, JSON.stringify(updatedSuppliers));
    localStorage.setItem(`vyapaal_inventory_${user.id}`, JSON.stringify(updatedInventory));

    setSuppliers(updatedSuppliers);
    setInventory(updatedInventory);
    setShowForm(false);
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (window.confirm('Are you sure you want to delete this supplier record?')) {
      const updatedSuppliers = suppliers.filter(s => s.id !== supplier.id);
      
      // Restore inventory
      const updatedInventory = [...inventory];
      const inventoryItem = updatedInventory.find(
        item => item.item === supplier.item && item.category === supplier.category
      );
      if (inventoryItem) {
        inventoryItem.quantity -= supplier.quantity;
        if (inventoryItem.quantity < 0) inventoryItem.quantity = 0;
      }

      localStorage.setItem(`vyapaal_suppliers_${user.id}`, JSON.stringify(updatedSuppliers));
      localStorage.setItem(`vyapaal_inventory_${user.id}`, JSON.stringify(updatedInventory));
      
      setSuppliers(updatedSuppliers);
      setInventory(updatedInventory);
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