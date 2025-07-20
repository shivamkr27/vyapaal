import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ArrowUpDown, Download } from 'lucide-react';
import { Rate, User, Permission } from '../../types';
import RateForm from '../forms/RateForm';
import { exportToExcel, exportToPDF } from '../../utils/export';
import { useDataUserId } from '../UserDataProvider';
import { hasPermission } from '../../utils/businessUtils';

interface RateSectionProps {
  user: User;
  userPermissions?: Permission[];
}

const RateSection: React.FC<RateSectionProps> = ({ user, userPermissions = [] }) => {
  const dataUserId = useDataUserId();
  const [rates, setRates] = useState<Rate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (dataUserId) {
      loadRates();
    }
  }, [dataUserId]);

  const loadRates = () => {
    if (!dataUserId) return;
    const storedRates = JSON.parse(localStorage.getItem(`vyapaal_rates_${dataUserId}`) || '[]');
    setRates(storedRates);
  };

  const handleSaveRate = (rateData: Omit<Rate, 'id' | 'userId' | 'createdAt'>) => {
    if (!dataUserId) return;

    let updatedRates: Rate[] = [];

    if (editingRate) {
      updatedRates = rates.map(rate =>
        rate.id === editingRate.id
          ? { ...rateData, id: editingRate.id, userId: dataUserId, createdAt: editingRate.createdAt }
          : rate
      );
    } else {
      const newRate: Rate = {
        ...rateData,
        id: Date.now().toString(),
        userId: dataUserId,
        createdAt: new Date().toISOString(),
      };
      updatedRates = [...rates, newRate];
    }

    // Sort rates by item and category for clean appearance
    updatedRates.sort((a, b) => {
      if (a.item !== b.item) {
        return a.item.localeCompare(b.item);
      }
      return a.category.localeCompare(b.category);
    });

    localStorage.setItem(`vyapaal_rates_${dataUserId}`, JSON.stringify(updatedRates));
    setRates(updatedRates);
    setShowForm(false);
    setEditingRate(null);
  };

  const handleDeleteRate = (rate: Rate) => {
    if (window.confirm('Are you sure you want to delete this rate?')) {
      const updatedRates = rates.filter(r => r.id !== rate.id);
      if (dataUserId) {
        localStorage.setItem(`vyapaal_rates_${dataUserId}`, JSON.stringify(updatedRates));
      }
      setRates(updatedRates);
    }
  };

  const filteredRates = rates.filter(rate =>
    rate.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.rate.toString().includes(searchTerm)
  );

  const sortedRates = [...filteredRates].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    return (a.rate - b.rate) * modifier;
  });

  const handleExport = (type: 'excel' | 'pdf') => {
    const exportData = sortedRates.map(rate => ({
      'Item': rate.item,
      'Category': rate.category,
      'Rate (₹)': rate.rate,
      'Created At': new Date(rate.createdAt).toLocaleDateString('en-IN')
    }));

    if (type === 'excel') {
      exportToExcel(exportData, 'Rates');
    } else {
      exportToPDF(exportData, 'Rate List', 'Rates');
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
              setEditingRate(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Rate</span>
          </button>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort {sortOrder === 'asc' ? 'Desc' : 'Asc'}</span>
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
            placeholder="Search rates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Rates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No rates found matching your search.' : 'No rates found. Add your first rate to get started.'}
                  </td>
                </tr>
              ) : (
                sortedRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rate.item}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{rate.rate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {hasPermission(userPermissions, 'rates', 'update') && (
                          <button
                            onClick={() => {
                              setEditingRate(rate);
                              setShowForm(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-elegant"
                            title="Edit Rate"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission(userPermissions, 'rates', 'delete') && (
                          <button
                            onClick={() => handleDeleteRate(rate)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-elegant"
                            title="Delete Rate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {!hasPermission(userPermissions, 'rates', 'update') && !hasPermission(userPermissions, 'rates', 'delete') && (
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

      {/* Rate Form Modal */}
      {showForm && (
        <RateForm
          user={user}
          rate={editingRate}
          onSave={handleSaveRate}
          onCancel={() => {
            setShowForm(false);
            setEditingRate(null);
          }}
        />
      )}
    </div>
  );
};

export default RateSection;