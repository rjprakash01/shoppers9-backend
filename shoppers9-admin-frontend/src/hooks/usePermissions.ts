import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface ModuleAccess {
  key: string;
  module: string;
  granted: boolean;
  source?: 'individual' | 'role';
}

interface PermissionHookReturn {
  moduleAccess: ModuleAccess[];
  loading: boolean;
  hasModuleAccess: (module: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

export const usePermissions = (): PermissionHookReturn => {
  const { user } = useAuth();
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setModuleAccess([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get('/admin/user-permissions');
      const moduleAccessList = response.data.data;
      
      setModuleAccess(moduleAccessList);
      console.log('Module access updated:', moduleAccessList);
    } catch (error) {
      console.error('Failed to fetch module access:', error);
      setModuleAccess([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Remove the automatic refresh interval to prevent constant re-renders
  // Permissions will be refreshed when user changes or manually via refreshPermissions()

  const hasModuleAccess = useCallback((module: string): boolean => {
    // Super admin has all permissions
    if (user?.role === 'super_admin' || user?.primaryRole === 'super_admin') {
      return true;
    }

    // Check if user has access to this module
    if (!moduleAccess || !Array.isArray(moduleAccess)) {
      return false;
    }
    
    const moduleAccessItem = moduleAccess.find(m => m.module === module);
    return moduleAccessItem?.granted || false;
  }, [user?.role, user?.primaryRole, moduleAccess]);

  const refreshPermissions = async () => {
    await fetchPermissions();
  };

  return {
    moduleAccess,
    loading,
    hasModuleAccess,
    refreshPermissions
  };
};