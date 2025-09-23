import axios from 'axios';

// Create API instance for role operations
const roleApi = axios.create({
  baseURL: import.meta.env.PROD 
    ? import.meta.env.VITE_API_URL || 'https://api.shoppers9.com'
    : 'http://localhost:5001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
roleApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

roleApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Role {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  level: number;
  isActive: boolean;
  permissions: string[];
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  _id: string;
  module: string;
  action: string;
  resource: string;
  description: string;
  isActive: boolean;
}

export interface UserRole {
  _id: string;
  userId: string;
  roleId: Role;
  permissions: {
    permissionId: Permission;
    granted: boolean;
    restrictions?: {
      partialView?: string[];
      sellerScope?: string[];
      regionScope?: string[];
      timeRestriction?: {
        startTime?: string;
        endTime?: string;
        days?: number[];
      };
    };
  }[];
  isActive: boolean;
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedAt: string;
  expiresAt?: string;
  lastAccessedAt?: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  primaryRole: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  roles: UserRole[];
  suspendedAt?: string;
  suspendedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  suspensionReason?: string;
  sellerInfo?: {
    businessName?: string;
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
    approvedBy?: string;
    approvedAt?: string;
  };
  adminInfo?: {
    employeeId?: string;
    department?: string;
    accessLevel?: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    users?: T[];
    roles?: T[];
    permissions?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class RoleService {
  // Get all roles
  async getRoles(): Promise<ApiResponse<Role[]>> {
    try {
      const response = await roleApi.get<ApiResponse<Role[]>>('/admin/roles');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch roles');
    }
  }

  // Get all permissions
  async getPermissions(): Promise<ApiResponse<{
    permissions: Permission[];
    groupedPermissions: Record<string, Permission[]>;
    modules: string[];
    actions: string[];
  }>> {
    try {
      const response = await roleApi.get('/admin/roles/permissions');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch permissions');
    }
  }

  // Get role hierarchy
  async getRoleHierarchy(): Promise<ApiResponse<{
    hierarchy: Record<number, string>;
    roles: {
      id: string;
      name: string;
      displayName: string;
      level: number;
      canManageRoles: boolean;
    }[];
  }>> {
    try {
      const response = await roleApi.get('/admin/roles/hierarchy');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching role hierarchy:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch role hierarchy');
    }
  }

  // Get users with their roles
  async getUsersWithRoles(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<User>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await roleApi.get(`/admin/roles/users?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users with roles:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
  }

  // Get specific user's roles and permissions
  async getUserRoles(userId: string): Promise<ApiResponse<{
    user: User;
    roles: UserRole[];
    permissions: any[];
    effectivePermissions: string[];
  }>> {
    try {
      const response = await roleApi.get(`/admin/roles/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user roles');
    }
  }

  // Assign role to user
  async assignRole(data: {
    userId: string;
    roleName: string;
    permissions: {
      permissionId: string;
      granted: boolean;
      restrictions?: {
        partialView?: string[];
        sellerScope?: string[];
        regionScope?: string[];
        timeRestriction?: {
          startTime?: string;
          endTime?: string;
          days?: number[];
        };
      };
    }[];
    expiresAt?: string;
    sellerScope?: string[];
    regionScope?: string[];
  }): Promise<ApiResponse<UserRole>> {
    try {
      const response = await roleApi.post('/admin/roles/assign', data);
      return response.data;
    } catch (error: any) {
      console.error('Error assigning role:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to assign role');
    }
  }

  // Update user permissions for a specific role
  async updatePermissions(
    userId: string,
    roleId: string,
    permissions: {
      permissionId: string;
      granted: boolean;
      restrictions?: any;
    }[]
  ): Promise<ApiResponse<UserRole>> {
    try {
      const response = await roleApi.put(
        `/admin/roles/users/${userId}/roles/${roleId}/permissions`,
        { permissions }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update permissions');
    }
  }

  // Revoke role from user
  async revokeRole(
    userId: string,
    roleName: string,
    reason?: string
  ): Promise<ApiResponse<UserRole>> {
    try {
      const response = await roleApi.delete(
        `/admin/roles/users/${userId}/roles/${roleName}`,
        { data: { reason } }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error revoking role:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to revoke role');
    }
  }

  // Emergency revoke all access
  async emergencyRevokeAccess(
    userId: string,
    reason: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await roleApi.post(
        `/admin/roles/emergency-revoke/${userId}`,
        { reason }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error in emergency revoke:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to revoke access');
    }
  }

  // Check if user has specific permission
  async checkPermission(
    userId: string,
    module: string,
    action: string,
    resource: string = '*'
  ): Promise<ApiResponse<{
    hasPermission: boolean;
    permission: string;
  }>> {
    try {
      const params = new URLSearchParams({
        userId,
        module,
        action,
        resource
      });

      const response = await roleApi.get(`/admin/roles/check-permission?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking permission:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to check permission');
    }
  }

  // Get my roles (for current user)
  async getMyRoles(): Promise<ApiResponse<{
    user: User;
    roles: UserRole[];
    permissions: any[];
    effectivePermissions: string[];
  }>> {
    try {
      const response = await roleApi.get('/admin/roles/my-roles');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my roles:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch roles');
    }
  }

  // Get my permissions (for current user)
  async getMyPermissions(): Promise<ApiResponse<{
    user: User;
    roles: UserRole[];
    permissions: any[];
    effectivePermissions: string[];
  }>> {
    try {
      const response = await roleApi.get('/admin/roles/my-permissions');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my permissions:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch permissions');
    }
  }

  // Utility methods - deprecated, use usePermissions hook instead
  hasModuleAccess(moduleAccess: any[], module: string): boolean {
    const moduleAccessItem = moduleAccess.find(m => m.module === module);
    return moduleAccessItem?.hasAccess || false;
  }

  canManageRole(userRole: string, targetRole: string): boolean {
    const roleHierarchy: Record<string, number> = {
      'super_admin': 1,
      'admin': 2,
      'sub_admin': 3,
      'seller': 4,
      'customer': 5
    };

    const userLevel = roleHierarchy[userRole] || 5;
    const targetLevel = roleHierarchy[targetRole] || 5;

    return userLevel < targetLevel;
  }

  getRoleDisplayName(roleName: string): string {
    const roleNames: Record<string, string> = {
      'super_admin': 'Super Administrator',
      'admin': 'Administrator',
      'sub_admin': 'Sub Administrator',
      'seller': 'Seller',
      'customer': 'Customer'
    };

    return roleNames[roleName] || roleName;
  }

  getRoleColor(roleName: string): string {
    const colors: Record<string, string> = {
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800',
      'sub_admin': 'bg-green-100 text-green-800',
      'seller': 'bg-yellow-100 text-yellow-800',
      'customer': 'bg-gray-100 text-gray-800'
    };

    return colors[roleName] || 'bg-gray-100 text-gray-800';
  }

  formatPermissionKey(permissionKey: string): string {
    const [module, action, resource] = permissionKey.split(':');
    const formattedModule = module.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
    const formattedResource = resource === '*' ? 'All' : resource;

    return `${formattedAction} ${formattedResource} in ${formattedModule}`;
  }
}

export const roleService = new RoleService();
export default roleService;