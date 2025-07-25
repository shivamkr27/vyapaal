// Dynamic API URL based on environment
const API_BASE_URL = (() => {
  // Check if we're on a Vercel deployment
  if (typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('vercel.com') ||
    import.meta.env.PROD
  )) {
    return '/api';
  }

  // In development, use localhost with port detection
  let port = 5000;
  if (typeof window !== 'undefined') {
    const storedPort = sessionStorage.getItem('apiPort');
    if (storedPort) {
      port = parseInt(storedPort, 10);
    }
  }

  return `http://localhost:${port}/api`;
})();

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface OrderItem {
  item: string;
  category: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface OrderData {
  customerName: string;
  customerPhone: string;
  item: string;
  category: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  paid: number;
  due: number;
  deliveryDate: string;
  items?: OrderItem[]; // For multiple items in an order
}

// Custom request options interface
interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

class ApiService {
  private token: string | null;

  constructor() {
    this.token = null;
  }

  setToken(token: string): void {
    this.token = token;
  }

  removeToken(): void {
    this.token = null;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Handle body serialization
    let body: string | undefined;
    if (options.body) {
      if (typeof options.body === 'object') {
        body = JSON.stringify(options.body);
      } else if (typeof options.body === 'string') {
        body = options.body;
      }
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    console.log(`API Request: ${options.method || 'GET'} ${url} with token: ${this.token ? 'present' : 'missing'}`);

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      body,
      credentials: 'include', // Include cookies in the request
    };

    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);

      // Get response text first to handle both JSON and HTML responses
      const responseText = await response.text();
      console.log(`📄 Raw response (${response.status}):`, responseText.substring(0, 200));

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`, responseText);

        // Try to parse as JSON first
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch {
          // If not JSON, check if it's HTML (common error page)
          if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
            throw new Error(`Server returned HTML instead of JSON. This usually means the API endpoint doesn't exist or there's a routing issue. Status: ${response.status}`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText.substring(0, 100)}`);
        }
      }

      // Try to parse successful response as JSON
      try {
        const data = JSON.parse(responseText);
        console.log(`✅ API Success: ${options.method || 'GET'} ${url}`, data);
        return data;
      } catch {
        console.error('❌ Failed to parse JSON response:', responseText.substring(0, 200));
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async register(userData: RegisterData): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/auth/register', {
      method: 'POST',
      body: userData,
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  logout(): void {
    this.removeToken();
  }

  // Orders methods
  async getOrders(date: string | null = null): Promise<any[]> {
    const query = date ? `?date=${date}` : '';
    return this.request(`/orders${query}`);
  }

  async createOrder(orderData: OrderData): Promise<any> {
    return this.request('/orders', {
      method: 'POST',
      body: orderData,
    });
  }

  async updateOrder(id: string, orderData: Partial<OrderData>): Promise<any> {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: orderData,
    });
  }

  async deleteOrder(id: string): Promise<any> {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Rates methods
  async getRates(): Promise<any[]> {
    return this.request('/rates');
  }

  async createRate(rateData: any): Promise<any> {
    return this.request('/rates', {
      method: 'POST',
      body: rateData,
    });
  }

  async updateRate(id: string, rateData: any): Promise<any> {
    return this.request(`/rates/${id}`, {
      method: 'PUT',
      body: rateData,
    });
  }

  async deleteRate(id: string): Promise<any> {
    return this.request(`/rates/${id}`, {
      method: 'DELETE',
    });
  }

  // Inventory methods
  async getInventory(): Promise<any[]> {
    return this.request('/inventory');
  }

  async createInventory(inventoryData: any): Promise<any> {
    return this.request('/inventory', {
      method: 'POST',
      body: inventoryData,
    });
  }

  async updateInventory(id: string, inventoryData: any): Promise<any> {
    return this.request(`/inventory/${id}`, {
      method: 'PUT',
      body: inventoryData,
    });
  }

  async deleteInventory(id: string): Promise<any> {
    return this.request(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // Supplier methods
  async getSuppliers(): Promise<any[]> {
    return this.request('/suppliers');
  }

  async createSupplier(supplierData: any): Promise<any> {
    return this.request('/suppliers', {
      method: 'POST',
      body: supplierData,
    });
  }

  async updateSupplier(id: string, supplierData: any): Promise<any> {
    return this.request(`/suppliers/${id}`, {
      method: 'PUT',
      body: supplierData,
    });
  }

  async deleteSupplier(id: string): Promise<any> {
    return this.request(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // Staff methods
  async getStaff(): Promise<any[]> {
    return this.request('/staff');
  }

  async createStaff(staffData: any): Promise<any> {
    return this.request('/staff', {
      method: 'POST',
      body: staffData,
    });
  }

  async updateStaff(id: string, staffData: any): Promise<any> {
    console.log('API updateStaff called with ID:', id, 'Data:', staffData);
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: staffData,
    });
  }

  async deleteStaff(id: string): Promise<any> {
    return this.request(`/staff/${id}`, {
      method: 'DELETE',
    });
  }

  async assignStaffRole(id: string, roleData: { role: string; roleCode: string; permissions: any[] }): Promise<any> {
    return this.request(`/staff/${id}/role`, {
      method: 'PUT',
      body: roleData,
    });
  }

  // Customers methods
  async getCustomers(): Promise<any[]> {
    return this.request('/customers');
  }

  async createCustomer(customerData: any): Promise<any> {
    return this.request('/customers', {
      method: 'POST',
      body: customerData,
    });
  }

  async updateCustomer(id: string, customerData: any): Promise<any> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: customerData,
    });
  }

  async deleteCustomer(id: string): Promise<any> {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ message: string; timestamp: string }> {
    return this.request('/health');
  }

  // Business setup
  async updateBusiness(businessData: { businessName: string; businessCode: string; isBusinessOwner: boolean }): Promise<any> {
    return this.request('/auth/business', {
      method: 'PUT',
      body: businessData,
    });
  }

  // Join business
  async joinBusiness(joinData: { businessCode: string; roleCode: string; phone: string }): Promise<any> {
    return this.request('/business/join', {
      method: 'POST',
      body: joinData,
    });
  }

  // Get business details including staff and roles
  async getBusinessDetails(): Promise<any> {
    return this.request('/business/details');
  }

  // Create or update role
  async createOrUpdateRole(roleData: {
    id?: string;
    roleName: string;
    permissions: Array<{
      module: string;
      actions: string[];
    }>
  }): Promise<any> {
    return this.request('/business/roles', {
      method: 'POST',
      body: roleData,
    });
  }

  // Delete role
  async deleteRole(roleId: string): Promise<any> {
    return this.request(`/business/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // Add staff member
  async addStaffMember(staffData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    salary?: number;
  }): Promise<any> {
    return this.request('/business/staff', {
      method: 'POST',
      body: staffData,
    });
  }

  // Update staff role
  async updateStaffRole(staffId: string, role: string): Promise<any> {
    return this.request(`/business/staff/${staffId}/role`, {
      method: 'PUT',
      body: { role },
    });
  }

  // Update staff member (role, salary, etc.)
  async updateStaffMember(staffId: string, updateData: {
    role?: string;
    salary?: number;
    name?: string;
    phone?: string;
  }): Promise<any> {
    console.log('API: Updating staff member', staffId, updateData);
    return this.request(`/business/staff/${staffId}`, {
      method: 'PUT',
      body: updateData,
    });
  }

  // Update staff salary
  async updateStaffSalary(staffId: string, salary: number): Promise<any> {
    return this.request(`/business/staff/${staffId}/salary`, {
      method: 'PUT',
      body: { salary },
    });
  }

  // Remove staff member
  async removeStaffMember(staffId: string): Promise<any> {
    return this.request(`/business/staff/${staffId}`, {
      method: 'DELETE',
    });
  }

  // User preferences
  async updatePreferences(preferences: { theme: string; notifications: boolean; language: string }): Promise<any> {
    return this.request('/auth/preferences', {
      method: 'PUT',
      body: preferences,
    });
  }

  // Verify token and get current user
  async verifyToken(): Promise<ApiResponse> {
    return this.request('/auth/verify');
  }

  // Alerts
  async addAlert(alertData: { type: string; message: string }): Promise<any> {
    return this.request('/auth/alerts', {
      method: 'POST',
      body: alertData,
    });
  }

  async clearAlerts(): Promise<any> {
    return this.request('/auth/alerts', {
      method: 'DELETE',
    });
  }
}

export default new ApiService();