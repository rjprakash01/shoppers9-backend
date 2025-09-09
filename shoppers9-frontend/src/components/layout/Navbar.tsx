import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown, Bell, Gift, Star, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { categoriesService, type Category } from '../../services/categories';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState('');
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoryTree = await categoriesService.getCategoryTree();
      // Use the actual category tree structure from backend
      setCategories(categoryTree.filter(cat => cat.isActive));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounced hover handlers
  const handleCategoryHover = (categoryId: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setShowCategoriesMenu(categoryId);
  };

  const handleCategoryLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const timeout = setTimeout(() => {
      setShowCategoriesMenu('');
    }, 150); // Small delay to prevent flickering
    setHoverTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setShowUserMenu(false);
  };

  return (
    <>
      {/* Delivery Information Bar */}
      <div className="bg-brand-indigo text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-4 md:space-x-6 lg:space-x-8 xl:space-x-12 py-3 text-sm overflow-x-auto">
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Gift className="h-4 w-4 text-brand-gold" />
              <span className="font-semibold font-poppins">Fast Delivery</span>
              <span className="text-brand-slate opacity-90">Quick & Reliable</span>
            </div>
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Shield className="h-4 w-4 text-brand-gold" />
              <span className="font-semibold font-poppins">Secure Shopping</span>
              <span className="text-brand-slate opacity-90">100% Protected</span>
            </div>
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Star className="h-4 w-4 text-brand-gold" />
              <span className="font-semibold font-poppins">Quality Products</span>
              <span className="text-brand-slate opacity-90">Best Selection</span>
            </div>
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Bell className="h-4 w-4 text-brand-gold" />
              <span className="font-semibold font-poppins">Customer Support</span>
              <span className="text-brand-slate opacity-90">24/7 Help</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Navbar */}
      <nav className="bg-gradient-to-r from-brand-indigo via-brand-indigo/95 to-brand-indigo shadow-lg sticky top-0 z-50 border-b border-brand-gold/30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <div className="relative">
                    <ShoppingCart className="h-7 w-7 text-brand-indigo" />
                    <span className="absolute -bottom-1 -right-1 bg-brand-indigo text-brand-gold font-bold text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                      9
                    </span>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gold rounded-full animate-pulse opacity-75"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold font-playfair text-brand-gold group-hover:text-white transition-all duration-300">
                  Shoppers9
                </span>
                <div className="text-xs text-brand-slate font-medium font-poppins">Shop Easy, Live Happy</div>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-4xl mx-4 lg:mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-14 pr-12 py-4 bg-white/10 border-2 border-brand-gold/30 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-gold/20 focus:border-brand-gold focus:bg-white/20 text-sm placeholder-brand-slate text-white font-poppins transition-all duration-300 shadow-sm group-hover:shadow-md"
                  />
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-gold group-focus-within:text-white transition-colors duration-300" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-brand-gold text-brand-indigo p-2 rounded-xl hover:bg-white hover:text-brand-indigo transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              {/* Wishlist */}
              <Link to="/wishlist" className="group relative">
                <div className="flex flex-col items-center p-3 rounded-2xl text-white hover:text-brand-gold hover:bg-brand-gold/10 transition-all duration-300">
                  <Heart className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs mt-1 font-semibold font-poppins">Wishlist</span>
                </div>
              </Link>
              
              {/* Cart */}
              <Link to="/cart" className="group relative">
                <div className="flex flex-col items-center p-3 rounded-2xl text-white hover:text-brand-gold hover:bg-brand-gold/10 transition-all duration-300">
                  <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs mt-1 font-semibold font-poppins">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-gold text-brand-indigo text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="group relative"
                  >
                    <div className="flex flex-col items-center p-3 rounded-2xl text-white hover:text-brand-gold hover:bg-brand-gold/10 transition-all duration-300">
                      <div className="relative">
                        <User className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-gold rounded-full border-2 border-brand-indigo"></div>
                      </div>
                      <span className="text-xs mt-1 font-semibold font-poppins">Profile</span>
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-4 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-300">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {(user?.name || user?.phone || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-base">{user?.name || 'User'}</div>
                            <div className="text-sm text-gray-500">{user?.email || user?.phone}</div>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">My Profile</span>
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center space-x-3 px-6 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">Orders</span>
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center space-x-3 px-6 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Heart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">Wishlist</span>
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-6 py-3 text-red-600 hover:bg-red-50 transition-all duration-200 group"
                        >
                          <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="group relative"
                >
                  <div className="flex flex-col items-center p-3 rounded-2xl text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300">
                    <User className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs mt-1 font-semibold">Login</span>
                  </div>
                </Link>
              )}
          </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-3 rounded-2xl text-white hover:text-brand-gold hover:bg-brand-gold/10 transition-all duration-300 group"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <Menu className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="hidden lg:block border-t border-brand-gold/30 bg-gradient-to-r from-brand-indigo/90 via-brand-indigo/85 to-brand-indigo/90">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-6 xl:space-x-8 py-3">
              {categoriesLoading ? (
                <div className="flex items-center space-x-2 text-brand-slate">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-gold"></div>
                  <span className="text-sm font-poppins">Loading categories...</span>
                </div>
              ) : (
                categories.filter(cat => cat.level === 1).map((category) => (
                  <div 
                    key={category._id} 
                    className="relative group"
                    onMouseEnter={() => handleCategoryHover(category._id)}
                    onMouseLeave={handleCategoryLeave}
                  >
                    <div className="flex items-center space-x-1 text-sm font-medium text-white hover:text-brand-gold transition-colors duration-200 py-2 cursor-pointer">
                      <Link
                        to={`/products?category=${encodeURIComponent(category.slug || category.name)}`}
                        className="hover:text-brand-gold transition-colors duration-200 font-poppins"
                      >
                        <span>{category.name}</span>
                      </Link>
                      {category.children && category.children.length > 0 && (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    {showCategoriesMenu === category._id && category.children && category.children.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        {category.children.filter(child => child.isActive).map((subcategory) => (
                          <Link
                            key={subcategory._id}
                            to={`/products?category=${encodeURIComponent(category.slug || category.name)}&subcategory=${encodeURIComponent(subcategory.slug || subcategory.name)}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pink-600 transition-colors duration-200"
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md slide-up">
            <div className="px-4 pt-4 pb-6 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all duration-300"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </form>

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link
                  to="/products"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Products</span>
                </Link>
                
                <Link
                  to="/cart"
                  className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Cart</span>
                  </div>
                  {cartCount > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Link to="/wishlist" className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 font-medium">
                  <Heart className="h-5 w-5" />
                  <span>Wishlist</span>
                </Link>

                {isAuthenticated ? (
                  <>
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(user?.name || user?.phone || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{user?.name || 'User'}</div>
                          <div className="text-xs text-gray-500">{user?.email || user?.phone}</div>
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-300 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-300 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>My Orders</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 mt-4">
                    <Link
                      to="/login"
                      className="block px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block px-4 py-3 border-2 border-blue-500 text-blue-500 text-center rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </nav>
    </>
  );
};

export default Navbar;