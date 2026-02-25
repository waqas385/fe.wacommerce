import { api } from './api';

export interface OrderUser {
  id: number;
  email: string;
  fullName: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string | null;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  items: OrderItem[];
  user?: OrderUser | null;
  shippingAddress?: any;
  billingAddress?: any;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
}

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface UpdateOrderStatusData {
  status: string;
  notes?: string;
}

interface CreateOrderItemDto {
  productId: number;
  quantity: number;
}

interface CreateOrderDto {
  notes?: string;
  items: CreateOrderItemDto[];
}

class OrdersService {
  private readonly baseUrl = '/orders';

  async getOrders(params?: OrdersQueryParams): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.search) queryParams.append('search', params.search);

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await api.get<OrdersResponse>(url);
    return response.data;
  }

  async getOrderById(id: number): Promise<Order> {
    const response = await api.get<Order>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateOrderStatus(id: number, statusData: UpdateOrderStatusData): Promise<Order> {
    const response = await api.patch<Order>(`${this.baseUrl}/${id}/status`, statusData);
    return response.data;
  }

  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    const response = await api.get<Order[]>(`${this.baseUrl}/recent?limit=${limit}`);
    return response.data;
  }

  async cancelOrder(id: number): Promise<Order> {
    const response = await api.patch<Order>(`${this.baseUrl}/${id}/cancel`, {});
    return response.data;
  }

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    const response = await api.post<Order>(this.baseUrl, orderData);
    return response.data;
  }
}

export default new OrdersService();