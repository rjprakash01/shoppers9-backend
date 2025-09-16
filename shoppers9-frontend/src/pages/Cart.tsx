import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Heart, Star, Gift, Percent, Truck, Shield, CreditCard, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import AddressBook from '../components/AddressBook';
import { settingsService, type PlatformSettings } from '../services/settings';
import type { CartItem } from '../services/cart';

interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, localCart, cartCount, cartTotal, updateCartItem, removeFromCart, refreshCart, addToCart, moveToWishlist } = useCart();
  const { isAuthenticated, user, updateUser } = useAuth();
  const { wishlist, localWishlist, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist, refreshWishlist } = useWishlist();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sizeModalOpen, setSizeModalOpen] = useState<string | null>(null);
  const [quantityModalOpen, setQuantityModalOpen] = useState<string | null>(null);
  const [selectedItemForChange, setSelectedItemForChange] = useState<CartItem | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);


  // Get current cart items based on authentication status
  const cartItems = isAuthenticated ? (cart?.items || []) : localCart;

  // Refresh cart data when component mounts
  React.useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated]);

  // Load platform settings
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const platformSettings = await settingsService.getSettings();
        setSettings(platformSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Set default address when user data is available
  React.useEffect(() => {
    if (user?.addresses && user.addresses.length > 0 && !selectedAddress) {
      // If user has only one address, automatically set it as default
      if (user.addresses.length === 1) {
        const singleAddress = { ...user.addresses[0], isDefault: true };
        setSelectedAddress(singleAddress);
      } else {
        // If multiple addresses, use the default one or first one
        const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
        setSelectedAddress(defaultAddress);
      }
    }
  }, [user, selectedAddress]);

  // Initialize all cart items as selected by default
  React.useEffect(() => {
    if (cartItems.length > 0) {
      const allItemIds = new Set(cartItems.map(item => {
        return item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
      }));
      setSelectedItems(allItemIds);
    }
  }, [cartItems]);

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
    setIsUpdating(itemKey);
    try {
      if (isAuthenticated) {
        await updateCartItem(item._id!, item.variantId, item.size, newQuantity);
      } else {
        const productId = item.product || item.productId;
        await updateCartItem(productId!, item.variantId, item.size, newQuantity);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
    setIsUpdating(itemKey);
    try {
      if (isAuthenticated && item._id) {
        await removeFromCart(item._id, item.variantId, item.size);
      } else {
        const productId = item.product || item.productId;
        if (productId) {
          await removeFromCart(productId, item.variantId, item.size);
        }
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // Handle error gracefully without breaking the UI
    } finally {
      setIsUpdating(null);
    }
  };

  const handleMoveToWishlist = async (item: CartItem) => {
    const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
    setIsUpdating(itemKey);
    try {
      if (isAuthenticated && item._id) {
        await moveToWishlist(item._id);
        await refreshWishlist();
      } else {
        const productId = item.product || item.productId;
        if (!productId) {
          console.warn('No product ID available for wishlist operation');
          return;
        }
        
        const product = item.productData || {
          _id: productId,
          name: item.productData?.name || 'Product',
          description: '',
          category: '',
          subCategory: '',
          brand: '',
          price: item.price,
          images: item.productData?.images || item.variant?.images || [],
          variants: item.productData?.variants || [],
          specifications: {},
          tags: [],
          isActive: true,
          isFeatured: false,
          isTrending: false,
          displayFilters: [],
          createdAt: '',
          updatedAt: ''
        };
        
        try {
          await addToWishlist(product, item.variantId);
          await removeFromCart(productId, item.variantId, item.size);
          await refreshWishlist();
        } catch (wishlistError) {
          console.error('Error in wishlist operation:', wishlistError);
          // Handle wishlist error gracefully
        }
      }
    } catch (error) {
      console.error('Error moving to wishlist:', error);
      // Handle error gracefully without breaking the UI
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCheckout = () => {
    if (getSelectedItemsCount() === 0) {
      alert('Please select at least one item to proceed with checkout.');
      return;
    }
    
    // Store selected items for checkout
    const selectedCartItems = cartItems.filter(item => {
      const itemId = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
      return selectedItems.has(itemId);
    });
    
    // You can store this in context or pass via navigation state
    localStorage.setItem('selectedCartItems', JSON.stringify(selectedCartItems));
    navigate('/checkout');
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setIsAddressBookOpen(false);
  };

  const handleChangeAddress = () => {
    setIsAddressBookOpen(true);
  };

  const handleAddAddress = () => {
    // Open AddressBook modal for adding new address
    setIsAddressBookOpen(true);
  };

  // Check if user has any addresses
  const hasAddresses = user?.addresses && user.addresses.length > 0;
  const hasMultipleAddresses = user?.addresses && user.addresses.length > 1;





  const handleItemSelection = (itemId: string, isSelected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allItemIds = new Set(cartItems.map(item => {
        return item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
      }));
      setSelectedItems(allItemIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const calculateSelectedItemsTotal = () => {
    return cartItems
      .filter(item => {
        const itemId = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
        return selectedItems.has(itemId);
      })
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculatePlatformFee = () => {
    if (!settings) return 0;
    const subtotal = calculateSelectedItemsTotal();
    return settingsService.calculatePlatformFee(subtotal, settings);
  };

  const calculateDeliveryCharges = () => {
    if (!settings) return 0;
    const subtotal = calculateSelectedItemsTotal();
    return settingsService.calculateDeliveryFee(subtotal, settings);
  };

  const calculateTotal = () => {
    const subtotal = calculateSelectedItemsTotal();
    const platformFee = calculatePlatformFee();
    const deliveryCharges = calculateDeliveryCharges();
    return subtotal + platformFee + deliveryCharges;
  };

  const getSelectedItemsCount = () => {
    return cartItems.filter(item => {
      const itemId = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
      return selectedItems.has(itemId);
    }).length;
  };

  // Mock stock data - in real app, this would come from API
  const getAvailableStock = (productId: string, variantId: string) => {
    // Mock stock data
    const stockData = {
      sizes: {
        'XS': 2,
        'S': 5,
        'M': 8,
        'L': 12,
        'XL': 6,
        'XXL': 3
      },
      maxQuantity: 10
    };
    return stockData;
  };

  const handleSizeChange = async (item: CartItem, newSize: string) => {
    try {
      setIsUpdating(item._id || 'updating');
      // In real app, you would call updateCartItem with new size
      // await updateCartItem(item._id, item.variantId, newSize, item.quantity);
      setSizeModalOpen(null);
      setSelectedItemForChange(null);
    } catch (error) {
      console.error('Error updating size:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleQuantityChangeModal = async (item: CartItem, newQuantity: number) => {
    try {
      setIsUpdating(item._id || 'updating');
      await handleQuantityChange(item, newQuantity);
      setQuantityModalOpen(null);
      setSelectedItemForChange(null);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const openSizeModal = (item: CartItem) => {
    const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
    setSelectedItemForChange(item);
    setSizeModalOpen(itemKey);
  };

  const openQuantityModal = (item: CartItem) => {
    const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
    setSelectedItemForChange(item);
    setQuantityModalOpen(itemKey);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-elite-light-grey flex items-center justify-center p-4">
        <div className="postcard-box p-8 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-elite-light-grey flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-elite-medium-grey" />
          </div>
          
          <h2 className="font-playfair text-subsection font-semibold text-elite-charcoal-black mb-3">Your cart is empty</h2>
          <p className="font-inter text-body text-elite-medium-grey mb-6">
            Add items to get started
          </p>
          
          <Link
            to="/products"
            className="btn-primary w-full py-3 px-4 font-medium font-inter inline-block text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      backgroundColor: 'var(--light-grey)'
    }}>


      {/* Mobile Cart Header - Clean */}
      <div className="lg:hidden p-4">
        <div className="bg-white" style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors" style={{
                  backgroundColor: 'rgba(99,102,241,0.1)'
                }}
              >
                <ArrowLeft className="h-4 w-4" style={{
                  color: 'var(--cta-dark-purple)'
                }} />
              </button>
              <h1 className="text-xl font-bold" style={{
                fontFamily: 'Inter, sans-serif',
                color: '#1f2937'
              }}>My Cart</h1>
            </div>
            
            <div className="text-sm font-medium" style={{
              color: 'var(--cta-dark-purple)'
            }}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator - Mobile Only */}
      <div className="lg:hidden p-4">
        <div className="bg-white rounded-xl p-4" style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div className="flex items-center justify-center space-x-4 max-w-xs mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{
                backgroundColor: 'var(--cta-dark-purple)'
              }}>
                1
              </div>
              <span className="text-xs font-medium mt-1" style={{
                color: 'var(--cta-dark-purple)'
              }}>Cart</span>
            </div>
            <div className="w-12 h-px" style={{
              backgroundColor: 'var(--medium-grey)'
            }}></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{
                backgroundColor: 'var(--medium-grey)'
              }}>
                2
              </div>
              <span className="text-xs mt-1" style={{
                color: 'var(--medium-grey)'
              }}>Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Elite Delivery Address */}
      <div className="bg-white border border-gray-200 rounded-lg mx-4 my-4 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-purple-600 flex items-center justify-center mr-3 rounded">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <div>
              {selectedAddress ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    Delivery at {selectedAddress.city} - {selectedAddress.pincode}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedAddress.name} • {selectedAddress.phone}
                  </p>
                  {selectedAddress.isDefault && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                      Default Address
                    </span>
                  )}
                </>
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {hasAddresses ? 'Select delivery address' : 'Add delivery address'}
                </p>
              )}
            </div>
          </div>
          {hasAddresses ? (
            <button 
              onClick={handleChangeAddress}
              className="bg-gray-200 text-gray-800 px-3 py-1 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
            >
              Change
            </button>
          ) : (
            <button 
              onClick={handleAddAddress}
              className="bg-purple-600 text-white px-3 py-1 text-sm font-medium rounded hover:bg-purple-700 transition-colors"
            >
              Add Address
            </button>
          )}
        </div>
      </div>

      <div className="elite-container py-3 pb-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-4 lg:space-y-0">
          {/* Left Side - Cart Items */}
          <div className="space-y-4">
            {/* Elite Select All Header */}
            {cartItems.length > 0 && (
              <div className="postcard-box px-3 sm:px-4 py-2.5">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="mr-3 h-4 w-4 text-elite-cta-purple focus:ring-elite-cta-purple border-elite-medium-grey"
                  />
                  <span className="font-inter text-sm font-medium text-elite-charcoal-black">
                    Select All ({getSelectedItemsCount()}/{cartItems.length} items)
                  </span>
                </label>
              </div>
            )}
            
            {/* Elite Cart Items List */}
            <div className="space-y-4">
          {cartItems.map((item: CartItem) => {
          const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
          const productId = item.productData?._id || item.product || item.productId;
          const productName = item.productData?.name || 'Product';
          const isUpdatingThis = isUpdating === itemKey;
          
          return (
            <div key={itemKey} className="postcard-box p-4 sm:p-6">
              <div className="flex space-x-3">
                {/* Item Selection Checkbox */}
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(itemKey)}
                    onChange={(e) => handleItemSelection(itemKey, e.target.checked)}
                    className="h-4 w-4 text-elite-cta-purple focus:ring-elite-cta-purple border-elite-medium-grey rounded"
                  />
                </div>
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <Link to={`/products/${productId}`}>
                    <img
                      src={getImageUrl(item.productData?.images?.[0] || item.variant?.images?.[0] || '/placeholder-image.svg')}
                      alt={productName}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.svg';
                      }}
                    />
                  </Link>
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${productId}`}
                    className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 block mb-1 sm:mb-2"
                  >
                    {productName}
                  </Link>
                  
                  <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    {formatPrice(item.price)}
                  </div>
                  
                  {/* Size and Quantity */}
                  <div className="flex items-center space-x-4 text-sm">
                    {item.size && (
                      <button
                        onClick={() => openSizeModal(item)}
                        className="flex items-center text-gray-700 hover:text-purple-600 font-medium"
                      >
                        <span>Size: {item.size}</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => openQuantityModal(item)}
                      className="flex items-center text-gray-700 hover:text-purple-600 font-medium"
                    >
                      <span>Qty: {item.quantity}</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Returns and Delivery */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Truck className="h-3 w-3 mr-1" />
                      <span>Estimated Delivery by Friday, 26th Sep</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex border-t border-elite-light-grey mt-4">
                <button
                  onClick={() => handleMoveToWishlist(item)}
                  disabled={isUpdatingThis}
                  className="flex-1 flex items-center justify-center py-3 text-sm font-medium font-inter text-elite-medium-grey"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Move to Wishlist
                </button>
                <div className="w-px bg-elite-light-grey"></div>
                <button
                  onClick={() => handleRemoveItem(item)}
                  disabled={isUpdatingThis}
                  className="flex-1 flex items-center justify-center py-3 text-sm font-medium font-inter text-elite-medium-grey"
                >
                  {isUpdatingThis ? (
                    <div className="w-4 h-4 border-2 border-elite-medium-grey border-t-transparent mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Remove
                </button>
              </div>
            </div>
          );
        })}
            </div>
            
            {/* Wishlist Section */}
            {(isAuthenticated ? wishlist?.items || [] : localWishlist).length > 0 && (
              <div className="postcard-box p-4 sm:p-6 mt-4" style={{backgroundColor: '#FAFAFA'}}>
                <h3 className="text-lg font-semibold text-elite-charcoal-black mb-4 flex items-center">
                  <Heart className="h-5 w-5 text-elite-cta-purple mr-2" />
                  Wishlist ({(isAuthenticated ? wishlist?.items?.length : localWishlist.length) || 0} items)
                </h3>
                
                <div className="space-y-4">
                  {(isAuthenticated ? wishlist?.items || [] : localWishlist).map((item: any, index: number) => {
                    const product = item.product || item;
                    const wishlistItemId = item._id || `wishlist-${product._id || product.id}-${index}`;
                    

                    
                    if (!product) return null;
                    
                    // Get the product price - try different sources
                    const getProductPrice = () => {
                      if (product.price && product.price > 0) return product.price;
                      if (product.minPrice && product.minPrice > 0) return product.minPrice;
                      if (product.variants && product.variants.length > 0) {
                        const firstVariant = product.variants[0];
                        if (firstVariant.price && firstVariant.price > 0) return firstVariant.price;
                      }
                      return 0;
                    };
                    
                    const productPrice = getProductPrice();
                    
                    return (
                      <div key={wishlistItemId} className="postcard-box p-4">
                        <div className="flex space-x-3">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                 src={(() => {
                                   const imageUrl = product.images?.[0] || product.variants?.[0]?.images?.[0];
                                   // Check if it's a base64 data URL
                                   if (imageUrl && imageUrl.startsWith('data:')) {
                                     return imageUrl;
                                   }
                                   // Otherwise use getImageUrl for file paths
                                   return getImageUrl(imageUrl || '/placeholder-image.svg');
                                 })()}
                                 alt={product.name || 'Product'}
                                 className="w-full h-full object-cover"
                                 onError={(e) => {
                                   const target = e.target as HTMLImageElement;
                                   target.src = '/placeholder-image.svg';
                                 }}
                               />
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-playfair text-sm font-semibold text-elite-charcoal-black line-clamp-2 mb-1">{product.name || 'Product Name'}</h4>
                            <p className="font-inter text-sm font-bold text-elite-charcoal-black mb-2">{formatPrice(productPrice)}</p>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={async () => {
                                  try {
                                    if (product._id || product.id) {
                                      // Get the first available variant and size
                                      const firstVariant = product.variants?.[0];
                                      const variantId = item.variantId || firstVariant?._id || 'default';
                                      const size = firstVariant?.size || 'M';
                                      
                                      await addToCart(product, variantId, size, 1);
                                      // Remove from wishlist after successfully adding to cart
                                      const productId = product._id || product.id;
                                      if (productId) {
                                        await removeFromWishlist(productId);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error adding to cart:', error);
                                  }
                                }}
                                className="flex items-center justify-center py-2 px-3 text-xs font-medium font-inter text-elite-medium-grey hover:text-elite-cta-purple transition-colors"
                              >
                                <ShoppingBag className="w-4 h-4 mr-1" />
                                Move to Cart
                              </button>
                              <button
                                onClick={() => {
                                  const productId = product._id || product.id;
                                  if (productId) {
                                    removeFromWishlist(productId);
                                  }
                                }}
                                className="flex items-center justify-center py-2 px-3 text-xs font-medium font-inter text-elite-medium-grey hover:text-red-500 transition-colors"
                              >
                                <Heart className="w-4 h-4 mr-1 fill-current" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Side - Price Details & Checkout */}
           <div className="space-y-3">
             {/* Price Details Section */}
             <div className="bg-white rounded-lg border border-gray-200 p-3">
               <h3 className="text-base font-semibold text-gray-900 mb-3">Price Details</h3>
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total MRP</span>
                    <span className="text-sm text-gray-900">{formatPrice(calculateSelectedItemsTotal())}</span>
                  </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-gray-600">Platform Fee</span>
                   <div className="text-right">
                     {calculatePlatformFee() === 0 ? (
                       <span className="text-sm text-green-600">FREE</span>
                     ) : (
                       <span className="text-sm text-gray-900">{formatPrice(calculatePlatformFee())}</span>
                     )}
                   </div>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-gray-600">Delivery Charges</span>
                   <div className="text-right">
                     {calculateDeliveryCharges() === 0 ? (
                       <span className="text-sm text-green-600">FREE</span>
                     ) : (
                       <span className="text-sm text-gray-900">{formatPrice(calculateDeliveryCharges())}</span>
                     )}
                   </div>
                 </div>
                 {settings && calculateSelectedItemsTotal() < settings.freeDeliveryMinAmount && (
                    <div className="text-xs text-gray-500">
                      Add {formatPrice(settings.freeDeliveryMinAmount - calculateSelectedItemsTotal())} more for free delivery
                    </div>
                  )}
                 <div className="border-t pt-2 flex justify-between items-center">
                   <span className="text-base font-semibold text-gray-900">Total Amount</span>
                   <span className="text-base font-semibold text-gray-900">{formatPrice(calculateTotal())}</span>
                 </div>
               </div>
             </div>

              {/* Place Order Button - Desktop Only */}
              <div className="hidden lg:block">
                <button
                  onClick={handleCheckout}
                  disabled={getSelectedItemsCount() === 0}
                  className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    getSelectedItemsCount() === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#322F61] text-white hover:bg-[#463F85]'
                  }`}
                >
                  PLACE ORDER
                </button>
              </div>
 





           </div>
         </div>
       </div>
       
       {/* Bottom Price Summary - Mobile Only */}
         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 lg:hidden z-50">
         <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-base sm:text-lg font-semibold text-gray-900">{formatPrice(calculateTotal())}</p>
            <button 
              onClick={() => setShowPriceDetails(!showPriceDetails)}
              className="text-xs sm:text-sm text-purple-600 font-medium"
            >
              VIEW PRICE DETAILS
            </button>
          </div>
          <button
             onClick={handleCheckout}
             disabled={getSelectedItemsCount() === 0}
             className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-md text-sm font-medium transition-colors ${
               getSelectedItemsCount() === 0
                 ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                 : 'bg-[#322F61] text-white hover:bg-[#463F85]'
             }`}
           >
             PLACE ORDER
           </button>
        </div>
      </div>
      
      {/* Size Selection Modal */}
      {sizeModalOpen && selectedItemForChange && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end lg:items-center justify-center">
          <div className="bg-white w-full lg:max-w-md lg:rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Select Size</h3>
              <button
                onClick={() => {
                  setSizeModalOpen(null);
                  setSelectedItemForChange(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Size Options */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {Object.entries(getAvailableStock(selectedItemForChange.product || selectedItemForChange.productId || '', selectedItemForChange.variantId).sizes)
                  .filter(([size, stock]) => stock > 0)
                  .map(([size, stock]) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(selectedItemForChange, size)}
                      className={`p-3 border rounded-full text-center font-medium ${
                        selectedItemForChange.size === size
                          ? 'border-red-500 text-red-500 bg-red-50'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))
                }
              </div>
              
              {/* Price and Seller Info */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">{formatPrice(selectedItemForChange.price)}</span>
                  <span className="text-sm text-gray-500 line-through">{formatPrice(selectedItemForChange.price * 1.6)}</span>
                  <span className="text-sm text-orange-500 font-medium">(60% OFF)</span>
                </div>
                <p className="text-sm text-gray-600">Seller: {selectedItemForChange.productData?.brand || 'Brand Name'}</p>
              </div>
            </div>
            
            {/* Done Button */}
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setSizeModalOpen(null);
                  setSelectedItemForChange(null);
                }}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selection Modal */}
      {quantityModalOpen && selectedItemForChange && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end lg:items-center justify-center">
          <div className="bg-white w-full lg:max-w-md lg:rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Select Quantity</h3>
              <button
                onClick={() => {
                  setQuantityModalOpen(null);
                  setSelectedItemForChange(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Quantity Options */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {Array.from({ length: Math.min(getAvailableStock(selectedItemForChange.product || selectedItemForChange.productId || '', selectedItemForChange.variantId).maxQuantity, 6) }, (_, i) => i + 1)
                  .map((qty) => (
                    <button
                      key={qty}
                      onClick={() => handleQuantityChangeModal(selectedItemForChange, qty)}
                      className={`p-3 border rounded-full text-center font-medium ${
                        selectedItemForChange.quantity === qty
                          ? 'border-red-500 text-red-500 bg-red-50'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {qty}
                    </button>
                  ))
                }
              </div>
            </div>
            
            {/* Done Button */}
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setQuantityModalOpen(null);
                  setSelectedItemForChange(null);
                }}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Book Modal */}
      <AddressBook
        isOpen={isAddressBookOpen}
        onClose={() => setIsAddressBookOpen(false)}
        onSelectAddress={handleAddressSelect}
        selectedAddressId={selectedAddress?.id}
      />



    </div>
  );
};

export default Cart;