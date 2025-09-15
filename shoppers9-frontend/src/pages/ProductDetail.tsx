import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Truck, Shield, RotateCcw, ArrowLeft, ZoomIn, ZoomOut, X } from 'lucide-react';
import { productService, type Product } from '../services/products';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice } from '../utils/currency';
import { getImageUrls } from '../utils/imageUtils';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, cart, localCart, cartCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist: checkIsInWishlist, isLoading: wishlistLoading } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  // Reset image index when variant changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariant]);

  const loadProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      const productData = await productService.getProduct(productId);
      console.log('Real product data from API:', productData);
      setProduct(productData);
      
      // Set default selections
      if (productData && productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]._id || '');
        if (productData.variants[0].size) {
          setSelectedSize(productData.variants[0].size);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !product._id || !selectedVariant || !selectedSize) {
      console.log('Missing required fields:', {
        product: !!product,
        productId: !!product?._id,
        selectedVariant: !!selectedVariant,
        selectedSize: !!selectedSize
      });
      alert('Please select a size before adding to cart');
      return;
    }
    
    try {
      setIsAddingToCart(true);
      console.log('Authentication status:', {
        isAuthenticated,
        user: user ? { id: user.id, phone: user.phone } : null
      });
      
      // If user is not authenticated, show login prompt
      if (!isAuthenticated) {
        alert('Please log in to add items to cart. For now, adding to local cart.');
        // The CartContext should handle local cart for unauthenticated users
      }
      // Find the selected variant to check pricing
      const selectedVariantData = product.variants.find(v => v._id === selectedVariant);
      console.log('Selected variant pricing:', selectedVariantData);
      console.log('Adding to cart:', {
        productId: product._id,
        variantId: selectedVariant,
        size: selectedSize,
        quantity,
        variantPrice: selectedVariantData?.price,
        variantOriginalPrice: selectedVariantData?.originalPrice
      });
      await addToCart(product, selectedVariant, selectedSize, quantity);
      alert('Product added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        requestData: {
          productId: product._id,
          variantId: selectedVariant,
          size: selectedSize,
          quantity
        }
      });
      console.error('Full error response:', error.response);
      console.error('Response data details:', JSON.stringify(error.response?.data, null, 2));
      alert(`Failed to add product to cart: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || !product._id) {
      
      return;
    }

    try {
      
      const isCurrentlyInWishlist = checkIsInWishlist(product._id);

      if (isCurrentlyInWishlist) {
        
        await removeFromWishlist(product._id);
      } else {
        
        await addToWishlist(product);
      }
      
    } catch (error) {
      
      // For unauthenticated users trying to use server wishlist, redirect to login
      if (!isAuthenticated && (error as any)?.message?.includes('401')) {
        
        navigate('/login');
      }
      // For other errors, just log them - don't crash the UI
    }
  };

  const getCurrentVariant = () => {
    return product?.variants.find(v => v._id === selectedVariant);
  };

  const getCurrentSize = () => {
    const variant = getCurrentVariant();
    // New structure: variant has individual size, price, stock
    return variant ? {
      size: variant.size,
      price: variant.price,
      originalPrice: variant.originalPrice,
      stock: variant.stock,
      discount: variant.originalPrice > variant.price ? 
        Math.round(((variant.originalPrice - variant.price) / variant.originalPrice) * 100) : 0
    } : null;
  };

  const getCurrentImages = () => {
    if (!product) return [];
    
    const variant = getCurrentVariant();
    const variantImages = new Set<string>();
    
    // If a specific variant is selected, show only that variant's images
    if (variant?.images && variant.images.length > 0) {
      variant.images.forEach(img => {
        if (img && img.trim()) {
          variantImages.add(img);
        }
      });
    } else {
      // Fallback: if no variant images, use main product images
      if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
          if (img && img.trim()) {
            variantImages.add(img);
          }
        });
      }
      
      // If still no images and we have a variant, try to get images from first variant
      if (variantImages.size === 0 && product.variants && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        if (firstVariant.images) {
          firstVariant.images.forEach(img => {
            if (img && img.trim()) {
              variantImages.add(img);
            }
          });
        }
      }
    }
    
    // Convert Set to Array and process with getImageUrls
    const imageArray = Array.from(variantImages);
    return getImageUrls(imageArray);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-300 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-gray-300 h-8 rounded w-3/4"></div>
                <div className="bg-gray-300 h-6 rounded w-1/2"></div>
                <div className="bg-gray-300 h-4 rounded w-full"></div>
                <div className="bg-gray-300 h-4 rounded w-2/3"></div>
               </div>
             </div>
         </div>
         
         {/* Size Selection Modal - Mobile Only */}
         {showSizeModal && (
           <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
             <div className="bg-white w-full rounded-t-2xl overflow-hidden">
               {/* Modal Header */}
               <div className="flex items-center justify-between p-4 border-b">
                 <h3 className="text-lg font-semibold text-gray-900">Select Size</h3>
                 <button
                   onClick={() => setShowSizeModal(false)}
                   className="p-2 hover:bg-gray-100 rounded-full"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               
               {/* Size Options */}
               <div className="p-4">
                 <div className="flex items-center justify-between mb-4">
                   <span className="text-sm text-gray-600">Available Sizes</span>
                   <button className="text-sm text-red-500 font-medium">Size Chart &gt;</button>
                 </div>
                 
                 <div className="grid grid-cols-5 gap-3 mb-6">
                   {Array.from(new Set(product.variants.map(v => v.size).filter(s => s && s.trim() !== ''))).map((size) => {
                     const sizeVariant = product.variants.find(v => v.size === size);
                     return (
                       <button
                         key={size}
                         onClick={() => {
                           if (sizeVariant) {
                             setSelectedVariant(sizeVariant._id || '');
                             setSelectedSize(size);
                           }
                         }}
                         className={`py-4 px-4 border rounded-xl text-center font-medium transition-colors ${
                           selectedSize === size
                             ? 'border-red-500 bg-red-50 text-red-600'
                             : 'border-gray-300 text-gray-700 hover:border-gray-400'
                         }`}
                       >
                         {size}
                       </button>
                     );
                   })}
                 </div>
                 
                 {/* Add to Cart Button */}
                 <button
                   onClick={() => {
                     if (selectedSize) {
                       handleAddToCart();
                       setShowSizeModal(false);
                     }
                   }}
                   disabled={!selectedSize || isAddingToCart}
                   className="w-full bg-red-500 text-white py-4 px-6 rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors hover:bg-red-600"
                 >
                   <ShoppingCart className="h-5 w-5" />
                   <span>{isAddingToCart ? 'Adding...' : 'Add'}</span>
                 </button>
               </div>
             </div>
           </div>
         )}
       </div>
     </div>
   );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <button
              onClick={() => navigate('/products')}
              className="text-primary-600 hover:text-primary-700"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentVariant = getCurrentVariant();
  const currentSize = getCurrentSize();
  const currentImages = getCurrentImages();

  return (
    <div className="min-h-screen bg-elite-base-white py-1 lg:py-3 pb-16 lg:pb-6">
      <div className="elite-container">
        {/* Mobile Header with Product Name */}
        <div className="lg:hidden bg-white border-b border-gray-200 -mx-4 px-4 py-2 mb-2 sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </button>
            <h1 className="font-medium text-sm text-gray-900 truncate flex-1">
              {product?.name || 'Product Details'}
            </h1>
            <button
              onClick={() => navigate('/cart')}
              className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-4 w-4 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Desktop Back Button */}
        <div className="hidden lg:block mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-elite-medium-grey hover:text-elite-cta-purple transition-colors font-inter"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            <span className="font-medium text-xs">Back</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
          {/* Elite Product Images */}
          <div className="space-y-1 lg:space-y-2">
            <div className="postcard-box p-1 lg:p-2 cursor-pointer" onClick={() => setShowImagePreview(true)}>
              <img
                src={currentImages[selectedImageIndex] || '/placeholder-image.svg'}
                alt={product.name}
                className="w-full h-56 lg:h-80 object-cover hover:opacity-90 transition-opacity"
              />
            </div>
            {currentImages.length > 1 && (
              <div className="flex space-x-1 overflow-x-auto">
                {currentImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-elite-cta-purple' : 'border-elite-light-grey'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Elite Product Info */}
          <div className="postcard-box p-2 lg:p-4">
            <h1 className="font-playfair text-base lg:text-xl font-bold text-elite-charcoal-black mb-1 lg:mb-2">{product.name}</h1>
            <p className="font-inter text-xs lg:text-sm text-elite-medium-grey mb-2 lg:mb-3 leading-relaxed">{product.description}</p>

            {/* Price */}
            {(() => {
              const priceData = currentSize || {
                price: currentVariant?.price || product.price || 0,
                originalPrice: currentVariant?.originalPrice || product.originalPrice || 0,
                discount: 0
              };
              
              if (priceData.originalPrice > priceData.price && priceData.price > 0) {
                priceData.discount = Math.round(((priceData.originalPrice - priceData.price) / priceData.originalPrice) * 100);
              }
              
              return priceData.price > 0;
            })() && (
              <div className="mb-2 lg:mb-3">
                <div className="flex items-center space-x-1">
                  <span className="font-inter text-base lg:text-xl font-bold text-elite-charcoal-black">
                    {(() => {
                      const priceData = currentSize || {
                        price: currentVariant?.price || product.price || 0,
                        originalPrice: currentVariant?.originalPrice || product.originalPrice || 0
                      };
                      return formatPrice(priceData.price);
                    })()}
                  </span>
                  {(() => {
                    const priceData = currentSize || {
                      price: currentVariant?.price || product.price || 0,
                      originalPrice: currentVariant?.originalPrice || product.originalPrice || 0
                    };
                    const discount = priceData.originalPrice > priceData.price && priceData.price > 0 ? 
                      Math.round(((priceData.originalPrice - priceData.price) / priceData.originalPrice) * 100) : 0;
                    
                    return priceData.originalPrice > priceData.price && priceData.price > 0;
                  })() && (
                    <>
                      <span className="font-inter text-sm text-elite-medium-grey line-through">
                        {(() => {
                          const priceData = currentSize || {
                            originalPrice: currentVariant?.originalPrice || product.originalPrice || 0
                          };
                          return formatPrice(priceData.originalPrice);
                        })()}
                      </span>
                      <span className="bg-elite-cta-purple text-elite-base-white text-xs font-bold font-inter px-1 py-0.5 uppercase tracking-wide">
                        {(() => {
                          const priceData = currentSize || {
                            price: currentVariant?.price || product.price || 0,
                            originalPrice: currentVariant?.originalPrice || product.originalPrice || 0
                          };
                          return Math.round(((priceData.originalPrice - priceData.price) / priceData.originalPrice) * 100);
                        })()}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Color Selection - Show if there are multiple colors or displayFilters allows */}
            {(() => {
              const uniqueColors = Array.from(new Set(product.variants.map(v => v.color).filter(c => c && c !== 'Default')));
              return uniqueColors.length > 0 && (!product.displayFilters || 
                product.displayFilters.length === 0 || 
                product.displayFilters.some(filterId => filterId.toLowerCase().includes('color')));
            })() && (
              <div className="mb-3 lg:mb-4">
                <h3 className="text-xs lg:text-sm font-medium text-gray-900 mb-1 lg:mb-2">Color: {currentVariant?.color}</h3>
                <div className="flex space-x-1 lg:space-x-2">
                  {Array.from(new Set(product.variants.map(v => v.color).filter(c => c && c !== 'Default'))).map((color) => {
                    const colorVariant = product.variants.find(v => v.color === color);
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          if (colorVariant) {
                            setSelectedVariant(colorVariant._id || '');
                            setSelectedSize(colorVariant.size || '');
                          }
                        }}
                        className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 ${
                          currentVariant?.color === color ? 'border-primary-600' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: colorVariant?.colorCode || color }}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection - Show available sizes */}
            {(() => {
              const uniqueSizes = Array.from(new Set(product.variants.map(v => v.size).filter(s => s && s.trim() !== '')));
              return uniqueSizes.length > 0 && (!product.displayFilters || 
                product.displayFilters.length === 0 || 
                product.displayFilters.some(filterId => filterId.toLowerCase().includes('size')));
            })() && (
              <div className="mb-3 lg:mb-4">
                <h3 className="text-xs lg:text-sm font-medium text-gray-900 mb-1 lg:mb-2">Size</h3>
                <div className="flex flex-wrap gap-1">
                  {/* Get unique sizes available for the selected color */}
                  {Array.from(new Set(
                    product.variants
                      .filter(v => !currentVariant || v.color === currentVariant.color || v.color === 'Default')
                      .map(v => v.size)
                      .filter(s => s && s.trim() !== '')
                  )).map((size) => {
                    const sizeVariant = product.variants.find(v => 
                      (v.color === (currentVariant?.color || 'Default')) && v.size === size
                    );
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (sizeVariant) {
                            setSelectedVariant(sizeVariant._id || '');
                            setSelectedSize(size);
                          }
                        }}
                        disabled={!sizeVariant || sizeVariant.stock === 0}
                        className={`px-2 py-1 lg:px-3 lg:py-1 border rounded-lg font-medium text-xs ${
                          selectedSize === size
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : !sizeVariant || sizeVariant.stock === 0
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size}
                        {(!sizeVariant || sizeVariant.stock === 0) && ' (Out of Stock)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-3 lg:mb-4">
              <h3 className="text-xs lg:text-sm font-medium text-gray-900 mb-1 lg:mb-2">Quantity</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 lg:w-8 lg:h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 text-sm"
                >
                  -
                </button>
                <span className="text-sm font-medium w-7 lg:w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 lg:w-8 lg:h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Mobile Action Buttons - Below Quantity */}
            <div className="lg:hidden space-y-2 mb-3">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || !selectedSize || isAddingToCart || (currentSize?.stock === 0)}
                className="w-full text-white py-2 px-3 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors text-xs" style={{backgroundColor: (!selectedVariant || !selectedSize || isAddingToCart || (currentSize?.stock === 0)) ? '#d1d5db' : '#322F61'}}
              >
                <ShoppingCart className="h-3 w-3" />
                <span>{isAddingToCart ? 'Adding...' : 'Add'}</span>
              </button>
              
              <button 
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`w-full border py-2 px-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-xs ${
                  product && checkIsInWishlist(product._id)
                    ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Heart className={`h-3 w-3 ${
                  product && checkIsInWishlist(product._id) ? 'fill-current text-red-500' : ''
                }`} />
                <span>
                  {wishlistLoading 
                    ? (product && checkIsInWishlist(product._id) ? 'Removing...' : 'Adding...') 
                    : (product && checkIsInWishlist(product._id) ? 'Remove from Wishlist' : 'Add to Wishlist')
                  }
                </span>
              </button>
            </div>

            {/* Desktop Add to Cart - Hidden on Mobile */}
            <div className="hidden lg:block space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || !selectedSize || isAddingToCart || (currentSize?.stock === 0)}
                className="w-full text-white py-2 px-4 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors text-sm" style={{backgroundColor: (!selectedVariant || !selectedSize || isAddingToCart || (currentSize?.stock === 0)) ? '#d1d5db' : '#322F61'}}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{isAddingToCart ? 'Adding...' : 'Add'}</span>
              </button>
              
              <button 
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`w-full border py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm ${
                  product && checkIsInWishlist(product._id)
                    ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Heart className={`h-4 w-4 ${
                  product && checkIsInWishlist(product._id) ? 'fill-current text-red-500' : ''
                }`} />
                <span>
                  {wishlistLoading 
                    ? (product && checkIsInWishlist(product._id) ? 'Removing...' : 'Adding...') 
                    : (product && checkIsInWishlist(product._id) ? 'Remove from Wishlist' : 'Add to Wishlist')
                  }
                </span>
              </button>
            </div>



            {/* Product Details */}
            {product.specifications && (
              <div className="mt-3 lg:mt-4">
                <h3 className="text-xs lg:text-sm font-medium text-gray-900 mb-1 lg:mb-2">Product Details</h3>
                <div className="space-y-1 text-xs">
                  {product.specifications.fabric && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fabric:</span>
                      <span className="font-medium">{product.specifications.fabric}</span>
                    </div>
                  )}
                  {product.specifications.fit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fit:</span>
                      <span className="font-medium">{product.specifications.fit}</span>
                    </div>
                  )}
                  {product.specifications.material && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material:</span>
                      <span className="font-medium">{product.specifications.material}</span>
                    </div>
                  )}
                  {product.specifications.washCare && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wash Care:</span>
                      <span className="font-medium">{product.specifications.washCare}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


        
        {/* Image Preview Modal */}
        {showImagePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowImagePreview(false);
                  setZoomLevel(1);
                }}
                className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              
              {/* Zoom Controls */}
              <div className="absolute top-4 left-4 z-10 flex space-x-2">
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors"
                >
                  <ZoomOut className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors"
                >
                  <ZoomIn className="h-5 w-5 text-white" />
                </button>
                <div className="bg-white bg-opacity-20 rounded-full px-3 py-2 text-white text-sm font-medium">
                  {Math.round(zoomLevel * 100)}%
                </div>
              </div>
              
              {/* Image Navigation */}
              {currentImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : currentImages.length - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-colors"
                  >
                    <ArrowLeft className="h-6 w-6 text-white" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex < currentImages.length - 1 ? selectedImageIndex + 1 : 0)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-colors"
                  >
                    <ArrowLeft className="h-6 w-6 text-white transform rotate-180" />
                  </button>
                </>
              )}
              
              {/* Main Image */}
              <div className="overflow-auto max-w-full max-h-full">
                <img
                  src={currentImages[selectedImageIndex] || '/placeholder-image.svg'}
                  alt={product?.name}
                  className="max-w-none transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    cursor: zoomLevel > 1 ? 'grab' : 'default'
                  }}
                  draggable={false}
                />
              </div>
              
              {/* Image Counter */}
              {currentImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-20 rounded-full px-4 py-2 text-white text-sm font-medium">
                  {selectedImageIndex + 1} / {currentImages.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Bottom Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white p-3 z-50" style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          borderTop: '1px solid #e5e7eb'
        }}>
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button 
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`flex-1 py-3 px-4 font-medium rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                product && checkIsInWishlist(product._id)
                  ? 'border-2 border-red-500 bg-red-50 text-red-600'
                  : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Heart className={`h-4 w-4 ${
                product && checkIsInWishlist(product._id) ? 'fill-current text-red-500' : ''
              }`} />
              <span>Wishlist</span>
            </button>
            
            <button
              onClick={() => setShowSizeModal(true)}
              className="flex-1 py-3 px-4 font-medium rounded-lg flex items-center justify-center space-x-2 text-sm text-white transition-all duration-200 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--cta-dark-purple)'
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;