import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Heart, ShoppingCart, User, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();

  // Hide bottom nav on cart and checkout pages
  const hideOnPages = ['/cart', '/checkout'];
  const shouldHide = hideOnPages.includes(location.pathname);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Don't render if on cart or checkout pages
  if (shouldHide) {
    return null;
  }

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Home',
      count: null
    },
    {
      path: '/orders',
      icon: Package,
      label: 'Orders',
      count: null
    },
    {
      path: '/wishlist',
      icon: Heart,
      label: 'Wishlist',
      count: wishlistCount
    },
    {
      path: isAuthenticated ? '/profile' : '/login',
      icon: User,
      label: 'Profile',
      count: null
    }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="grid grid-cols-4 py-1 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-0.5 transition-colors duration-200 ${
                active 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`h-5 w-5 transition-all duration-200 ${
                    active ? 'text-blue-600' : 'text-gray-500'
                  }`}
                  fill={active ? 'currentColor' : 'none'}
                  strokeWidth={active ? 0 : 2}
                />
                {item.count !== null && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-xs">
                    {item.count > 9 ? '9+' : item.count}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-0.5 font-medium truncate max-w-full ${
                active ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;