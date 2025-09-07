import api from './api';

export interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  addresses?: Address[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

class AuthService {
  async sendOTP(phone: string): Promise<{ message: string }> {
    console.log('🔄 Sending OTP request for phone:', phone);
    try {
      const response = await api.post('/auth/send-otp', { phone });
      console.log('✅ OTP response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ OTP request failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<LoginResponse> {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    const { accessToken, user } = response.data.data;
    
    // Store auth data
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token: accessToken, user };
  }

  async verifyOTPWithDetails(phone: string, otp: string, name: string, email?: string): Promise<LoginResponse> {
    const response = await api.post('/auth/verify-otp', { phone, otp, name, email });
    const { accessToken, user } = response.data.data;
    
    // Store auth data
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token: accessToken, user };
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/users/profile', data);
    const updatedUser = response.data.data.user;
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  }

  async getAddresses(): Promise<Address[]> {
    const response = await api.get('/users/addresses');
    return response.data.data.addresses;
  }

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const response = await api.post('/users/addresses', address);
    return response.data.data.address;
  }

  async updateAddress(addressId: string, address: Partial<Address>): Promise<Address> {
    const response = await api.put(`/users/addresses/${addressId}`, address);
    return response.data.data.address;
  }

  async deleteAddress(addressId: string): Promise<void> {
    await api.delete(`/users/addresses/${addressId}`);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Only redirect if we're not already on the login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  async fetchCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    const user = response.data.data.user;
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
export default authService;