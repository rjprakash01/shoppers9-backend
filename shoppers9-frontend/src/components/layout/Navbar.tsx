import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState('');

  const categories = [
    { name: 'Men', subcategories: ['Topwear', 'Bottomwear', 'Footwear', 'Accessories'] },
    { name: 'Women', subcategories: ['Western Wear', 'Ethnic Wear', 'Footwear', 'Accessories'] },
    { name: 'Kids', subcategories: ['Boys Clothing', 'Girls Clothing', 'Footwear', 'Toys'] },
    { name: 'Home & Living', subcategories: ['Bedsheets', 'Curtains', 'Cushions', 'Decor'] },
    { name: 'Beauty', subcategories: ['Makeup', 'Skincare', 'Haircare', 'Fragrances'] }
  ];

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
      {/* Main Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-200">
                <span className="text-white font-bold text-lg">S9</span>
              </div>
              <span className="text-xl font-bold text-gray-800 hidden sm:block group-hover:text-pink-600 transition-colors duration-200">
                Shoppers9
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-6">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products, brands and more"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-sm placeholder-gray-500"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </form>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Wishlist */}
              <Link to="/wishlist" className="flex flex-col items-center text-gray-700 hover:text-pink-600 transition-colors duration-200 group">
                <Heart className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">Wishlist</span>
              </Link>
              
              {/* Cart */}
              <Link to="/cart" className="flex flex-col items-center text-gray-700 hover:text-pink-600 transition-colors duration-200 group relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex flex-col items-center text-gray-700 hover:text-pink-600 transition-colors duration-200"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-xs mt-1 font-medium">Profile</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="font-medium text-gray-800 text-sm">{user?.name || 'User'}</div>
                        <div className="text-xs text-gray-500">{user?.email || user?.phone}</div>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Wishlist
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex flex-col items-center text-gray-700 hover:text-pink-600 transition-colors duration-200"
                >
                  <User className="h-5 w-5" />
                  <span className="text-xs mt-1 font-medium">Profile</span>
                </Link>
              )}
          </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-pink-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="hidden lg:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-8 py-3">
              {categories.map((category) => (
                <div key={category.name} className="relative group">
                  <button
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-pink-600 transition-colors duration-200 py-2"
                    onMouseEnter={() => setShowCategoriesMenu(category.name)}
                    onMouseLeave={() => setShowCategoriesMenu('')}
                  >
                    <span>{category.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showCategoriesMenu === category.name && (
                    <div 
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      onMouseEnter={() => setShowCategoriesMenu(category.name)}
                      onMouseLeave={() => setShowCategoriesMenu('')}
                    >
                      {category.subcategories.map((subcategory) => (
                        <Link
                          key={subcategory}
                          to={`/products?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subcategory)}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pink-600 transition-colors duration-200"
                        >
                          {subcategory}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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