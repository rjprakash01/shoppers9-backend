import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Shield,
  Truck,
  Tag,
  MessageSquare,
  FolderTree,
  Filter,
  Image,
  Star,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  UserCircle,
  Store
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  module: string;
  children?: MenuItem[];
  roles?: string[];
}

interface PermissionBasedMenuProps {
  collapsed?: boolean;
}

const PermissionBasedMenu: React.FC<PermissionBasedMenuProps> = ({ collapsed = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { hasModuleAccess, loading } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);


  // Define all possible menu items with their permission requirements
  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      module: 'dashboard',
      roles: ['super_admin', 'admin', 'sub_admin', 'seller', 'customer']
    },
    {
      id: 'customer-management',
      label: 'Customer Management',
      path: '/customer-management',
      icon: <UserCircle className="h-5 w-5" />,
      module: 'users'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'seller-management',
      label: 'Seller Management',
      path: '/seller-management',
      icon: <Store className="h-5 w-5" />,
      module: 'users'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'products',
      label: 'Products',
      path: '/products',
      icon: <Package className="h-5 w-5" />,
      module: 'products'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'product-review-queue',
      label: 'Product Review Queue',
      path: '/product-review-queue',
      icon: <Package className="h-5 w-5" />,
      module: 'product_review_queue'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'inventory',
      label: 'Inventory',
      path: '/inventory',
      icon: <Package className="h-5 w-5" />,
      module: 'inventory'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'orders',
      label: 'Orders',
      path: '/orders',
      icon: <ShoppingCart className="h-5 w-5" />,
      module: 'orders'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'shipping',
      label: 'Shipping',
      path: '/shipping',
      icon: <Truck className="h-5 w-5" />,
      module: 'shipping'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'coupons',
      label: 'Coupons',
      path: '/coupons',
      icon: <Tag className="h-5 w-5" />,
      module: 'coupons'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'support',
      label: 'Support',
      path: '/support',
      icon: <MessageSquare className="h-5 w-5" />,
      module: 'support'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'categories',
      label: 'Categories',
      path: '/categories',
      icon: <FolderTree className="h-5 w-5" />,
      module: 'categories',
      roles: ['super_admin'] // Restricted module
    },
    {
      id: 'filters',
      label: 'Filters',
      path: '/filters',
      icon: <Filter className="h-5 w-5" />,
      module: 'filters',
      roles: ['super_admin'] // Restricted module
    },
    {
      id: 'banners',
      label: 'Banners',
      path: '/banners',
      icon: <Image className="h-5 w-5" />,
      module: 'banners',
      roles: ['super_admin'] // Restricted module
    },
    {
      id: 'testimonials',
      label: 'Testimonials',
      path: '/testimonials',
      icon: <Star className="h-5 w-5" />,
      module: 'testimonials',
      roles: ['super_admin'] // Restricted module
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      module: 'analytics'
      // No role restrictions - visibility based on module access only
    },
    {
      id: 'admin-management',
      label: 'Admin Management',
      path: '/admin-management',
      icon: <Shield className="h-5 w-5" />,
      module: 'admin_management',
      roles: ['super_admin'] // Restricted module
    },
    {
      id: 'permission-management',
      label: 'Permission Management',
      path: '/permission-management',
      icon: <Shield className="h-5 w-5" />,
      module: 'admin_management',
      roles: ['super_admin'] // Restricted module
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
      module: 'settings',
      roles: ['super_admin'] // Restricted module
    }
  ];

  // No need for manual permission fetching - handled by usePermissions hook

  const isMenuItemVisible = (item: MenuItem): boolean => {
    // Super admin sees everything
    if (user?.role === 'super_admin') {
      return true;
    }

    // Check if user has module access (binary model)
    const hasModulePermission = hasModuleAccess(item.module);
    if (hasModulePermission) {
      return true;
    }

    // Fallback to role-based access only if no module access is granted
    if (item.roles && item.roles.includes(user?.role || '')) {
      return true;
    }

    return false;
  };

  const getVisibleMenuItems = (): MenuItem[] => {
    return allMenuItems.filter(isMenuItemVisible);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const getPermissionIndicator = (item: MenuItem) => {
    if (user?.role === 'super_admin') {
      return null; // Hide green eye for super admin
    }

    const hasAccess = hasModuleAccess(item.module);

    if (hasAccess) {
      return null; // Hide green eye when access is granted
    }

    return <EyeOff className="h-4 w-4 text-red-500" title="No Access" />;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  const visibleMenuItems = getVisibleMenuItems();

  return (
    <div className="flex flex-col h-full">
      <nav className={`space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100`}>
        {visibleMenuItems.map((item) => (
          <div key={item.id}>
            <Link
              to={item.path}
              className={`group flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className={`flex items-center ${collapsed ? '' : 'flex-1'}`}>
                <div className={collapsed ? '' : 'mr-3'}>
                  {item.icon}
                </div>
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && (
                <div className="flex items-center space-x-2">
                  {getPermissionIndicator(item)}
                  {item.children && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleExpanded(item.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedItems.includes(item.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </Link>
            
            {/* Submenu - only show when not collapsed */}
            {!collapsed && item.children && expandedItems.includes(item.id) && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.filter(isMenuItemVisible).map((child) => (
                  <Link
                    key={child.id}
                    to={child.path}
                    className={`group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive(child.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        {child.icon}
                      </div>
                      <span>{child.label}</span>
                    </div>
                    {getPermissionIndicator(child)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      {/* Access Level section hidden as requested */}
    </div>
  );
};

export default PermissionBasedMenu;