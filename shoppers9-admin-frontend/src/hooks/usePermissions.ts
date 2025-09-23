import { useState, useEffect } from 'react';
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

  const fetchPermissions = async () => {
    if (!user) {
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
  };

  useEffect(() => {
    fetchPermissions();
  }, [user]);

  // Refresh permissions every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchPermissions();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const hasModuleAccess = (module: string): boolean => {
    // Super admin has all permissions
    if (user?.role === 'super_admin' || user?.primaryRole === 'super_admin') {
      return true;
    }

    // Check if user has access to this module
    const moduleAccessItem = moduleAccess.find(m => m.module === module);
    return moduleAccessItem?.granted || false;
  };

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