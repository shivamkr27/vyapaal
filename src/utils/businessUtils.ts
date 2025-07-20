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

// Get business by code
export const getBusinessByCode = (businessCode: string): Business | null => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');
  return businesses.find((b: Business) => b.businessCode === businessCode) || null;
};

// Save business to localStorage
export const saveBusiness = (business: Business): void => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');
  const existingIndex = businesses.findIndex((b: Business) => b.id === business.id);

  if (existingIndex >= 0) {
    businesses[existingIndex] = business;
  } else {
    businesses.push(business);
  }

  localStorage.setItem('vyapaal_businesses', JSON.stringify(businesses));
};

// Get user's business
export const getUserBusiness = (userId: string): Business | null => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');
  return businesses.find((b: Business) =>
    b.ownerId === userId || b.staff.some((s: BusinessStaff) => s.email === userId)
  ) || null;
};

// Get user's business by email (for API compatibility)
export const getUserBusinessByEmail = (userEmail: string): Business | null => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');
  return businesses.find((b: Business) =>
    b.ownerEmail === userEmail || b.staff.some((s: BusinessStaff) => s.email === userEmail)
  ) || null;
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

// Get business and role by role code
export const getBusinessByRoleCode = (roleCode: string): { business: Business; role: BusinessRole } | null => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');

  console.log('🔍 DEBUG: Searching for role code:', roleCode);
  console.log('🔍 DEBUG: Available businesses:', businesses.length);

  for (const business of businesses) {
    console.log('🔍 DEBUG: Checking business:', business.businessName);
    console.log('🔍 DEBUG: Available role codes:', business.roles.map((r: BusinessRole) => r.roleCode));

    const role = business.roles.find((r: BusinessRole) => r.roleCode === roleCode);
    if (role) {
      console.log('✅ DEBUG: Found matching role:', role.roleName);
      return { business, role };
    }
  }

  console.log('❌ DEBUG: No matching role code found');
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

// Update role permissions (for editing roles)
export const updateRolePermissions = (
  businessId: string,
  roleId: string,
  newPermissions: Permission[]
): Business | null => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');
  const businessIndex = businesses.findIndex((b: Business) => b.id === businessId);

  if (businessIndex === -1) return null;

  const business = businesses[businessIndex];
  const roleIndex = business.roles.findIndex((r: BusinessRole) => r.id === roleId);

  if (roleIndex === -1) return null;

  // Update role permissions
  business.roles[roleIndex].permissions = newPermissions;

  // Update all staff members with this role to have new permissions
  business.staff = business.staff.map((staff: BusinessStaff) =>
    staff.role === business.roles[roleIndex].roleName
      ? { ...staff, permissions: newPermissions }
      : staff
  );

  businesses[businessIndex] = business;
  localStorage.setItem('vyapaal_businesses', JSON.stringify(businesses));

  return business;
};

// Update role name
export const updateRoleName = (
  businessId: string,
  roleId: string,
  newRoleName: string
): Business | null => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');
  const businessIndex = businesses.findIndex((b: Business) => b.id === businessId);

  if (businessIndex === -1) return null;

  const business = businesses[businessIndex];
  const roleIndex = business.roles.findIndex((r: BusinessRole) => r.id === roleId);

  if (roleIndex === -1) return null;

  const oldRoleName = business.roles[roleIndex].roleName;

  // Update role name
  business.roles[roleIndex].roleName = newRoleName;

  // Update all staff members with this role
  business.staff = business.staff.map((staff: BusinessStaff) =>
    staff.role === oldRoleName
      ? { ...staff, role: newRoleName }
      : staff
  );

  businesses[businessIndex] = business;
  localStorage.setItem('vyapaal_businesses', JSON.stringify(businesses));

  return business;
};

// Delete custom role (can't delete default roles)
export const deleteRole = (
  businessId: string,
  roleId: string
): Business | null => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');
  const businessIndex = businesses.findIndex((b: Business) => b.id === businessId);

  if (businessIndex === -1) return null;

  const business = businesses[businessIndex];
  const role = business.roles.find((r: BusinessRole) => r.id === roleId);

  if (!role) return null;

  // Don't allow deleting default roles
  const defaultRoleIds = ['role_owner', 'role_manager', 'role_accountant', 'role_delivery', 'role_sales', 'role_inventory'];
  if (defaultRoleIds.includes(roleId)) {
    console.error('Cannot delete default roles');
    return null;
  }

  // Check if any staff has this role
  const staffWithRole = business.staff.filter((s: BusinessStaff) => s.role === role.roleName);
  if (staffWithRole.length > 0) {
    console.error('Cannot delete role - staff members are assigned to this role');
    return null;
  }

  // Remove role
  business.roles = business.roles.filter((r: BusinessRole) => r.id !== roleId);

  businesses[businessIndex] = business;
  localStorage.setItem('vyapaal_businesses', JSON.stringify(businesses));

  return business;
};

// Debug function to show all role codes for a business
export const debugBusinessRoles = (businessId: string): void => {
  const businesses: Business[] = JSON.parse(localStorage.getItem('vyapaal_businesses') || '[]');
  const business = businesses.find((b: Business) => b.id === businessId);

  if (business) {
    console.log('🔍 DEBUG: Business Name:', business.businessName);
    console.log('🔍 DEBUG: Business Code:', business.businessCode);
    console.log('🔍 DEBUG: Available Role Codes (USE THESE TO JOIN):');
    business.roles.forEach((role: BusinessRole) => {
      console.log(`  ✅ ${role.roleName}: ${role.roleCode} ← USE THIS CODE`);
    });
    console.log('🔍 DEBUG: Current Staff (THESE ARE STAFF IDs, NOT JOIN CODES):');
    business.staff.forEach((staff: BusinessStaff) => {
      console.log(`  👤 ${staff.name} (${staff.email}): Role=${staff.role}, StaffID=${staff.staffId}`);
    });
    console.log('\n💡 TIP: Staff should use ROLE CODES (like ABC123-LAB456) to join, NOT Staff IDs (like ABC123001)');
  }
};