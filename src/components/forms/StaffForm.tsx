import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Staff, User } from '../../types';
import apiService from '../../services/api';

interface StaffFormProps {
  user: User;
  staff?: Staff | null;
  onSave: (staff: Omit<Staff, 'id' | 'userId' | 'createdAt'>) => void;
  onCancel: () => void;
}

const StaffForm: React.FC<StaffFormProps> = ({ user, staff, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    email: '',
    phoneNo: '',
    role: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (staff) {
      setFormData({
        staffId: staff.staffId,
        staffName: staff.staffName,
        email: staff.email || '',
        phoneNo: staff.phoneNo,
        role: staff.role,
        joiningDate: staff.joiningDate,
        salary: staff.salary || 0, // Ensure salary is never undefined
      });
    }
  }, [staff]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salary' ? (value === '' ? 0 : Number(value) || 0) : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.staffId.trim()) newErrors.staffId = 'Staff ID is required';
    if (!formData.staffName.trim()) newErrors.staffName = 'Staff name is required';
    if (!formData.phoneNo.trim()) newErrors.phoneNo = 'Phone number is required';

    // Email validation (optional but must be valid if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Role is now optional - can be assigned later in Team Management
    if (formData.salary < 0) newErrors.salary = 'Salary cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('StaffForm submitting data:', formData);

      // Ensure joiningDate is in the correct format
      const processedData = {
        ...formData,
        joiningDate: new Date(formData.joiningDate).toISOString(),
        salary: Number(formData.salary) || 0
      };

      console.log('Processed data:', processedData);
      onSave(processedData);
    }
  };

  // Get roles from user's business
  const [businessRoles, setBusinessRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessRoles = async () => {
      try {
        setLoading(true);
        setApiError(null);

        // Default roles to use if API fails or no business
        const defaultRoles = ['Manager', 'Staff', 'Admin', 'Accountant', 'Delivery'];

        // Check if user has a business
        if (!user.business) {
          console.log('No business found, using default roles');
          setBusinessRoles(defaultRoles);
          setLoading(false);
          return;
        }

        try {
          console.log('Fetching business roles...');
          const response = await apiService.getBusinessDetails();

          if (response && response.business && response.business.roles && response.business.roles.length > 0) {
            console.log('Business roles found:', response.business.roles.length);
            const roleNames = response.business.roles.map((role: any) => role.roleName);
            setBusinessRoles(roleNames);
          } else {
            console.log('No roles found in business, using default roles');
            setBusinessRoles(defaultRoles);
          }
        } catch (apiError: any) {
          console.error('Failed to fetch business roles:', apiError);
          setApiError('Failed to load roles. Using default roles.');
          setBusinessRoles(defaultRoles);
        }
      } catch (error) {
        console.error('Error in business roles fetch:', error);
        setBusinessRoles(['Manager', 'Staff', 'Admin']);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessRoles();
  }, [user.business]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff ID
            </label>
            <input
              type="text"
              name="staffId"
              value={formData.staffId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter staff ID"
            />
            {errors.staffId && <p className="text-red-500 text-sm mt-1">{errors.staffId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Name
            </label>
            <input
              type="text"
              name="staffName"
              value={formData.staffName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter staff name"
            />
            {errors.staffName && <p className="text-red-500 text-sm mt-1">{errors.staffName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNo"
              value={formData.phoneNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
            {errors.phoneNo && <p className="text-red-500 text-sm mt-1">{errors.phoneNo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select role</option>
              {loading ? (
                <option value="" disabled>Loading roles...</option>
              ) : businessRoles.length > 0 ? (
                businessRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))
              ) : (
                <option value="" disabled>No roles available</option>
              )}
              {apiError && <option value="" disabled>Error: {apiError}</option>}
            </select>
            {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Joining Date
            </label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary (₹)
            </label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter salary"
            />
            {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              {staff ? 'Update Staff' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffForm;