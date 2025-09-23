import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Settings,
  Activity,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  UserPlus,
  ShieldAlert,
  Crown,
  Key,
  Lock,
  Unlock
} from 'lucide-react';
import { roleService } from '../services/roleService';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  primaryRole: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  roles: any[];
  suspendedAt?: string;
  suspensionReason?: string;
}

interface Role {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  level: number;
  isActive: boolean;
}

interface Permission {
  _id: string;
  module: string;
  action: string;
  resource: string;
  description: string;
}

const SuperAdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'audit'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Role assignment form state
  const [roleForm, setRoleForm] = useState({
    userId: '',
    roleName: '',
    permissions: [] as any[],
    expiresAt: '',
    sellerScope: [] as string[],
    regionScope: [] as string[]
  });

  // Emergency revoke form state
  const [emergencyForm, setEmergencyForm] = useState({
    userId: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, [pagination.page, searchTerm, roleFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [usersResponse, rolesResponse, permissionsResponse] = await Promise.all([
        roleService.getUsersWithRoles({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          role: roleFilter,
          status: statusFilter
        }),
        roleService.getRoles(),
        roleService.getPermissions()
      ]);

      setUsers(usersResponse.data.users);
      setPagination(usersResponse.data.pagination);
      setRoles(rolesResponse.data);
      setPermissions(permissionsResponse.data.permissions);
      setGroupedPermissions(permissionsResponse.data.groupedPermissions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    try {
      await roleService.assignRole(roleForm);
      setShowRoleModal(false);
      setRoleForm({
        userId: '',
        roleName: '',
        permissions: [],
        expiresAt: '',
        sellerScope: [],
        regionScope: []
      });
      loadData();
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleEmergencyRevoke = async () => {
    try {
      await roleService.emergencyRevokeAccess(emergencyForm.userId, emergencyForm.reason);
      setShowEmergencyModal(false);
      setEmergencyForm({ userId: '', reason: '' });
      loadData();
    } catch (error) {
      console.error('Error in emergency revoke:', error);
    }
  };

  const openRoleModal = (user?: User) => {
    if (user) {
      setRoleForm(prev => ({ ...prev, userId: user._id }));
      setSelectedUser(user);
    }
    setShowRoleModal(true);
  };

  const openEmergencyModal = (user: User) => {
    setEmergencyForm(prev => ({ ...prev, userId: user._id }));
    setSelectedUser(user);
    setShowEmergencyModal(true);
  };

  const getRoleColor = (role: string) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      sub_admin: 'bg-green-100 text-green-800',
      seller: 'bg-yellow-100 text-yellow-800',
      customer: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (user: User) => {
    if (user.suspendedAt) return 'text-red-600';
    if (!user.isActive) return 'text-gray-600';
    return 'text-green-600';
  };

  const getStatusText = (user: User) => {
    if (user.suspendedAt) return 'Suspended';
    if (!user.isActive) return 'Inactive';
    return 'Active';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openRoleModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Assign Role
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="sub_admin">Sub Admin</option>
          <option value="seller">Seller</option>
          <option value="customer">Customer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          onClick={() => {
            setSearchTerm('');
            setRoleFilter('');
            setStatusFilter('');
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Clear Filters
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.primaryRole)}`}>
                      {user.primaryRole.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.suspendedAt ? (
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      ) : user.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-500 mr-2" />
                      )}
                      <span className={`text-sm ${getStatusColor(user)}`}>
                        {getStatusText(user)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openRoleModal(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Manage Roles"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEmergencyModal(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Emergency Revoke"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, page }))}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoleModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedUser ? `Assign Role to ${selectedUser.firstName} ${selectedUser.lastName}` : 'Assign Role'}
            </h3>
            <button
              onClick={() => setShowRoleModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* User Selection */}
            {!selectedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                <select
                  value={roleForm.userId}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={roleForm.roleName}
                onChange={(e) => setRoleForm(prev => ({ ...prev, roleName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a role...</option>
                {roles.filter(role => role.name !== 'super_admin').map(role => (
                  <option key={role._id} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Permissions */}
            {roleForm.roleName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-4">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <div key={module} className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">
                        {module.replace('_', ' ')}
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={roleForm.moduleAccess?.some(m => m.module === module && m.hasAccess) || false}
                            onChange={(e) => {
                              const hasAccess = e.target.checked;
                              setRoleForm(prev => {
                                const updatedModuleAccess = prev.moduleAccess ? [...prev.moduleAccess] : [];
                                const existingIndex = updatedModuleAccess.findIndex(m => m.module === module);
                                
                                if (existingIndex >= 0) {
                                  updatedModuleAccess[existingIndex] = { ...updatedModuleAccess[existingIndex], hasAccess };
                                } else {
                                  updatedModuleAccess.push({ module, hasAccess });
                                }
                                
                                return {
                                  ...prev,
                                  moduleAccess: updatedModuleAccess
                                };
                              });
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            Module Access
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date (Optional)</label>
              <input
                type="datetime-local"
                value={roleForm.expiresAt}
                onChange={(e) => setRoleForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowRoleModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignRole}
              disabled={!roleForm.userId || !roleForm.roleName || roleForm.permissions.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmergencyModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Emergency Access Revocation</h3>
            </div>
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {selectedUser && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                You are about to revoke ALL access for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>.
                This action will immediately suspend their account and remove all permissions.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Emergency Revocation *</label>
              <textarea
                value={emergencyForm.reason}
                onChange={(e) => setEmergencyForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Provide a detailed reason for this emergency action..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEmergencyRevoke}
              disabled={emergencyForm.reason.length < 10}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Revoke Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        </div>
        <p className="text-gray-600">Complete control over the platform with role-based access management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
              <p className="text-2xl font-semibold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Key className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Permissions</p>
              <p className="text-2xl font-semibold text-gray-900">{permissions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Activity className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.suspendedAt).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'roles', label: 'Roles', icon: Shield },
            { id: 'permissions', label: 'Permissions', icon: Key },
            { id: 'audit', label: 'Audit Logs', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'roles' && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Roles Management</h3>
          <p className="text-gray-600">Role management interface coming soon...</p>
        </div>
      )}
      {activeTab === 'permissions' && (
        <div className="text-center py-12">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Permissions Management</h3>
          <p className="text-gray-600">Permission management interface coming soon...</p>
        </div>
      )}
      {activeTab === 'audit' && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Logs</h3>
          <p className="text-gray-600">Audit log interface coming soon...</p>
        </div>
      )}

      {/* Modals */}
      {showRoleModal && renderRoleModal()}
      {showEmergencyModal && renderEmergencyModal()}
    </div>
  );
};

export default SuperAdminDashboard;