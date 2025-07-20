const API_BASE_URL = import.meta.env.PROD
  ? 'https://vyapaal.vercel.app/api'
  : 'http://localhost:5000/api';

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

class ApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('vyapaal_token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('vyapaal_token', token);
  }

  removeToken(): void {
    this.token = null;
    localStorage.removeItem('vyapaal_token');
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
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

export default new ApiService();