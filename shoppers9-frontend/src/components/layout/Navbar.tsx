import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown, Bell, Gift, Star, Shield, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { categoriesService, type Category } from '../../services/categories';
import shoppers9Logo from '../../assets/shoppers9-logo.svg';

// Type declaration for NodeJS
declare global {
  namespace NodeJS {
    interface Timeout {}
  }
}

/// <reference types="node" />

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState('');
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
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
      console.log('Fetching categories...');
      const categoryTree = await categoriesService.getCategoryTree();
      console.log('Raw category tree response:', categoryTree);
      
      if (!categoryTree || !Array.isArray(categoryTree)) {
        console.error('Invalid category tree response:', categoryTree);
        setCategories([]);
        return;
      }
      
      // Use the actual category tree structure from backend
      const activeCategories = categoryTree.filter(cat => cat.isActive);
      
      console.log('Total categories loaded:', categoryTree.length);
      console.log('Active categories:', activeCategories.length);
      console.log('Sample categories with full structure:', JSON.stringify(activeCategories.slice(0, 2), null, 2));
      
      // Filter out categories with undefined or null IDs to prevent rendering issues
      const validCategories = activeCategories.filter(cat => (cat._id != null && cat._id !== undefined) || (cat.id != null && cat.id !== undefined));
      console.log('Valid categories after filtering:', validCategories.length);
      
      // Normalize categories to use _id field for consistency
      const normalizedCategories = validCategories.map(cat => ({
        ...cat,
        _id: cat._id || cat.id
      }));
      
      setCategories(normalizedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
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
    const timeout = window.setTimeout(() => {
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
      {/* Elite Announcement Bar - Only on Home Page */}
      {location.pathname === '/' && (
        <div className="bg-elite-cta-purple text-elite-base-white">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-4 md:space-x-6 lg:space-x-8 xl:space-x-12 py-2 text-sm overflow-hidden lg:overflow-visible">
              {/* Mobile Auto-Scrolling Container */}
              <div className="lg:hidden flex animate-scroll">
                <div className="flex items-center space-x-8 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-4 w-4 text-elite-gold-highlight" />
                    <span className="font-semibold font-inter">Fast Delivery</span>
                    <span className="text-elite-base-white/80">Quick & Reliable</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-elite-gold-highlight" />
                    <span className="font-semibold font-inter">Secure Shopping</span>
                    <span className="text-elite-base-white/80">100% Protected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-elite-gold-highlight" />
                    <span className="font-semibold font-inter">Quality Products</span>
                    <span className="text-elite-base-white/80">Best Selection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-elite-gold-highlight" />
                    <span className="font-semibold font-inter">Customer Support</span>
                    <span className="text-elite-base-white/80">24/7 Help</span>
                  </div>
                  {/* Duplicate for seamless loop */}
                  <div className="flex items-center space-x-2">
                    <Gift className="h-4 w-4 text-elite-gold-highlight" />
                    <span className="font-semibold font-inter">Fast Delivery</span>
                    <span className="text-elite-base-white/80">Quick & Reliable</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-elite-gold-highlight" />
                    <span className="font-semibold font-inter">Secure Shopping</span>
                    <span className="text-elite-base-white/80">100% Protected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-elite-gold-highlight" />
                    <span className="font-semibold font-inter">Quality Products</span>
                    <span className="text-elite-base-white/80">Best Selection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-elite-gold-highlight" />
                    <span className="font-semibold font-inter">Customer Support</span>
                    <span className="text-elite-base-white/80">24/7 Help</span>
                  </div>
                </div>
              </div>
              
              {/* Desktop Static Container */}
              <div className="hidden lg:flex items-center space-x-4 md:space-x-6 lg:space-x-8 xl:space-x-12">
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <Gift className="h-4 w-4 text-elite-gold-highlight" />
                  <span className="font-semibold font-inter">Fast Delivery</span>
                  <span className="text-elite-base-white/80">Quick & Reliable</span>
                </div>
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <Shield className="h-4 w-4 text-elite-gold-highlight" />
                  <span className="font-semibold font-inter">Secure Shopping</span>
                  <span className="text-elite-base-white/80">100% Protected</span>
                </div>
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <Star className="h-4 w-4 text-elite-gold-highlight" />
                  <span className="font-semibold font-inter">Quality Products</span>
                  <span className="text-elite-base-white/80">Best Selection</span>
                </div>
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <Bell className="h-4 w-4 text-elite-gold-highlight" />
                  <span className="font-semibold font-inter">Customer Support</span>
                  <span className="text-elite-base-white/80">24/7 Help</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Elite Main Navbar */}
      <nav className="bg-elite-base-white shadow-premium lg:fixed lg:top-0 lg:left-0 lg:right-0 sticky top-0 z-50 border-b border-elite-light-grey">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Shoppers9 Logo */}
            <Link to="/" className="flex items-center group">
              <img 
                src={shoppers9Logo} 
                alt="Shoppers9 Logo" 
                className="h-10 sm:h-12 md:h-14 w-auto transform group-hover:scale-105 transition-all duration-300"
              />
            </Link>

            {/* Elite Search Bar */}
            <div className="hidden md:flex flex-1 max-w-4xl mx-4 lg:mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, brands, categories..."
                    className="elite-input w-full px-4 py-3 text-sm placeholder-elite-medium-grey text-elite-charcoal-black font-inter"
                  />
                </div>
              </form>
            </div>

            {/* Elite Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              {/* Wishlist */}
              <Link to="/wishlist" className="group relative">
                <div className="flex flex-col items-center p-3 text-elite-charcoal-black hover:text-elite-cta-purple transition-colors">
                  <Heart className="h-6 w-6" />
                  <span className="text-xs mt-1 font-semibold font-inter">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-elite-base-white text-xs h-6 w-6 rounded-full flex items-center justify-center font-bold shadow-card animate-pulse font-inter">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </div>
              </Link>
              
              {/* Cart */}
              <Link to="/cart" className="group relative">
                <div className="flex flex-col items-center p-3 text-elite-charcoal-black hover:text-elite-cta-purple transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-xs mt-1 font-semibold font-inter">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-elite-base-white text-xs h-6 w-6 rounded-full flex items-center justify-center font-bold shadow-card animate-pulse font-inter">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* User Menu - Shoppers9 Brand */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="group relative"
                  >
                    <div className="flex flex-col items-center p-3 text-elite-charcoal-black hover:text-elite-cta-purple transition-colors">
                      <div className="relative">
                        <User className="h-6 w-6" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-green border-2 border-white"></div>
                      </div>
                      <span className="text-xs mt-1 font-semibold font-montserrat">Profile</span>
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className="modal-content absolute right-0 mt-2 w-64 bg-gray-200 shadow-xl border border-gray-300 rounded-lg py-2 z-[9999] animate-in slide-in-from-top-2 duration-300">
                      <div className="px-3 py-2 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm font-inter">
                              {(user?.name || user?.phone || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm font-inter truncate">{user?.name || 'User'}</h3>
                            <p className="text-xs text-gray-600 font-inter truncate">{user?.email || user?.phone}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 px-3 py-2 mx-1 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="font-medium text-xs">My Profile</span>
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center space-x-3 px-3 py-2 mx-1 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-md transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <ShoppingCart className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="font-medium text-xs">Orders</span>
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center space-x-3 px-3 py-2 mx-1 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-md transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-6 h-6 bg-pink-100 rounded-md flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                            <Heart className="h-3 w-3 text-pink-600 group-hover:scale-110 transition-transform duration-200" />
                          </div>
                          <span className="font-medium text-xs">Wishlist</span>
                        </Link>
                        <Link
                          to="/support"
                          className="flex items-center space-x-3 px-3 py-2 mx-1 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <MessageCircle className="h-3 w-3 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                          </div>
                          <span className="font-medium text-xs">Support</span>
                        </Link>
                      </div>
                      <div className="border-t border-gray-200 pt-1 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-3 py-2 mx-1 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 group"
                        >
                          <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <svg className="w-3 h-3 text-red-600 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <span className="font-medium text-xs">Logout</span>
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

            {/* Mobile cart button */}
            <Link to="/cart" className="lg:hidden group relative">
              <div className="flex flex-col items-center justify-center py-2 px-1 transition-colors duration-200 text-gray-500 hover:text-gray-700">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 transition-all duration-200 text-gray-500" fill="none" strokeWidth={2} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium truncate text-gray-500">Cart</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Category Navigation */}
        <div className={`border-t border-gray-200 bg-gray-50 relative z-[999999] lg:z-50 lg:fixed lg:top-20 lg:left-0 lg:right-0 ${location.pathname === '/profile' ? 'hidden lg:block' : ''}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center lg:justify-center justify-start space-x-4 py-3 lg:overflow-x-visible overflow-x-auto lg:space-x-6 xl:space-x-8 category-scroll" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {categoriesLoading ? (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-poppins">Loading categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-gray-600 text-sm">
                  No categories available (Total: {categories.length})
                </div>
              ) : (
                categories.filter(cat => cat.level === 1).map((category, index) => (
                  <div 
                    key={category._id ? `category-${category._id}` : `category-${index}`} 
                    className="relative group"
                    onMouseEnter={() => handleCategoryHover(category._id)}
                    onMouseLeave={handleCategoryLeave}
                  >
                    <div className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2 px-3 cursor-pointer rounded-md whitespace-nowrap">
                      <Link
                        to={`/products?category=${encodeURIComponent(category.slug || category.name.toLowerCase())}`}
                        className="hover:text-blue-600 transition-colors duration-200 font-poppins"
                      >
                        <span>{category.name}</span>
                      </Link>
                      {category.children && category.children.length > 0 && (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    {showCategoriesMenu === category._id && category.children && category.children.length > 0 && (
                      <div 
                         className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999999] lg:z-[9999]"
                        onMouseEnter={() => handleCategoryHover(category._id)}
                        onMouseLeave={handleCategoryLeave}
                      >
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.children.filter(child => child.isActive).map((subcategory, subIndex) => (
                              <div key={subcategory._id || `subcategory-${subIndex}`} className="space-y-3">
                                <Link
                                  to={`/products?category=${encodeURIComponent(subcategory.slug)}`}
                                  className="block font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 text-sm uppercase tracking-wide"
                                >
                                  {subcategory.name}
                                </Link>
                                {subcategory.children && subcategory.children.length > 0 && (
                                  <div className="space-y-2">
                                    {subcategory.children.filter(subChild => subChild.isActive).map((subSubcategory, subSubIndex) => (
                                      <Link
                                        key={subSubcategory._id || `subsubcategory-${subSubIndex}`}
                                        to={`/products?category=${encodeURIComponent(subSubcategory.slug)}`}
                                        className="block text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200 py-1"
                                      >
                                        {subSubcategory.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
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
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all duration-300"
                  />
                </div>
              </form>

              {/* Mobile Categories - Hidden */}
              {!categoriesLoading && categories.length > 0 && (
                <div className="mb-6 hidden">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-4">Categories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.filter(cat => cat.level === 1).slice(0, 6).map((category, index) => (
                      <Link
                        key={`${category._id}-${index}`}
                        to={`/products?category=${encodeURIComponent(category.slug || category.name.toLowerCase())}`}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="truncate">{category.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link
                  to="/products"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-300 font-medium hidden"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Products</span>
                </Link>
                
                <Link
                  to="/cart"
                  className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-300 font-medium hidden"
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

                <Link to="/wishlist" className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 font-medium hidden">
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
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-300 font-medium hidden"
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
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium hidden"
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