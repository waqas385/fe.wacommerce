import { api } from './api';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  recentOrders: {
    id: string;
    status: string;
    total: number;
    created_at: string;
  }[];
}

class StatsService {
  private readonly baseUrl = '/stats';

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>(`${this.baseUrl}/dashboard`);
    return response.data;
  }

  async getRevenueStats(period?: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    const queryParams = period ? `?period=${period}` : '';
    const response = await api.get(`${this.baseUrl}/revenue${queryParams}`);
    return response.data;
  }

  async getOrderStats(period?: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    const queryParams = period ? `?period=${period}` : '';
    const response = await api.get(`${this.baseUrl}/orders${queryParams}`);
    return response.data;
  }
}

export default new StatsService();