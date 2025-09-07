import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Truck, Shield, RotateCcw } from 'lucide-react';
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
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist: checkIsInWishlist, isLoading: wishlistLoading } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      const productData = await productService.getProduct(productId);
      setProduct(productData);
      
      // Set default selections
      if (productData && productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]._id || '');
        if (productData.variants[0].sizes && productData.variants[0].sizes.length > 0) {
          setSelectedSize(productData.variants[0].sizes[0].size);
        }
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      
      // Don't show mock data, just set product to null to show "Product Not Found"
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !product._id || !selectedVariant || !selectedSize) {
      console.error('Cannot add to cart: missing product data', { product: product?._id, selectedVariant, selectedSize });
      return;
    }
    
    try {
      setIsAddingToCart(true);
      await addToCart(product, selectedVariant, selectedSize, quantity);
      // Show success message or redirect
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || !product._id) {
      console.error('Cannot toggle wishlist: missing product data');
      return;
    }

    try {
      console.log('Toggling wishlist for product:', product._id);
      const isCurrentlyInWishlist = checkIsInWishlist(product._id);
      console.log('Currently in wishlist:', isCurrentlyInWishlist);
      
      if (isCurrentlyInWishlist) {
        console.log('Removing from wishlist...');
        await removeFromWishlist(product._id);
      } else {
        console.log('Adding to wishlist...');
        await addToWishlist(product);
      }
      console.log('Wishlist toggle completed successfully');
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      // For unauthenticated users trying to use server wishlist, redirect to login
      if (!isAuthenticated && (error as any)?.message?.includes('401')) {
        console.log('Redirecting to login for authentication');
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
    return variant?.sizes.find(s => s.size === selectedSize);
  };

  const getCurrentImages = () => {
    const variant = getCurrentVariant();
    return getImageUrls(variant?.images);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <img
                src={currentImages[selectedImageIndex] || '/placeholder-image.svg'}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            {currentImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {currentImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary-600' : 'border-gray-200'
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

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>

            {/* Price */}
            {currentSize && (
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-primary-600">
                    {formatPrice(currentSize.price)}
                  </span>
                  {currentSize.originalPrice > currentSize.price && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(currentSize.originalPrice)}
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                        {currentSize.discount}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.variants.length > 1 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Color: {currentVariant?.color}</h3>
                <div className="flex space-x-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => {
                        setSelectedVariant(variant._id || '');
                        setSelectedImageIndex(0);
                        if (variant.sizes.length > 0) {
                          setSelectedSize(variant.sizes[0].size);
                        }
                      }}
                      className={`w-10 h-10 rounded-full border-2 ${
                        selectedVariant === variant._id ? 'border-primary-600' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: variant.colorCode || variant.color }}
                      title={variant.color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {currentVariant && currentVariant.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {currentVariant.sizes.map((size) => (
                    <button
                      key={size.size}
                      onClick={() => setSelectedSize(size.size)}
                      disabled={size.stock === 0}
                      className={`px-4 py-2 border rounded-lg font-medium ${
                        selectedSize === size.size
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : size.stock === 0
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size.size}
                      {size.stock === 0 && ' (Out of Stock)'}
                    </button>
                  ))}
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

            {/* Add to Cart */}
            <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default ProductDetail;