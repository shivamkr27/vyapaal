// Use local API in development, production API in production
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : 'https://vyapaal.vercel.app/api';

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

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      body,
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
}

export default new ApiService();  // B
usiness setup
  async updateBusiness(businessData: { businessName: string; businessCode: string; isBusinessOwner: boolean }): Promise < any > {
  return this.request('/auth/business', {
    method: 'PUT',
    body: businessData,
  });
}

  // User preferences
  async updatePreferences(preferences: { theme: string; notifications: boolean; language: string }): Promise < any > {
  return this.request('/auth/preferences', {
    method: 'PUT',
    body: preferences,
  });
}

  // Alerts
  async addAlert(alertData: { type: string; message: string }): Promise < any > {
  return this.request('/auth/alerts', {
    method: 'POST',
    body: alertData,
  });
}

  async clearAlerts(): Promise < any > {
  return this.request('/auth/alerts', {
    method: 'DELETE',
  });
}