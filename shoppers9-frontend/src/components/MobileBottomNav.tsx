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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50" style={{
      borderColor: '#e5e7eb',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      backgroundColor: 'white'
    }}>
      <div className="grid grid-cols-4 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 rounded-lg mx-1"
              style={{
                color: active ? 'var(--cta-dark-purple)' : '#6b7280',
                backgroundColor: active ? 'rgba(99,102,241,0.1)' : 'transparent'
              }}
            >
              <div className="relative">
                <Icon 
                  className="h-5 w-5 transition-all duration-300"
                  style={{
                    color: active ? 'var(--cta-dark-purple)' : '#6b7280'
                  }}
                  fill={active ? 'currentColor' : 'none'}
                  strokeWidth={active ? 0 : 2}
                />
                {item.count !== null && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium" style={{
                    backgroundColor: 'var(--cta-dark-purple)',
                    fontSize: '10px'
                  }}>
                    {item.count > 9 ? '9+' : item.count}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium truncate max-w-full" style={{
                color: active ? 'var(--cta-dark-purple)' : '#6b7280',
                fontFamily: 'Inter, sans-serif'
              }}>
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