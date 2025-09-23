import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { api } from '../services/api';
import { Shield, Users, Settings, Eye, Edit, Trash2, Plus, Filter, Save, X, Check } from 'lucide-react';

interface Permission {
  _id: string;
  module: string;
  description: string;
  isActive: boolean;
}

interface Role {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  level: number;
  permissions: string[];
  isActive: boolean;
}

interface UserPermission {
  userId: string;
  userName: string;
  userEmail: string;
  roleId: string;
  roleName: string;
  moduleAccess: {
    module: string;
    hasAccess: boolean;
  }[];
}

const PermissionManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshPermissions } = usePermissions();
  const [activeTab, setActiveTab] = useState<'permissions' | 'roles' | 'assignments'>('permissions');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [originalRoles, setOriginalRoles] = useState<Role[]>([]);
  const [originalUserPermissions, setOriginalUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<UserPermission | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{
    roleChanges: { [roleId: string]: string[] };
    userChanges: { [userId: string]: { module: string; hasAccess: boolean }[] };
  }>({ roleChanges: {}, userChanges: {} });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const modules = [
    'dashboard', 'users', 'products', 'inventory', 'orders', 'shipping',
    'coupons', 'support', 'categories', 'filters', 'banners', 'testimonials',
    'admin_management', 'settings', 'analytics'
  ];

  // Binary module access - either full access or no access
  // No more granular actions or scopes

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!user) {
      setError('Please log in to access permission management.');
      setLoading(false);
      return;
    }
    if (!isSuperAdmin) {
      setError('Access denied. Super admin privileges required.');
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [permissionsRes, rolesRes, userPermissionsRes] = await Promise.all([
        api.get('/admin/permissions'),
        api.get('/admin/roles'),
        api.get('/admin/all-user-permissions')
      ]);
      
      const fetchedPermissions = permissionsRes.data.data || [];
      const fetchedRoles = rolesRes.data.data || [];
      const fetchedUserPermissions = userPermissionsRes.data.data || [];
      
      setPermissions(fetchedPermissions);
      setRoles(fetchedRoles);
      setUserPermissions(fetchedUserPermissions);
      setOriginalRoles(JSON.parse(JSON.stringify(fetchedRoles)));
      setOriginalUserPermissions(JSON.parse(JSON.stringify(fetchedUserPermissions)));
      
      // Clear pending changes when fetching fresh data
      setPendingChanges({ roleChanges: {}, userChanges: {} });
      setHasUnsavedChanges(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleModuleAccessToggle = (roleId: string, module: string, hasAccess: boolean) => {
    // Update UI immediately and track pending changes
    setRoles(prevRoles => {
      const updatedRoles = prevRoles.map(role => {
        if (role._id === roleId) {
          const updatedPermissions = hasAccess 
            ? [...role.permissions.filter(p => !permissions.find(perm => perm._id === p && perm.module === module)), 
               ...permissions.filter(p => p.module === module).map(p => p._id)]
            : role.permissions.filter(p => !permissions.find(perm => perm._id === p && perm.module === module));
          return { ...role, permissions: updatedPermissions };
        }
        return role;
      });
      
      // Update pending changes with the new permissions
      const updatedRole = updatedRoles.find(r => r._id === roleId);
      if (updatedRole) {
        setPendingChanges(prev => ({
          ...prev,
          roleChanges: {
            ...prev.roleChanges,
            [roleId]: updatedRole.permissions
          }
        }));
      }
      
      return updatedRoles;
    });
    
    setHasUnsavedChanges(true);
  };

  const handleRolePermissionToggle = (roleId: string, module: string, granted: boolean) => {
    // Update UI immediately and track pending changes
    setRoles(prevRoles => {
      const updatedRoles = prevRoles.map(role => {
        if (role._id === roleId) {
          const updatedModuleAccess = role.moduleAccess ? [...role.moduleAccess] : [];
          const existingIndex = updatedModuleAccess.findIndex(m => m.module === module);
          
          if (existingIndex >= 0) {
            updatedModuleAccess[existingIndex] = { ...updatedModuleAccess[existingIndex], hasAccess: granted };
          } else {
            updatedModuleAccess.push({ module, hasAccess: granted });
          }
          
          return { ...role, moduleAccess: updatedModuleAccess };
        }
        return role;
      });
      
      // Update pending changes with the new permissions
      const updatedRole = updatedRoles.find(r => r._id === roleId);
      if (updatedRole) {
        setPendingChanges(prev => ({
          ...prev,
          roleChanges: {
            ...prev.roleChanges,
            [roleId]: updatedRole.permissions
          }
        }));
      }
      
      return updatedRoles;
    });
    
    setHasUnsavedChanges(true);
  };

  const handleUserModuleAccessToggle = (userId: string, module: string, hasAccess: boolean) => {
    // Update UI immediately
    setUserPermissions(prevUserPermissions => 
      prevUserPermissions.map(userPerm => {
        if (userPerm.userId === userId) {
          const existingModuleIndex = userPerm.moduleAccess.findIndex(m => m.module === module);
          let updatedModuleAccess;
          
          if (existingModuleIndex >= 0) {
            // Update existing module access
            updatedModuleAccess = userPerm.moduleAccess.map((m, index) => 
              index === existingModuleIndex ? { ...m, hasAccess } : m
            );
          } else {
            // Add new module access
            updatedModuleAccess = [...userPerm.moduleAccess, { module, hasAccess }];
          }
          
          return { ...userPerm, moduleAccess: updatedModuleAccess };
        }
        return userPerm;
      })
    );

    // Track pending changes
    setPendingChanges(prev => {
      const existingUserChanges = prev.userChanges[userId] || [];
      const existingModuleIndex = existingUserChanges.findIndex(c => c.module === module);
      
      let updatedUserChanges;
      if (existingModuleIndex >= 0) {
        updatedUserChanges = existingUserChanges.map((c, index) => 
          index === existingModuleIndex ? { module, hasAccess } : c
        );
      } else {
        updatedUserChanges = [...existingUserChanges, { module, hasAccess }];
      }
      
      return {
        ...prev,
        userChanges: {
          ...prev.userChanges,
          [userId]: updatedUserChanges
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  // Removed handleUserPermissionToggle - using handleUserModuleAccessToggle instead

  // Removed handleSaveRestrictions - no longer needed with binary access model

  const handleSaveAllChanges = async () => {
    console.log('=== SAVE ALL CHANGES STARTED ===');
    console.log('Current roles:', roles);
    console.log('Original roles:', originalRoles);
    console.log('Current user permissions:', userPermissions);
    console.log('Original user permissions:', originalUserPermissions);
    
    try {
      const savePromises = [];
      
      // Compare current roles with original roles to find actual changes
      roles.forEach(currentRole => {
        const originalRole = originalRoles.find(r => r._id === currentRole._id);
        if (!originalRole) {
          console.log(`No original role found for ${currentRole._id}`);
          return;
        }
        
        console.log(`Checking role ${currentRole.name}:`);
        console.log('  Current permissions:', currentRole.permissions);
        console.log('  Original permissions:', originalRole.permissions);
        
        // Check if role permissions have changed
        const hasChanges = JSON.stringify([...currentRole.permissions].sort()) !== 
                          JSON.stringify([...originalRole.permissions].sort());
        
        console.log(`  Current permissions:`, currentRole.permissions);
        console.log(`  Original permissions:`, originalRole.permissions);
        console.log(`  Has changes:`, hasChanges);
        
        if (hasChanges) {
          console.log(`  Making API call for role ${currentRole._id}`);
          savePromises.push(
            api.put(`/admin/roles/${currentRole._id}/permissions/bulk`, {
              permissions: currentRole.permissions
            })
          );
        } else {
          console.log(`  No changes for role ${currentRole._id}`);
        }
      });
      
      console.log('\n=== CHECKING USER MODULE ACCESS ===');
      // Compare current user module access with original user module access
      userPermissions.forEach(currentUserPerm => {
        const originalUserPerm = originalUserPermissions.find(u => u.userId === currentUserPerm.userId);
        if (!originalUserPerm) {
          console.log(`No original user permissions found for ${currentUserPerm.userId}`);
          return;
        }
        
        console.log(`Checking user ${currentUserPerm.userId}:`);
        
        const moduleUpdates: { module: string; hasAccess: boolean }[] = [];
        
        // Check each module access for changes
        currentUserPerm.moduleAccess.forEach(currentModule => {
          const originalModule = originalUserPerm.moduleAccess?.find(m => m.module === currentModule.module);
          
          if (!originalModule) {
            // New module access added
            console.log(`  New module access added: ${currentModule.module} = ${currentModule.hasAccess}`);
            moduleUpdates.push({
              module: currentModule.module,
              hasAccess: currentModule.hasAccess
            });
          } else if (originalModule.hasAccess !== currentModule.hasAccess) {
            // Module access status changed
            console.log(`  Module access changed: ${currentModule.module} from ${originalModule.hasAccess} to ${currentModule.hasAccess}`);
            moduleUpdates.push({
              module: currentModule.module,
              hasAccess: currentModule.hasAccess
            });
          }
        });
        
        // Check for removed module access
        originalUserPerm.moduleAccess?.forEach(originalModule => {
          const currentModule = currentUserPerm.moduleAccess.find(m => m.module === originalModule.module);
          if (!currentModule && originalModule.hasAccess) {
            // Module access was removed
            console.log(`  Module access removed: ${originalModule.module}`);
            moduleUpdates.push({
              module: originalModule.module,
              hasAccess: false
            });
          }
        });
        
        console.log(`  Total user module updates:`, moduleUpdates);
        
        if (moduleUpdates.length > 0) {
          console.log(`  Making API call for user ${currentUserPerm.userId}`);
          console.log(`  Payload:`, { moduleAccess: moduleUpdates });
          // Use the new module access API endpoint
          moduleUpdates.forEach(moduleUpdate => {
            savePromises.push(
              api.put(`/admin/user-permissions/${currentUserPerm.userId}`, {
                module: moduleUpdate.module,
                hasAccess: moduleUpdate.hasAccess
              })
            );
          });
        } else {
          console.log(`  No changes for user ${currentUserPerm.userId}`);
        }
      });
      
      console.log(`\n=== EXECUTING ${savePromises.length} API CALLS ===`);
      
      if (savePromises.length === 0) {
        console.log('No changes detected, skipping API calls');
        alert('No changes to save!');
        return;
      }
      
      const results = await Promise.all(savePromises);
      console.log('All API calls completed successfully:', results);
      
      // Update original state to match current state
      console.log('Updating original state to match current state');
      setOriginalRoles(JSON.parse(JSON.stringify(roles)));
      setOriginalUserPermissions(JSON.parse(JSON.stringify(userPermissions)));
      
      // Clear pending changes
      console.log('Clearing pending changes');
      setPendingChanges({ roleChanges: {}, userChanges: {} });
      setHasUnsavedChanges(false);
      
      // Refresh permissions context
      console.log('Refreshing permissions context');
      await refreshPermissions();
      
      console.log('=== SAVE COMPLETED SUCCESSFULLY ===');
      alert('All changes saved successfully!');
    } catch (error: any) {
      console.error('=== SAVE FAILED ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.message);
      console.error('Full error object:', JSON.stringify(error.response?.data, null, 2));
      alert(error.response?.data?.message || 'Failed to save changes');
      // Refresh data to ensure consistency
      console.log('Refreshing data due to error');
      fetchData();
    }
  };
  
  const handleCancelChanges = () => {
    // Revert all changes by refetching data
    fetchData();
    setPendingChanges({ roleChanges: {}, userChanges: {} });
    setHasUnsavedChanges(false);
  };

  const filteredPermissions = permissions.filter(permission => {
    return true;
  });

  // Helper function to get module icon
  const getModuleIcon = (module: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      dashboard: <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>,
      users: <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>,
      products: <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>,
      inventory: <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
      orders: <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>,
      shipping: <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L15 6.586A1 1 0 0014.414 6H14v1z"/></svg>,
      coupons: <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0115 5a3 3 0 01-2.236 5A3 3 0 015 5zm4 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd"/><path d="M2 13.692V16a1 1 0 001 1h3a1 1 0 001-1v-2.308A24.974 24.974 0 015.5 14c-.546 0-1.059-.034-1.5-.308zM15 13.692a24.926 24.926 0 01-1.5.308c-.546 0-1.059-.034-1.5-.308V16a1 1 0 001 1h3a1 1 0 001-1v-2.308z"/></svg>,
      support: <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-1.106-1.106A6.003 6.003 0 004 10c0 .639.097 1.255.275 1.836l1.883-1.883zm2.023-6.658a5.99 5.99 0 012.646 0l-1.562 1.562a3.996 3.996 0 00-1.522.016l1.438-1.578z" clipRule="evenodd"/></svg>,
      categories: <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
      filters: <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/></svg>,
      banners: <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/></svg>,
      testimonials: <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/></svg>,
      admin_management: <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
      settings: <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
      analytics: <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
    };
    return iconMap[module] || <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>;
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      read: 'bg-blue-100 text-blue-800',
      edit: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-red-800 font-medium">Access Denied</h3>
          </div>
          <p className="text-red-700 mt-1">Only Super Admins can access the Permission Management module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Permission Management</h1>
        <p className="text-gray-600">Manage granular permissions for roles and users</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'permissions', label: 'Permissions', icon: Shield },
            { id: 'roles', label: 'Role Permissions', icon: Users },
            { id: 'assignments', label: 'User Assignments', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Save/Cancel Buttons */}
      {hasUnsavedChanges && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancelChanges}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Cancel Changes
            </button>
            <button
              onClick={handleSaveAllChanges}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save All Changes
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading permissions...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
            {error.includes('Please log in') && (
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modules.map((module) => {
                    const modulePermission = permissions.find(p => p.module === module);
                    return (
                      <tr key={module} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getModuleIcon(module)}
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {module.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {modulePermission?.description || `Access to ${module.replace('_', ' ')} module`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Binary Access
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Role Permissions Tab */}
          {activeTab === 'roles' && (
            <div className="p-6">

              
              <div className="space-y-6">
                {roles.filter(role => role.name !== 'super_admin').map((role) => (
                  <div key={role._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{role.displayName}</h3>
                          <p className="text-sm text-gray-500">{role.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            Level {role.level}
                          </span>

                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-900">Module</th>
                              <th className="text-center py-2 px-3 font-medium text-gray-900 min-w-[120px]">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  ACCESS
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {modules.map((module) => {
                              const modulePermissions = permissions.filter(p => p.module === module);
                              const hasAnyPermission = modulePermissions.some(p => role.permissions.includes(p._id));
                              
                              return (
                                <tr key={module} className={`border-b border-gray-100 hover:bg-gray-50 ${
                                  hasAnyPermission ? 'bg-blue-25' : ''
                                }`}>
                                  <td className="py-3 px-3">
                                    <div className="flex items-center">
                                      {getModuleIcon(module)}
                                      <span className="ml-2 font-medium text-gray-900">
                                        {module.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="checkbox"
                                        checked={hasAnyPermission}
                                        onChange={(e) => handleModuleAccessToggle(role._id, module, e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        title={`Full access to ${module} module`}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Modules with access: {modules.filter(module => {
                              const modulePermissions = permissions.filter(p => p.module === module);
                              return modulePermissions.some(p => role.permissions.includes(p._id));
                            }).length} / {modules.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="p-6">
              <div className="space-y-4">
                {userPermissions.map((userPerm) => (
                  <div key={userPerm.userId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{userPerm.userName}</h3>
                        <p className="text-sm text-gray-500">{userPerm.userEmail}</p>
                        <p className="text-xs text-gray-400">Role: {userPerm.roleName}</p>
                      </div>
                      <button
                        onClick={() => setEditingUser(userPerm)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {modules.map((module) => {
                        const moduleAccess = userPerm.moduleAccess?.find(m => m.module === module);
                        const hasModuleAccess = moduleAccess?.hasAccess || false;
                        
                        return (
                          <div key={module} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              {getModuleIcon(module)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {module.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={hasModuleAccess}
                              onChange={(e) => handleUserModuleAccessToggle(userPerm.userId, module, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              title={`Full access to ${module} module`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Permission Editing Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Permissions: {editingUser.userName}</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module) => {
                const moduleAccess = editingUser.moduleAccess?.find(m => m.module === module);
                const hasModuleAccess = moduleAccess?.hasAccess || false;
                
                return (
                  <div key={module} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getModuleIcon(module)}
                        <span className="ml-2 font-medium text-gray-900">
                          {module.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasModuleAccess}
                        onChange={(e) => {
                          let updatedModuleAccess = [...(editingUser.moduleAccess || [])];
                          const existingIndex = updatedModuleAccess.findIndex(m => m.module === module);
                          
                          if (existingIndex >= 0) {
                            updatedModuleAccess[existingIndex] = { ...updatedModuleAccess[existingIndex], hasAccess: e.target.checked };
                          } else {
                            updatedModuleAccess.push({ module, hasAccess: e.target.checked });
                          }
                          
                          setEditingUser({ ...editingUser, moduleAccess: updatedModuleAccess });
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Full access to {module.replace('_', ' ').toLowerCase()}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-3 pt-4 mt-4 border-t">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save all module access changes
                  editingUser.moduleAccess?.forEach(moduleAccess => {
                    handleUserModuleAccessToggle(editingUser.userId, moduleAccess.module, moduleAccess.hasAccess);
                  });
                  setEditingUser(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManagement;