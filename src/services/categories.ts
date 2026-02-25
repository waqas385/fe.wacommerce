import { api } from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at?: string;
}

export interface CategoriesResponse {
  items: Category[];
  total: number;
}

export interface CategoriesQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  includeProductCount?: boolean;
  includeChildren?: boolean;
  includeParent?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

class CategoriesService {
  private readonly baseUrl = '/categories';

  async getCategories(params?: CategoriesQueryParams): Promise<Category[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.includeProductCount) queryParams.append('includeProductCount', 'true');
    if (params?.includeChildren) queryParams.append('includeChildren', 'true');
    if (params?.includeParent) queryParams.append('includeParent', 'true');
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await api.get<CategoriesResponse | Category[]>(url);

    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && 'items' in response.data) {
      return response.data.items;
    }
    
    return [];
  }

  async getAllCategories(params?: CategoriesQueryParams): Promise<CategoriesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.includeProductCount) queryParams.append('includeProductCount', 'true');
    if (params?.includeChildren) queryParams.append('includeChildren', 'true');
    if (params?.includeParent) queryParams.append('includeParent', 'true');
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await api.get<CategoriesResponse>(url);
    
    // Ensure we return the expected structure
    return {
      items: response.data.items || [],
      total: response.data.total || 0
    };
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await api.get<Category>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const response = await api.get<Category>(`${this.baseUrl}/slug/${slug}`);
    return response.data;
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const response = await api.post<Category>(this.baseUrl, categoryData);
    return response.data;
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
    const response = await api.patch<Category>(`${this.baseUrl}/${id}`, categoryData);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getCategoriesWithProductCount(): Promise<(Category & { product_count: number })[]> {
    const response = await api.get<(Category & { product_count: number })[]>(`${this.baseUrl}/with-count`);
    return response.data;
  }

  async getCategoryTree(): Promise<Category[]> {
    const response = await api.get<Category[]>(`${this.baseUrl}/tree`);
    return response.data;
  }
}

export default new CategoriesService();