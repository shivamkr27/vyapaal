import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download } from 'lucide-react';
import { Staff, User } from '../../types';
import StaffForm from '../forms/StaffForm';
import { exportToExcel, exportToPDF } from '../../utils/export';

interface StaffSectionProps {
  user: User;
}

const StaffSection: React.FC<StaffSectionProps> = ({ user }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStaff();
  }, [user.id]);

  const loadStaff = () => {
    const storedStaff = JSON.parse(localStorage.getItem(`vyapaal_staff_${user.id}`) || '[]');
    setStaff(storedStaff);
  };

  const handleSaveStaff = (staffData: Omit<Staff, 'id' | 'userId' | 'createdAt'>) => {
    let updatedStaff: Staff[] = [];

    if (editingStaff) {
      updatedStaff = staff.map(s =>
        s.id === editingStaff.id
          ? { ...staffData, id: editingStaff.id, userId: user.id, createdAt: editingStaff.createdAt }
          : s
      );
    } else {
      const newStaff: Staff = {
        ...staffData,
        id: Date.now().toString(),
        userId: user.id,
        createdAt: new Date().toISOString(),
      };
      updatedStaff = [...staff, newStaff];
    }

    localStorage.setItem(`vyapaal_staff_${user.id}`, JSON.stringify(updatedStaff));
    setStaff(updatedStaff);
    setShowForm(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (staffMember: Staff) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      const updatedStaff = staff.filter(s => s.id !== staffMember.id);
      localStorage.setItem(`vyapaal_staff_${user.id}`, JSON.stringify(updatedStaff));
      setStaff(updatedStaff);
    }
  };

  const filteredStaff = staff.filter(s =>
    s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phoneNo.includes(searchTerm) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = (type: 'excel' | 'pdf') => {
    const exportData = filteredStaff.map(s => ({
      'Staff ID': s.staffId,
      'Staff Name': s.staffName,
      'Phone No': s.phoneNo,
      'Role': s.role,
      'Joining Date': new Date(s.joiningDate).toLocaleDateString('en-IN'),
      'Salary (₹)': s.salary,
      'Created At': new Date(s.createdAt).toLocaleDateString('en-IN')
    }));

    if (type === 'excel') {
      exportToExcel(exportData, 'Staff');
    } else {
      exportToPDF(exportData, 'Staff Records', 'Staff');
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
              setEditingStaff(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff</span>
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
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No staff members found matching your search.' : 'No staff members found. Add your first staff member to get started.'}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {staffMember.staffId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staffMember.staffName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staffMember.phoneNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staffMember.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(staffMember.joiningDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{staffMember.salary.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingStaff(staffMember);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staffMember)}
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

      {/* Staff Form Modal */}
      {showForm && (
        <StaffForm
          user={user}
          staff={editingStaff}
          onSave={handleSaveStaff}
          onCancel={() => {
            setShowForm(false);
            setEditingStaff(null);
          }}
        />
      )}
    </div>
  );
};

export default StaffSection;