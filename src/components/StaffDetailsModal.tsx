import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, Calendar, Shield, Edit3, Save, DollarSign, Loader } from 'lucide-react';
import { BusinessStaff } from '../types';

interface StaffDetailsModalProps {
  staff: BusinessStaff;
  onClose: () => void;
  onUpdate?: (staffId: string, updateData: { salary?: number; name?: string; phone?: string }) => void;
  isBusinessOwner?: boolean;
}

const StaffDetailsModal: React.FC<StaffDetailsModalProps> = ({
  staff,
  onClose,
  onUpdate,
  isBusinessOwner = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: staff.name,
    phone: staff.phone || '',
    salary: staff.salary || 0
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    // Validate inputs
    if (!editData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (editData.phone && !/^\d{10,15}$/.test(editData.phone.replace(/[^0-9]/g, ''))) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    if (editData.salary < 0) {
      setError('Salary cannot be negative');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      if (onUpdate) {
        await onUpdate(staff.id, {
          name: editData.name,
          phone: editData.phone,
          salary: editData.salary
        });
      }
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update staff details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: staff.name,
      phone: staff.phone || '',
      salary: staff.salary || 0
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Staff Details</h3>
          <div className="flex items-center space-x-2">
            {isBusinessOwner && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Edit Staff"
              >
                <Edit3 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {staff.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{staff.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{staff.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{staff.phone || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900">{staff.role}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Salary (₹)</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.salary}
                    onChange={(e) => setEditData(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter salary"
                    min="0"
                  />
                ) : (
                  <p className="font-medium text-gray-900">
                    {staff.salary ? `₹${staff.salary.toLocaleString()}` : '₹0 (Not set)'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium text-gray-900">{new Date(staff.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Permissions</h4>
            <div className="space-y-2">
              {staff.permissions && staff.permissions.length > 0 ? (
                staff.permissions.map((permission, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-700 capitalize">{permission.module}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {permission.actions.map(action => (
                        <span
                          key={action}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No permissions assigned</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6">
          {isEditing ? (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StaffDetailsModal;