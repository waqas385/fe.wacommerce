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

export const authService = {
  async signup(email: string, password: string, fullName: string, phoneNumber: string) {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      fullName,
      phoneNumber
    });

    if (response.data?.accessToken) {
      api.setToken(response.data.accessToken);
    }

    return response.data;
  },

  async signin(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    if (response.data?.accessToken) {
      api.setToken(response.data.accessToken);
    }

    return response.data;
  },

  async logout() {
    api.setToken(null);
    return true;
  },
};