import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Copy,
  Loader,
  Search,
  X,
  Download
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { User, Business, BusinessStaff, BusinessRole, Permission } from '../types';
import StaffDetailsModal from './StaffDetailsModal';
import apiService from '../services/api';

interface StaffManagementProps {
  user: User;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ user }) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  // Staff details modal state
  const [staffDetailsVisible, setStaffDetailsVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<BusinessStaff | null>(null);
  const [selectedRole, setSelectedRole] = useState<BusinessRole | null>(null);
  const [copiedCode, setCopiedCode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<{ show: boolean; roleId: string; roleName: string } | null>(null);

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    salary: 0
  });

  const [roleForm, setRoleForm] = useState({
    roleName: '',
    permissions: [] as Permission[]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user has a business
        if (!user.business) {
          setError('No business found. Please set up your business first.');
          setLoading(false);
          return;
        }

        try {
          // Load both business details and staff data
          const [businessResponse, staffData] = await Promise.all([
            apiService.getBusinessDetails(),
            apiService.getStaff()
          ]);

          if (businessResponse && businessResponse.business) {
            const businessData = businessResponse.business;

            // Merge staff data from Staff API with business data
            if (staffData && staffData.length > 0) {
              // Convert Staff API data to BusinessStaff format
              const unifiedStaff = staffData.map((staff: any) => ({
                id: staff.id,
                staffId: staff.staffId,
                name: staff.staffName,
                email: staff.email || '',
                phone: staff.phoneNo,
                role: staff.role || '',
                permissions: staff.permissions || [],
                salary: staff.salary || 0,
                joinedAt: staff.joiningDate,
                isActive: staff.isActive !== false
              }));

              // Update business data with unified staff
              businessData.staff = unifiedStaff;
            }

            setBusiness(businessData);
          } else {
            setError('No business data found. Please try again.');
          }
        } catch (apiError) {
          console.error('Failed to fetch business details:', apiError);
          setError('Failed to load business details. Please try again.');
        }
      } catch (err) {
        console.error('Error in business details fetch:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [user.business]);

  const handleStaffInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStaffForm(prev => ({
      ...prev,
      [name]: name === 'salary' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddStaff = async () => {
    if (!business || !staffForm.name || !staffForm.email) {
      setError('Please fill in all required fields (Name, Email)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(staffForm.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone format if provided
    if (staffForm.phone && !/^\d{10,15}$/.test(staffForm.phone.replace(/[^0-9]/g, ''))) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create staff using the unified Staff API
      const staffData = {
        staffId: `${business.businessCode}-${Date.now()}`,
        staffName: staffForm.name,
        email: staffForm.email,
        phoneNo: staffForm.phone,
        role: staffForm.role || '', // Allow empty role initially
        roleCode: '',
        permissions: [],
        joiningDate: new Date().toISOString(),
        salary: staffForm.salary || 0,
        isActive: true
      };

      await apiService.createStaff(staffData);

      // Also add to business staff for backward compatibility
      try {
        await apiService.addStaffMember(staffForm);
      } catch (businessError) {
        console.log('Business staff sync failed, but staff created successfully');
      }

      // Reload business data
      const response = await apiService.getBusinessDetails();
      if (response && response.business) {
        setBusiness(response.business);
      }

      setStaffForm({ name: '', email: '', phone: '', role: '', salary: 0 });
      setShowAddStaff(false);
      alert('Staff member added successfully');
    } catch (err: any) {
      console.error('Failed to add staff member:', err);
      setError(err.message || 'Failed to add staff member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaffRole = async (staffId: string, newRole: string) => {
    if (!business) return;

    try {
      setLoading(true);
      setError(null);

      // Find the role details
      const roleDetails = business.roles?.find(r => r.roleName === newRole);

      // Update staff role using the unified Staff API
      await apiService.assignStaffRole(staffId, {
        role: newRole,
        roleCode: roleDetails?.roleCode || '',
        permissions: roleDetails?.permissions || []
      });

      // Also update business staff for backward compatibility
      try {
        await apiService.updateStaffRole(staffId, newRole);
      } catch (businessError) {
        console.log('Business staff sync failed, but role assigned successfully');
      }

      // Reload business data to reflect changes
      const [businessResponse, staffData] = await Promise.all([
        apiService.getBusinessDetails(),
        apiService.getStaff()
      ]);

      if (businessResponse && businessResponse.business) {
        const businessData = businessResponse.business;

        // Merge updated staff data
        if (staffData && staffData.length > 0) {
          const unifiedStaff = staffData.map((staff: any) => ({
            id: staff.id,
            staffId: staff.staffId,
            name: staff.staffName,
            email: staff.email || '',
            phone: staff.phoneNo,
            role: staff.role || '',
            permissions: staff.permissions || [],
            salary: staff.salary || 0,
            joinedAt: staff.joiningDate,
            isActive: staff.isActive !== false
          }));

          businessData.staff = unifiedStaff;
        }

        setBusiness(businessData);
      }

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = 'Staff role updated successfully';
      document.body.appendChild(successMessage);

      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to update staff role:', err);
      setError(err.message || 'Failed to update staff role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!business) return;

    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Remove from Staff API
      await apiService.deleteStaff(staffId);

      // Also remove from business staff for backward compatibility
      try {
        await apiService.removeStaffMember(staffId);
      } catch (businessError) {
        console.log('Business staff sync failed, but staff removed successfully');
      }

      // Reload business data
      const [businessResponse, staffData] = await Promise.all([
        apiService.getBusinessDetails(),
        apiService.getStaff()
      ]);

      if (businessResponse && businessResponse.business) {
        const businessData = businessResponse.business;

        // Merge updated staff data
        if (staffData && staffData.length > 0) {
          const unifiedStaff = staffData.map((staff: any) => ({
            id: staff.id,
            staffId: staff.staffId,
            name: staff.staffName,
            email: staff.email || '',
            phone: staff.phoneNo,
            role: staff.role || '',
            permissions: staff.permissions || [],
            salary: staff.salary || 0,
            joinedAt: staff.joiningDate,
            isActive: staff.isActive !== false
          }));

          businessData.staff = unifiedStaff;
        } else {
          businessData.staff = [];
        }

        setBusiness(businessData);
      }

      alert('Staff member removed successfully');
    } catch (err) {
      console.error('Failed to remove staff member:', err);
      setError('Failed to remove staff member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateRole = async () => {
    if (!business || !roleForm.roleName) {
      setError('Please enter a role name');
      return;
    }

    // Validate that at least one permission is selected
    if (roleForm.permissions.length === 0) {
      setError('Please select at least one permission for this role');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const roleData = {
        ...(selectedRole ? { id: selectedRole.id } : {}),
        roleName: roleForm.roleName,
        permissions: roleForm.permissions
      };

      const response = await apiService.createOrUpdateRole(roleData);
      setBusiness(response.business);

      // Reset form and close modal
      setRoleForm({ roleName: '', permissions: [] });
      setSelectedRole(null);
      setShowRoleEditor(false);

      // Show success message
      alert(`Role ${selectedRole ? 'updated' : 'created'} successfully`);
    } catch (err: any) {
      console.error('Failed to create/update role:', err);
      setError(err.message || 'Failed to create/update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!business) return;

    // Check if any staff members are using this role
    const role = business.roles.find(r => r.id === roleId);
    if (!role) return;

    const staffUsingRole = business.staff.filter(s => s.role === role.roleName);
    if (staffUsingRole.length > 0) {
      alert(`Cannot delete this role. ${staffUsingRole.length} staff member(s) are currently assigned to it. Please reassign them first.`);
      return;
    }

    // Show confirmation dialog
    setConfirmDeleteRole({
      show: true,
      roleId,
      roleName: role.roleName
    });
  };

  const confirmDeleteRoleAction = async () => {
    if (!confirmDeleteRole || !business) return;

    const { roleId, roleName } = confirmDeleteRole;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.deleteRole(roleId);
      setBusiness(response.business);

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = `Role "${roleName}" deleted successfully`;
      document.body.appendChild(successMessage);

      // Remove the message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      setError(err.message || 'Failed to delete role. Please try again.');
      alert(err.message || 'Cannot delete this role. Either it\'s a default role or staff members are assigned to it.');
    } finally {
      setLoading(false);
      setConfirmDeleteRole(null);
    }
  };

  const handlePermissionChange = (module: Permission['module'], actions: Permission['actions']) => {
    const updatedPermissions = roleForm.permissions.filter(p => p.module !== module);
    if (actions.length > 0) {
      updatedPermissions.push({ module, actions });
    }
    setRoleForm(prev => ({ ...prev, permissions: updatedPermissions }));
  };



  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Loader className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Loading Business Data</h3>
          <p className="text-gray-500">Please wait while we load your business information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-600">Error Loading Business Data</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              // Fetch business details again
              apiService.getBusinessDetails()
                .then(response => {
                  if (response && response.business) {
                    setBusiness(response.business);
                  } else {
                    setError('No business data found. Please try again.');
                  }
                })
                .catch(err => {
                  console.error('Failed to fetch business details:', err);
                  setError('Failed to load business details. Please try again.');
                })
                .finally(() => {
                  setLoading(false);
                });
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">No Business Found</h3>
          <p className="text-gray-500">Please set up your business first.</p>
        </div>
      </div>
    );
  }

  const modules: Permission['module'][] = ['dashboard', 'orders', 'inventory', 'staff', 'rates', 'suppliers', 'customers'];
  const actions: Permission['actions'][0][] = ['read', 'create', 'update', 'delete'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-600">Manage your team and assign roles</p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search input */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                // Export staff data to CSV
                const staffData = business.staff.map(s => ({
                  'Staff ID': s.staffId,
                  'Name': s.name,
                  'Email': s.email,
                  'Phone': s.phone || '',
                  'Role': s.role,
                  'Salary': s.salary || 0,
                  'Joined Date': new Date(s.joinedAt).toLocaleDateString(),
                  'Status': s.isActive ? 'Active' : 'Inactive'
                }));
                exportToCSV(staffData, `${business.businessName}-Staff-${new Date().toISOString().split('T')[0]}`);
              }}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          {user.business?.isBusinessOwner && (
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={() => setShowRoleEditor(true)}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 ${loading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors`}
                whileHover={{ scale: loading ? 1 : 1.02 }}
              >
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                <span>Create Role</span>
              </motion.button>

              <motion.button
                onClick={() => setShowAddStaff(true)}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors`}
                whileHover={{ scale: loading ? 1 : 1.02 }}
              >
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                <span>Add Staff</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Role Codes Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">Role Codes</h3>
          <p className="text-blue-100">Share these role codes with your staff based on their positions</p>
          <div className="mt-2 p-3 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
            <p className="text-sm text-yellow-100">
              ⚠️ <strong>Important:</strong> Staff should use these ROLE CODES to join, not Staff IDs from the team list below!
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {business.roles.map((role) => (
            <div key={role.id} className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{role.roleName}</h4>
                {user.business?.isBusinessOwner && (
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setRoleForm({
                        roleName: role.roleName,
                        permissions: role.permissions
                      });
                      setShowRoleEditor(true);
                    }}
                    className="text-white/70 hover:text-white transition-colors"
                    title="Edit Role"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="text-sm font-mono text-blue-100 mb-3">{role.roleCode}</div>
              <div className="flex space-x-2">
                <motion.button
                  onClick={() => {
                    navigator.clipboard.writeText(role.roleCode);
                    setCopiedCode(role.roleCode);
                    setTimeout(() => setCopiedCode(''), 2000);
                  }}
                  className="flex items-center space-x-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors flex-1"
                  whileHover={{ scale: 1.05 }}
                >
                  {copiedCode === role.roleCode ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </motion.button>
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                  title="Delete Role"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Staff List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Team Members ({business.staff.length})
            {searchTerm && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                {business.staff.filter(staff =>
                  staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (staff.phone && staff.phone.includes(searchTerm)) ||
                  staff.staffId.includes(searchTerm)
                ).length} matching results
              </span>
            )}
          </h2>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear search
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortField === 'name') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('name');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Staff {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortField === 'staffId') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('staffId');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Staff ID {sortField === 'staffId' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortField === 'role') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('role');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortField === 'salary') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('salary');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Salary {sortField === 'salary' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortField === 'isActive') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('isActive');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Status {sortField === 'isActive' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortField === 'joinedAt') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('joinedAt');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Joined {sortField === 'joinedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                {user.business?.isBusinessOwner && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {business.staff
                .filter(staff =>
                  searchTerm === '' ||
                  staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (staff.phone && staff.phone.includes(searchTerm)) ||
                  staff.staffId.includes(searchTerm)
                )
                .sort((a, b) => {
                  // Handle different field types
                  if (sortField === 'name') {
                    return sortDirection === 'asc'
                      ? a.name.localeCompare(b.name)
                      : b.name.localeCompare(a.name);
                  } else if (sortField === 'staffId') {
                    return sortDirection === 'asc'
                      ? a.staffId.localeCompare(b.staffId)
                      : b.staffId.localeCompare(a.staffId);
                  } else if (sortField === 'role') {
                    return sortDirection === 'asc'
                      ? a.role.localeCompare(b.role)
                      : b.role.localeCompare(a.role);
                  } else if (sortField === 'salary') {
                    const aSalary = a.salary || 0;
                    const bSalary = b.salary || 0;
                    return sortDirection === 'asc'
                      ? aSalary - bSalary
                      : bSalary - aSalary;
                  } else if (sortField === 'isActive') {
                    return sortDirection === 'asc'
                      ? (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)
                      : (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1);
                  } else if (sortField === 'joinedAt') {
                    const aDate = new Date(a.joinedAt).getTime();
                    const bDate = new Date(b.joinedAt).getTime();
                    return sortDirection === 'asc'
                      ? aDate - bDate
                      : bDate - aDate;
                  }
                  return 0;
                })
                .map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="group relative">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                          <div className="text-sm text-gray-500">{staff.email}</div>
                          {staff.phone && <div className="text-sm text-gray-500">{staff.phone}</div>}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute left-0 top-0 mt-8 w-64 bg-white shadow-lg rounded-lg p-4 z-10 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <div className="text-sm mb-2">
                            <span className="font-semibold">Staff ID:</span> {staff.staffId}
                          </div>
                          <div className="text-sm mb-2">
                            <span className="font-semibold">Name:</span> {staff.name}
                          </div>
                          <div className="text-sm mb-2">
                            <span className="font-semibold">Email:</span> {staff.email}
                          </div>
                          <div className="text-sm mb-2">
                            <span className="font-semibold">Phone:</span> {staff.phone || 'Not provided'}
                          </div>
                          <div className="text-sm mb-2">
                            <span className="font-semibold">Role:</span> {staff.role}
                          </div>
                          <div className="text-sm mb-2">
                            <span className="font-semibold">Joined:</span> {new Date(staff.joinedAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Status:</span> {staff.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{staff.staffId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.business?.isBusinessOwner ? (
                        <select
                          value={staff.role}
                          onChange={(e) => handleUpdateStaffRole(staff.id, e.target.value)}
                          disabled={loading}
                          className={`text-sm border border-gray-300 rounded px-2 py-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {business.roles.map(role => (
                            <option key={role.id} value={role.roleName}>{role.roleName}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {staff.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {staff.salary ? `₹${staff.salary.toLocaleString()}` : '₹0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {staff.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(staff.joinedAt).toLocaleDateString()}
                    </td>
                    {user.business?.isBusinessOwner && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setStaffDetailsVisible(true);
                            }}
                            disabled={loading}
                            className={`text-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-900'}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveStaff(staff.id)}
                            disabled={loading}
                            className={`text-red-600 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-900'}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>

          {business.staff.filter(staff =>
            searchTerm === '' ||
            staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (staff.phone && staff.phone.includes(searchTerm)) ||
            staff.staffId.includes(searchTerm)
          ).length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">
                  {searchTerm ? 'No matching staff members found' : 'No Staff Members'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? 'Try adjusting your search criteria'
                    : 'Add your first team member to get started'}
                </p>
              </div>
            )}
        </div>
      </div>

      {/* Staff Details Modal */}
      {staffDetailsVisible && selectedStaff && (
        <StaffDetailsModal
          staff={selectedStaff}
          isBusinessOwner={user.business?.isBusinessOwner}
          onClose={() => {
            setStaffDetailsVisible(false);
            setSelectedStaff(null);
          }}
          onUpdate={async (staffId, updateData) => {
            try {
              setLoading(true);
              setError(null);
              const response = await apiService.updateStaffMember(staffId, updateData);
              setBusiness(response.business);

              // Update the selected staff data for the modal
              const updatedStaff = response.business.staff.find((s: any) => s.id === staffId);
              if (updatedStaff) {
                setSelectedStaff(updatedStaff);
              }
            } catch (err) {
              console.error('Failed to update staff member:', err);
              setError('Failed to update staff member. Please try again.');
            } finally {
              setLoading(false);
            }
          }}
        />
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Staff Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={staffForm.name}
                  onChange={handleStaffInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter staff name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={staffForm.email}
                  onChange={handleStaffInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={staffForm.phone}
                  onChange={handleStaffInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={staffForm.role}
                  onChange={handleStaffInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role</option>
                  {business.roles.map(role => (
                    <option key={role.id} value={role.roleName}>{role.roleName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary (₹)</label>
                <input
                  type="number"
                  name="salary"
                  value={staffForm.salary}
                  onChange={handleStaffInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter salary amount"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddStaff(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Staff
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Role Editor Modal */}
      {showRoleEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {selectedRole ? `Edit Role: ${selectedRole.roleName}` : 'Create Custom Role'}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={roleForm.roleName}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, roleName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role name"
                />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Permissions</h4>
                <div className="space-y-4">
                  {modules.map(module => (
                    <div key={module} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-2 capitalize">{module}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {actions.map(action => {
                          const currentPermission = roleForm.permissions.find(p => p.module === module);
                          const isChecked = currentPermission?.actions.includes(action) || false;

                          return (
                            <label key={action} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentActions = currentPermission?.actions || [];
                                  const newActions = e.target.checked
                                    ? [...currentActions, action]
                                    : currentActions.filter(a => a !== action);
                                  handlePermissionChange(module, newActions);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">{action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRoleEditor(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdateRole}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {selectedRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Role Confirmation Dialog */}
      {confirmDeleteRole && confirmDeleteRole.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Role</h3>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the role "{confirmDeleteRole.roleName}"? This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmDeleteRole(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoleAction}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Role
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;