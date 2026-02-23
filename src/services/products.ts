/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from './api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  parentId: number | null;
  isActive: boolean;
  displayOrder: number;
}

export interface Product {
  stock: number;
  imageUrl: string;
  compareAtPrice: number;
  price: number;
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  brand: string | null;
  fragranceNotes: any | null; // Changed from '' | null to any | null for flexibility
  categoryId: number | null;
  basePrice: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null; // Optional nested category object
}

// Type for creating/updating products (only the fields that the client can send)
export interface CreateProductData {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  brand?: string | null;
  fragranceNotes?: any | null;
  categoryId?: number | null;
  basePrice: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

// Type for updating products (all fields optional except id)
export type UpdateProductData = Partial<CreateProductData>;

export interface ProductsResponse {
  data: Product[];
  total: number;
}

export interface ProductsQueryParams {
  featured?: boolean;
  category_id?: string;
  search?: string;
  sort?: 'newest' | 'price-low' | 'price-high' | 'name';
  page?: number;
  limit?: number;
}

class ProductsService {
  private readonly baseUrl = '/products';

  async getProducts(params?: ProductsQueryParams): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.featured) queryParams.append('featured', 'true');
    if (params?.category_id && params.category_id !== 'all') {
      queryParams.append('categoryId', params.category_id);
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await api.get<Product[]>(url);
    return response.data;
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await api.get<Product>(`${this.baseUrl}/slug/${slug}`);
    return response.data;
  }

  async getProductById(id: string): Promise<Product> {
    const response = await api.get<Product>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    const queryParams = limit ? `?limit=${limit}` : '';
    const response = await api.get<Product[]>(`${this.baseUrl}/featured${queryParams}`);
    return response.data;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const response = await api.get<Product[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Updated to accept CreateProductData instead of Omit<Product, 'id' | 'created_at'>
  async createProduct(productData: CreateProductData): Promise<Product> {
    const response = await api.post<Product>(this.baseUrl, productData);
    return response.data;
  }

  // Updated to accept UpdateProductData (Partial<CreateProductData>)
  async updateProduct(id: string, productData: UpdateProductData): Promise<Product> {
    const response = await api.patch<Product>(`${this.baseUrl}/${id}`, productData);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
}

export default new ProductsService();