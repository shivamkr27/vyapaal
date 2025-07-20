import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Copy,
  Key
} from 'lucide-react';
import { User, Business, BusinessStaff, BusinessRole, Permission } from '../types';
import { getUserBusiness, getUserBusinessByEmail, saveBusiness, addStaffToBusiness, getDefaultRolePermissions, updateRolePermissions, updateRoleName, deleteRole } from '../utils/businessUtils';

interface StaffManagementProps {
  user: User;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ user }) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<BusinessStaff | null>(null);
  const [selectedRole, setSelectedRole] = useState<BusinessRole | null>(null);
  const [copiedCode, setCopiedCode] = useState<string>('');

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });

  const [roleForm, setRoleForm] = useState({
    roleName: '',
    permissions: [] as Permission[]
  });

  useEffect(() => {
    const userBusiness = getUserBusinessByEmail(user.email);
    setBusiness(userBusiness);
  }, [user.email]);

  const handleStaffInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStaffForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStaff = () => {
    if (!business || !staffForm.name || !staffForm.email || !staffForm.role) return;

    const updatedBusiness = addStaffToBusiness(business, staffForm);
    saveBusiness(updatedBusiness);
    setBusiness(updatedBusiness);
    setStaffForm({ name: '', email: '', phone: '', role: '' });
    setShowAddStaff(false);
  };

  const handleUpdateStaffRole = (staffId: string, newRole: string) => {
    if (!business) return;

    const role = business.roles.find(r => r.roleName === newRole);
    const updatedBusiness = {
      ...business,
      staff: business.staff.map(s =>
        s.id === staffId
          ? { ...s, role: newRole, permissions: role ? role.permissions : [] }
          : s
      )
    };

    saveBusiness(updatedBusiness);
    setBusiness(updatedBusiness);
  };

  const handleRemoveStaff = (staffId: string) => {
    if (!business) return;

    const updatedBusiness = {
      ...business,
      staff: business.staff.filter(s => s.id !== staffId)
    };

    saveBusiness(updatedBusiness);
    setBusiness(updatedBusiness);
  };

  const handleCreateOrUpdateRole = () => {
    if (!business || !roleForm.roleName) return;

    if (selectedRole) {
      // EDITING EXISTING ROLE
      const updatedBusiness = updateRolePermissions(business.id, selectedRole.id, roleForm.permissions);
      if (updatedBusiness) {
        // Also update role name if changed
        if (selectedRole.roleName !== roleForm.roleName) {
          const finalBusiness = updateRoleName(business.id, selectedRole.id, roleForm.roleName);
          setBusiness(finalBusiness);
        } else {
          setBusiness(updatedBusiness);
        }
      }
    } else {
      // CREATING NEW ROLE
      const generateRoleCode = (businessCode: string, roleName: string): string => {
        const rolePrefix = roleName.substring(0, 3).toUpperCase();
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${businessCode}-${rolePrefix}${randomSuffix}`;
      };

      const newRole: BusinessRole = {
        id: `role_${Date.now()}`,
        roleName: roleForm.roleName,
        permissions: roleForm.permissions,
        roleCode: generateRoleCode(business.businessCode, roleForm.roleName),
        createdAt: new Date().toISOString()
      };

      const updatedBusiness = {
        ...business,
        roles: [...business.roles, newRole]
      };

      saveBusiness(updatedBusiness);
      setBusiness(updatedBusiness);
    }

    // Reset form and close modal
    setRoleForm({ roleName: '', permissions: [] });
    setSelectedRole(null);
    setShowRoleEditor(false);
  };

  const handleDeleteRole = (roleId: string) => {
    if (!business) return;

    const updatedBusiness = deleteRole(business.id, roleId);
    if (updatedBusiness) {
      setBusiness(updatedBusiness);
    } else {
      alert('Cannot delete this role. Either it\'s a default role or staff members are assigned to it.');
    }
  };

  const handlePermissionChange = (module: Permission['module'], actions: Permission['actions']) => {
    const updatedPermissions = roleForm.permissions.filter(p => p.module !== module);
    if (actions.length > 0) {
      updatedPermissions.push({ module, actions });
    }
    setRoleForm(prev => ({ ...prev, permissions: updatedPermissions }));
  };



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
        </div>

        {user.isBusinessOwner && (
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={() => setShowRoleEditor(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <Shield className="h-4 w-4" />
              <span>Create Role</span>
            </motion.button>

            <motion.button
              onClick={() => setShowAddStaff(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Staff</span>
            </motion.button>
          </div>
        )}
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
                {user.isBusinessOwner && (
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
                  onClick={() => {
                    setSelectedRole(role);
                  }}
                  className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                  title="View Permissions"
                >
                  <Eye className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Staff List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Team Members ({business.staff.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                {user.isBusinessOwner && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {business.staff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                      <div className="text-sm text-gray-500">{staff.email}</div>
                      {staff.phone && <div className="text-sm text-gray-500">{staff.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">{staff.staffId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isBusinessOwner ? (
                      <select
                        value={staff.role}
                        onChange={(e) => handleUpdateStaffRole(staff.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
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
                  {user.isBusinessOwner && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedStaff(staff)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveStaff(staff.id)}
                          className="text-red-600 hover:text-red-900"
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

          {business.staff.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No Staff Members</h3>
              <p className="text-gray-500">Add your first team member to get started</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default StaffManagement;