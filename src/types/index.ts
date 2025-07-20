export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  businessId?: string; // ID of the business they belong to
  businessCode?: string; // Unique business code (only for business owners)
  role?: UserRole; // Role in the business
  isBusinessOwner?: boolean; // Whether they own a business
  businessName?: string; // Name of their business
}

export interface Business {
  id: string;
  businessCode: string; // Unique 6-digit code
  businessName: string;
  ownerEmail: string;
  ownerId: string;
  createdAt: string;
  staff: BusinessStaff[];
  roles: BusinessRole[];
}

export interface BusinessStaff {
  id: string;
  staffId: string; // businessCode + unique number
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: Permission[];
  joinedAt: string;
  isActive: boolean;
}

export interface BusinessRole {
  id: string;
  roleName: string;
  permissions: Permission[];
  roleCode: string; // Unique code for this role
  createdAt: string;
}

export interface Permission {
  module: 'orders' | 'inventory' | 'staff' | 'rates' | 'suppliers' | 'customers' | 'dashboard';
  actions: ('read' | 'create' | 'update' | 'delete')[];
}

export type UserRole = 'owner' | 'manager' | 'accountant' | 'delivery_boy' | 'sales_person' | 'inventory_manager' | 'custom';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  item: string;
  category: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  paid: number;
  due: number;
  status: 'pending' | 'delivered';
  deliveryDate: string;
  createdAt: string;
  userId: string;
}

export interface Rate {
  id: string;
  item: string;
  category: string;
  rate: number;
  userId: string;
  createdAt: string;
}

export interface Inventory {
  id: string;
  item: string;
  category: string;
  quantity: number;
  threshold: number;
  userId: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  supplierName: string;
  billNo: string;
  date: string;
  item: string;
  category: string;
  rate: number;
  quantity: number;
  totalAmount: number;
  paid: number;
  due: number;
  userId: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  staffId: string;
  staffName: string;
  phoneNo: string;
  role: string;
  joiningDate: string;
  salary: number;
  userId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  userId: string;
  createdAt: string;
  creditBalance?: number; // Track excess payments
}