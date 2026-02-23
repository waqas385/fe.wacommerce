import { api } from './api';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  role: 'admin' | 'customer' | 'user';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Type for role update
export interface UpdateUserRoleData {
  role: 'admin' | 'customer' | 'user';
}

// Response type for updateRole endpoint
export interface UpdateRoleResponse {
  message: string;
  user: {
    id: number;
    email: string;
    role: 'admin' | 'customer' | 'user';
  };
}

export interface UsersQueryParams {
  search?: string;
  role?: 'admin' | 'customer' | 'user';
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'email' | 'fullName';
  sortOrder?: 'ASC' | 'DESC';
}

class UsersService {
  private readonly baseUrl = '/users';

  /**
   * Get all users - matches your controller's findAll method
   */
  async getUsers(params?: UsersQueryParams): Promise<UserProfile[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await api.get<UserProfile[]>(url);
    
    return response.data;
  }

  /**
   * Update user role - matches your new PATCH endpoint
   */
  async updateUserRole(userId: number, roleData: UpdateUserRoleData): Promise<UpdateRoleResponse> {
    const response = await api.patch<UpdateRoleResponse>(`${this.baseUrl}/${userId}/role`, roleData);
    return response.data;
  }

  async getUserById(id: string): Promise<UserProfile> {
    const response = await api.get<UserProfile>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getUserCount(): Promise<number> {
    const response = await api.get<{ count: number }>(`${this.baseUrl}/count`);
    return response.data.count;
  }
}

export default new UsersService();