import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Truck, Shield, RotateCcw, ArrowLeft } from 'lucide-react';
import { productService, type Product } from '../services/products';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice } from '../utils/currency';
import { getImageUrls } from '../utils/imageUtils';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
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
                   <span>{isAddingToCart ? 'Adding...' : 'Add to Bag'}</span>
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
    <div className="min-h-screen bg-elite-base-white py-8 pb-32 lg:pb-8">
      <div className="elite-container">
        {/* Elite Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-elite-medium-grey hover:text-elite-cta-purple transition-colors font-inter"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Elite Product Images */}
          <div className="space-y-4">
            <div className="postcard-box p-4">
              <img
                src={currentImages[selectedImageIndex] || '/placeholder-image.svg'}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </div>
            {currentImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {currentImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 ${
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
          <div className="postcard-box p-6">
            <h1 className="font-playfair text-hero font-bold text-elite-charcoal-black mb-4">{product.name}</h1>
            <p className="font-inter text-body text-elite-medium-grey mb-6 leading-relaxed">{product.description}</p>

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
              <div className="mb-6">
                <div className="flex items-center space-x-3">
                  <span className="font-inter text-4xl font-bold text-elite-charcoal-black">
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
                      <span className="font-inter text-lg text-elite-medium-grey line-through">
                        {(() => {
                          const priceData = currentSize || {
                            originalPrice: currentVariant?.originalPrice || product.originalPrice || 0
                          };
                          return formatPrice(priceData.originalPrice);
                        })()}
                      </span>
                      <span className="bg-elite-cta-purple text-elite-base-white px-3 py-1 text-sm font-bold font-inter uppercase tracking-wide">
                        {(() => {
                          const priceData = currentSize || {
                            price: currentVariant?.price || product.price || 0,
                            originalPrice: currentVariant?.originalPrice || product.originalPrice || 0
                          };
                          return Math.round(((priceData.originalPrice - priceData.price) / priceData.originalPrice) * 100);
                        })()}% OFF
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
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Color: {currentVariant?.color}</h3>
                <div className="flex space-x-3">
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
                        className={`w-10 h-10 rounded-full border-2 ${
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
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
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
                        className={`px-4 py-2 border rounded-lg font-medium ${
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
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Desktop Add to Cart - Hidden on Mobile */}
            <div className="hidden lg:block space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || !selectedSize || isAddingToCart || (currentSize?.stock === 0)}
                className="w-full text-white py-3 px-6 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors" style={{backgroundColor: (!selectedVariant || !selectedSize || isAddingToCart || (currentSize?.stock === 0)) ? '#d1d5db' : '#322F61'}}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
              </button>
              
              <button 
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`w-full border py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                  product && checkIsInWishlist(product._id)
                    ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Heart className={`h-5 w-5 ${
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

            {/* Features */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Truck className="h-5 w-5" />
                <span>Free shipping on orders over ₹500</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Shield className="h-5 w-5" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <RotateCcw className="h-5 w-5" />
                <span>Easy returns within 30 days</span>
              </div>
            </div>

            {/* Product Details */}
            {product.specifications && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
                <div className="space-y-2 text-sm">
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

        {/* Related Products Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Placeholder for related products - can be implemented later */}
            <div className="text-center text-gray-500 col-span-full py-8">
              <p>Related products will be displayed here</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Bottom Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button 
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`btn-secondary flex-1 py-4 px-6 font-medium font-inter flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                product && checkIsInWishlist(product._id)
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : ''
              }`}
            >
              <Heart className={`h-5 w-5 ${
                product && checkIsInWishlist(product._id) ? 'fill-current text-red-500' : ''
              }`} />
              <span>Wishlist</span>
            </button>
            
            <button
              onClick={() => setShowSizeModal(true)}
              className="btn-primary flex-1 py-4 px-6 font-medium font-inter flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Bag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;