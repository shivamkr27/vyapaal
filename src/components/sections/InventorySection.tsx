import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Download } from 'lucide-react';
import { Inventory, User, Permission } from '../../types';
import InventoryForm from '../forms/InventoryForm';
import { exportToExcel, exportToPDF } from '../../utils/export';
import { useDataUserId, useDataSource } from '../UserDataProvider';
import apiService from '../../services/api';
import { hasPermission } from '../../utils/businessUtils';

interface InventorySectionProps {
  user: User;
  userPermissions?: Permission[];
}

const InventorySection: React.FC<InventorySectionProps> = ({ user, userPermissions = [] }) => {
  const dataUserId = useDataUserId();
  const { useApi } = useDataSource();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [dataUserId]);

  const loadInventory = async () => {
    if (!dataUserId) return;

    setLoading(true);
    try {
      // Load from MongoDB API only
      console.log('🔄 Loading inventory from MongoDB API...');
      const inventoryData = await apiService.getInventory();
      setInventory(inventoryData || []);
      console.log('✅ Loaded inventory from API:', inventoryData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading inventory:', error);
      alert('Failed to load inventory. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInventory = async (inventoryData: Omit<Inventory, 'id' | 'userId' | 'createdAt'>) => {
    if (!dataUserId) return;

    setLoading(true);
    try {
      // Save to MongoDB API only
      let savedItem;
      if (editingItem) {
        console.log('🔄 Updating inventory item via API...');
        savedItem = await apiService.updateInventory(editingItem.id, inventoryData);
      } else {
        console.log('🔄 Creating inventory item via API...');
        savedItem = await apiService.createInventory(inventoryData);
      }
      console.log('✅ Inventory item saved via API:', savedItem);

      // Reload inventory from API to get updated data
      await loadInventory();
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('❌ Error saving inventory:', error);
      alert('Failed to save inventory item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInventory = async (item: Inventory) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      setLoading(true);
      try {
        // Delete from MongoDB API only
        console.log('🔄 Deleting inventory item via API...');
        await apiService.deleteInventory(item.id);
        console.log('✅ Inventory item deleted via API');

        // Reload inventory from API to get updated data
        await loadInventory();
      } catch (error) {
        console.error('❌ Error deleting inventory:', error);
        alert('Failed to delete inventory item. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.quantity.toString().includes(searchTerm)
  );

  const handleExport = (type: 'excel' | 'pdf') => {
    const exportData = filteredInventory.map(item => ({
      'Item': item.item,
      'Category': item.category,
      'Quantity in Stock': item.quantity,
      'Threshold': item.threshold,
      'Status': item.quantity <= item.threshold ? 'Low Stock' : 'In Stock',
      'Created At': new Date(item.createdAt).toLocaleDateString('en-IN')
    }));

    if (type === 'excel') {
      exportToExcel(exportData, 'Inventory');
    } else {
      exportToPDF(exportData, 'Inventory Report', 'Inventory');
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
              setEditingItem(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Inventory</span>
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
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Low Stock Alerts */}
      {inventory.some(item => item.quantity <= item.threshold) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
          </div>
          <div className="text-sm text-yellow-700">
            {inventory
              .filter(item => item.quantity <= item.threshold)
              .map(item => `${item.item} (${item.category}): ${item.quantity} units remaining`)
              .join(', ')}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity in Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No inventory items found matching your search.' : 'No inventory items found. Add your first item to get started.'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.item}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.threshold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.quantity <= item.threshold
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {item.quantity <= item.threshold ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {hasPermission(userPermissions, 'inventory', 'update') && (
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowForm(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-elegant"
                            title="Edit Inventory"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission(userPermissions, 'inventory', 'delete') && (
                          <button
                            onClick={() => handleDeleteInventory(item)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-elegant"
                            title="Delete Inventory"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {!hasPermission(userPermissions, 'inventory', 'update') && !hasPermission(userPermissions, 'inventory', 'delete') && (
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

      {/* Inventory Form Modal */}
      {showForm && (
        <InventoryForm
          user={user}
          inventory={editingItem}
          onSave={handleSaveInventory}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default InventorySection;