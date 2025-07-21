import { Business, BusinessStaff, BusinessRole, Permission, UserRole } from '../types';

// Generate unique 6-digit business code
export const generateBusinessCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Generate staff ID (businessCode + unique number)
export const generateStaffId = (businessCode: string, existingStaff: BusinessStaff[]): string => {
  const staffCount = existingStaff.length + 1;
  return `${businessCode}${staffCount.toString().padStart(3, '0')}`;
};

// Generate role code (for staff to join with specific role)
export const generateRoleCode = (businessCode: string, roleName: string): string => {
  const rolePrefix = roleName.substring(0, 3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${businessCode}-${rolePrefix}${randomSuffix}`;
};

// Default role permissions
export const getDefaultRolePermissions = (role: UserRole): Permission[] => {
  const rolePermissions: Record<UserRole, Permission[]> = {
    owner: [
      { module: 'dashboard', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'orders', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'inventory', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'staff', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'rates', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'suppliers', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'customers', actions: ['read', 'create', 'update', 'delete'] }
    ],
    manager: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'orders', actions: ['read', 'create', 'update'] },
      { module: 'inventory', actions: ['read', 'create', 'update'] },
      { module: 'staff', actions: ['read'] },
      { module: 'rates', actions: ['read', 'update'] },
      { module: 'suppliers', actions: ['read', 'create', 'update'] },
      { module: 'customers', actions: ['read', 'create', 'update'] }
    ],
    accountant: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'orders', actions: ['read', 'update'] },
      { module: 'inventory', actions: ['read'] },
      { module: 'rates', actions: ['read'] },
      { module: 'suppliers', actions: ['read', 'create', 'update'] },
      { module: 'customers', actions: ['read'] }
    ],
    delivery_boy: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'orders', actions: ['read'] },
      { module: 'inventory', actions: ['read'] },
      { module: 'rates', actions: ['read'] },
      { module: 'customers', actions: ['read'] }
    ],
    sales_person: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'orders', actions: ['read', 'create', 'update'] },
      { module: 'inventory', actions: ['read'] },
      { module: 'rates', actions: ['read'] },
      { module: 'customers', actions: ['read', 'create', 'update'] }
    ],
    inventory_manager: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'orders', actions: ['read'] },
      { module: 'inventory', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'rates', actions: ['read', 'update'] },
      { module: 'suppliers', actions: ['read', 'create', 'update'] }
    ],
    custom: [] // Custom roles will have permissions set by business owner
  };

  return rolePermissions[role] || [];
};

// Check if user has permission for specific action
export const hasPermission = (
  userPermissions: Permission[],
  module: Permission['module'],
  action: Permission['actions'][0]
): boolean => {
  const modulePermission = userPermissions.find(p => p.module === module);
  return modulePermission ? modulePermission.actions.includes(action) : false;
};

// Create new business
export const createBusiness = (
  businessName: string,
  ownerEmail: string,
  ownerId: string
): Business => {
  const businessCode = generateBusinessCode();

  return {
    id: Date.now().toString(),
    businessCode,
    businessName,
    ownerEmail,
    ownerId,
    createdAt: new Date().toISOString(),
    staff: [],
    roles: [
      {
        id: 'role_owner',
        roleName: 'Business Owner',
        permissions: getDefaultRolePermissions('owner'),
        roleCode: generateRoleCode(businessCode, 'Owner'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'role_manager',
        roleName: 'Manager',
        permissions: getDefaultRolePermissions('manager'),
        roleCode: generateRoleCode(businessCode, 'Manager'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'role_accountant',
        roleName: 'Accountant',
        permissions: getDefaultRolePermissions('accountant'),
        roleCode: generateRoleCode(businessCode, 'Accountant'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'role_delivery',
        roleName: 'Delivery Boy',
        permissions: getDefaultRolePermissions('delivery_boy'),
        roleCode: generateRoleCode(businessCode, 'Delivery'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'role_sales',
        roleName: 'Sales Person',
        permissions: getDefaultRolePermissions('sales_person'),
        roleCode: generateRoleCode(businessCode, 'Sales'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'role_inventory',
        roleName: 'Inventory Manager',
        permissions: getDefaultRolePermissions('inventory_manager'),
        roleCode: generateRoleCode(businessCode, 'Inventory'),
        createdAt: new Date().toISOString()
      }
    ]
  };
};

// Add staff to business
export const addStaffToBusiness = (
  business: Business,
  staffData: {
    name: string;
    email: string;
    phone: string;
    role: string;
  }
): Business => {
  const staffId = generateStaffId(business.businessCode, business.staff);
  const role = business.roles.find(r => r.roleName === staffData.role);

  const newStaff: BusinessStaff = {
    id: Date.now().toString(),
    staffId,
    name: staffData.name,
    email: staffData.email,
    phone: staffData.phone,
    role: staffData.role,
    permissions: role ? role.permissions : [],
    joinedAt: new Date().toISOString(),
    isActive: true
  };

  return {
    ...business,
    staff: [...business.staff, newStaff]
  };
};

// Get business by code - API only (placeholder)
export const getBusinessByCode = (businessCode: string): Business | null => {
  console.log('🔄 Business API not implemented yet');
  return null;
};

// Save business - API only (placeholder)
export const saveBusiness = (business: Business): void => {
  console.log('🔄 Business save API not implemented yet');
};

// Get user's business - API only (placeholder)
export const getUserBusiness = (userId: string): Business | null => {
  console.log('🔄 Business API not implemented yet');
  return null;
};

// Get user's business by email - API only (placeholder)
export const getUserBusinessByEmail = (userEmail: string): Business | null => {
  console.log('🔄 Business API not implemented yet');
  return null;
};

// Get the correct user ID for localStorage data (for API compatibility)
export const getDataUserId = (userEmail: string): string | null => {
  const business = getUserBusinessByEmail(userEmail);
  if (!business) return null;

  // If user is the business owner, return the owner ID
  if (business.ownerEmail === userEmail) {
    return business.ownerId;
  }

  // If user is staff, find their original user ID from when they joined
  const staffMember = business.staff.find((s: BusinessStaff) => s.email === userEmail);
  if (staffMember) {
    // For staff, we need to find their original user ID
    // Since we don't store it, we'll use the business owner's ID for now
    // This means staff will see the same data as the owner (which might be intended)
    return business.ownerId;
  }

  return null;
};

// Get business and role by role code - API only (placeholder)
export const getBusinessByRoleCode = (roleCode: string): { business: Business; role: BusinessRole } | null => {
  console.log('🔄 Business role API not implemented yet');
  return null;
};

// Join business with role code
export const joinBusinessWithRoleCode = (
  roleCode: string,
  userData: {
    name: string;
    email: string;
    phone: string;
  }
): { business: Business; role: BusinessRole; staffId: string } | null => {
  const result = getBusinessByRoleCode(roleCode);
  if (!result) return null;

  const { business, role } = result;

  // Check if user already exists in business
  const existingStaff = business.staff.find(s => s.email === userData.email);
  if (existingStaff) {
    // User already exists - return existing info instead of error
    console.log('User already exists in business, returning existing data');
    return { business, role, staffId: existingStaff.staffId };
  }

  // Generate staff ID
  const staffId = generateStaffId(business.businessCode, business.staff);

  // Add staff to business
  const newStaff: BusinessStaff = {
    id: Date.now().toString(),
    staffId,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    role: role.roleName,
    permissions: role.permissions,
    joinedAt: new Date().toISOString(),
    isActive: true
  };

  const updatedBusiness = {
    ...business,
    staff: [...business.staff, newStaff]
  };

  saveBusiness(updatedBusiness);

  return { business: updatedBusiness, role, staffId };
};

// Update role permissions - API only (placeholder)
export const updateRolePermissions = (
  businessId: string,
  roleId: string,
  newPermissions: Permission[]
): Business | null => {
  console.log('🔄 Role permissions API not implemented yet');
  return null;
};

// Update role name - API only (placeholder)
export const updateRoleName = (
  businessId: string,
  roleId: string,
  newRoleName: string
): Business | null => {
  console.log('🔄 Role name update API not implemented yet');
  return null;
};

// Delete custom role - API only (placeholder)
export const deleteRole = (
  businessId: string,
  roleId: string
): Business | null => {
  console.log('🔄 Role delete API not implemented yet');
  return null;
};

// Debug function - API only (placeholder)
export const debugBusinessRoles = (businessId: string): void => {
  console.log('🔄 Business debug API not implemented yet');
};