import { api } from './api';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

interface UserProfile {
  email: string;
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  lastLoginAt: string;
  createdAt: string;
}

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
}

export class ApiServiceError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
  }
}

export const authService = {
  async signup(email: string, password: string, fullName: string, phoneNumber: string) {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      fullName,
      phoneNumber
    });

    // Check if there's an error in the response
    if (response.error) {
      return { 
        data: null, 
        error: { 
          message: response.error.message,
          status: response.error.status 
        } 
      };
    }

    // Handle successful response
    if (response.data?.accessToken) {
      api.setToken(response.data.accessToken);
    }

    return { data: response.data, error: null };
  },

  async signin(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    // Check if there's an error in the response
    if (response.error) {
      return { 
        data: null, 
        error: { 
          message: response.error.message,
          status: response.error.status 
        } 
      };
    }

    // Handle successful response
    if (response.data?.accessToken) {
      api.setToken(response.data.accessToken);
    }

    return { data: response.data, error: null };
  },

  async logout() {
    api.setToken(null);
    return true;
  },

  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await api.get<UserProfile>('/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const updateData: UpdateProfileData = {};
      
      if (profileData.fullName !== undefined) {
        updateData.fullName = profileData.fullName;
      }
      
      if (profileData.email !== undefined) {
        updateData.email = profileData.email;
      }
      
      if (profileData.phoneNumber !== undefined) {
        updateData.phoneNumber = profileData.phoneNumber;
      }
      
      if (profileData.whatsappNumber !== undefined) {
        updateData.whatsappNumber = profileData.whatsappNumber;
      }

      // Only make the API call if there's data to update
      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
      }

      const response = await api.patch<UserProfile>('/profile/update', updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    try {
      const response = await api.post('/profile/change-password', passwordData);
      
      // Check if there's an error in the response
      if (response.error) {
        throw new ApiServiceError(response.error.message, response.error.status);
      }
      
      return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw new ApiServiceError(error.message, error.status);
    }
  }
};