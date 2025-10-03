import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, type Product } from '../services/products';
import { wishlistService } from '../services/wishlist';
import { reviewService } from '../services/reviews';
import type { Review, ReviewsResponse, CreateReviewData } from '../types/review';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import SEO from '../components/SEO';
import ReviewCard from '../components/ReviewCard';
import ReviewSummary from '../components/ReviewSummary';
import ReviewForm from '../components/ReviewForm';
import Breadcrumb, { type BreadcrumbItem } from '../components/Breadcrumb';
import { getImageUrl } from '../utils/imageUtils';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  
  // Review-related state
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Debug useEffect to monitor currentImages changes
  useEffect(() => {
    console.log('🖼️ CURRENT IMAGES CHANGED:', currentImages);
    console.log('📊 Current images length:', currentImages.length);
    console.log('🎯 Selected image index:', selectedImageIndex);
  }, [currentImages, selectedImageIndex]);

  useEffect(() => {
    if (id && isAuthenticated !== undefined) {
      checkWishlistStatus();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (id) {
      fetchReviews();
    }
  }, [id, reviewsPage]);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchUserReview();
    }
  }, [id, isAuthenticated]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProduct(id!);
      
      // COMPREHENSIVE DEBUG: Log the complete product data
      console.log('🔍 COMPLETE PRODUCT DATA DEBUG:');
      console.log('📦 Product ID:', id);
      console.log('📦 Product Name:', productData.name);
      console.log('🎨 Available Colors (Raw):', productData.availableColors);
      console.log('📏 Available Sizes (Raw):', productData.availableSizes);
      console.log('🔧 Variants (Raw):', productData.variants);
      console.log('📋 Full Product Object:', productData);
      
      // ADDITIONAL DEBUG: Check image structure
      console.log('🖼️ IMAGE STRUCTURE DEBUG:');
      console.log('📸 Product Images:', productData.images);
      if (productData.availableColors) {
        productData.availableColors.forEach((color, index) => {
          console.log(`🎨 Color ${index + 1} (${color.name}) Images:`, color.images);
        });
      }
      if (productData.variants) {
        productData.variants.forEach((variant, index) => {
          console.log(`🔧 Variant ${index + 1} (${variant.color}-${variant.size}) Images:`, variant.images);
        });
      }
      
      // Test color mapping for each available color
      if (productData.availableColors) {
        console.log('🧪 COLOR MAPPING TEST:');
        productData.availableColors.forEach((color, index) => {
          const mappedColor = getColorCode(color.name);
          console.log(`  ${index + 1}. ${color.name}:`);
          console.log(`     - API Code: ${color.code || 'NONE'}`);
          console.log(`     - Mapped Code: ${mappedColor}`);
          console.log(`     - Final Code: ${color.code || mappedColor}`);
        });
      }
      
      setProduct(productData);
      
      // Initialize images and selections based on available colors
      if (productData.availableColors && productData.availableColors.length > 0) {
        // Multiple colors: use first color's images
        const firstColor = productData.availableColors[0];
        setSelectedColor(firstColor.name);
        
        console.log('🎯 INITIALIZING with first color:', firstColor.name);
        
        // Set images from the first color using the same logic as handleColorSelection
        if (firstColor.images && firstColor.images.length > 0) {
          // Use color-specific images from availableColors
          console.log('✅ Using color-specific images from availableColors for initialization');
          setCurrentImages(firstColor.images);
        } else {
          console.log('⚠️ No images in firstColor, trying variants fallback for initialization');
          // Fallback: collect all images from variants with this color
          const colorVariants = productData.variants?.filter(v => v.color === firstColor.name) || [];
          const colorImages: string[] = [];
          
          // Collect unique images from all variants of this color
          colorVariants.forEach(variant => {
            if (variant.images && variant.images.length > 0) {
              variant.images.forEach(img => {
                if (!colorImages.includes(img)) {
                  colorImages.push(img);
                }
              });
            }
          });
          
          // If no variant images found for this color, apply the same smart distribution logic
          if (colorImages.length > 0) {
            console.log('✅ Using variant images for first color initialization');
            setCurrentImages(colorImages);
          } else {
            console.log('⚠️ No color-specific images found for initialization, using smart distribution');
            // Apply the same smart image distribution as in handleColorSelection
            const mainImages = productData.images || [];
            if (mainImages.length > 0) {
              const colorIndex = 0; // First color
              const imagesPerColor = Math.max(1, Math.floor(mainImages.length / productData.availableColors.length));
              const startIndex = colorIndex * imagesPerColor;
              const endIndex = Math.min(startIndex + imagesPerColor, mainImages.length);
              const colorSpecificImages = mainImages.slice(startIndex, endIndex);
              
              console.log(`📸 Initial images ${startIndex}-${endIndex-1} for first color ${firstColor.name}:`, colorSpecificImages);
              setCurrentImages(colorSpecificImages.length > 0 ? colorSpecificImages : [mainImages[0]]);
            } else {
              console.log('⚠️ No images available at all for initialization');
              setCurrentImages([]);
            }
          }
        }
        
        // Find and set the first variant for this color
        if (productData.variants && productData.variants.length > 0) {
          const firstVariantForColor = productData.variants.find(v => v.color === firstColor.name);
          if (firstVariantForColor) {
            setSelectedVariant(firstVariantForColor._id);
            setSelectedSize(firstVariantForColor.size);
          }
        }
      } else if (productData.variants && productData.variants.length > 0) {
        // Single color or no color info: use first variant
        const firstVariant = productData.variants[0];
        setSelectedVariant(firstVariant._id);
        setSelectedColor(firstVariant.color || '');
        setSelectedSize(firstVariant.size);
        
        // Use variant images or fallback to product images
        setCurrentImages(firstVariant.images || productData.images || []);
      } else {
        // No variants: use product images
        setCurrentImages(productData.images || []);
      }
    } catch (err) {
      setError('Failed to load product details');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (!isAuthenticated) {
      setIsInWishlist(false);
      return;
    }
    
    try {
      const inWishlist = await wishlistService.isInWishlist(id!);
      setIsInWishlist(inWishlist);
    } catch (err) {
      console.error('Error checking wishlist status:', err);
      setIsInWishlist(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    
    try {
      setLoadingReviews(true);
      const data = await reviewService.getProductReviews(id, reviewsPage, 5);
      setReviewsData(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchUserReview = async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      const review = await reviewService.getUserReviewForProduct(id);
      setUserReview(review);
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  };

  const handleSubmitReview = async (reviewData: CreateReviewData) => {
    try {
      setSubmittingReview(true);
      
      if (userReview) {
        // Update existing review
        await reviewService.updateReview(userReview._id, reviewData);
      } else {
        // Create new review
        await reviewService.createReview(reviewData);
      }
      
      // Refresh reviews and user review
      await Promise.all([fetchReviews(), fetchUserReview()]);
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    
    try {
      await reviewService.deleteReview(userReview._id);
      await Promise.all([fetchReviews(), fetchUserReview()]);
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Get the selected variant or first variant
    const variant = selectedVariant ? 
      product.variants.find(v => v._id === selectedVariant) : 
      product.variants[0];
    
    if (!variant) {
      console.error('No variant available for this product');
      alert('No variant available for this product');
      return;
    }
    
    if (!variant.size) {
      console.error('Variant does not have a size specified');
      alert('Please select a valid size for this product');
      return;
    }
    
    try {
      setAddingToCart(true);
      await addToCart(
        product,
        variant._id,
        variant.size,
        quantity
      );
      // Show success message
      alert('Product added to cart successfully!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setAddingToWishlist(true);
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(product._id);
        setIsInWishlist(false);
        alert('Product removed from wishlist!');
      } else {
        await wishlistService.addToWishlist(product._id, selectedVariant);
        setIsInWishlist(true);
        alert('Product added to wishlist!');
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const getSelectedVariantData = () => {
    if (!product || !selectedVariant) return null;
    return product.variants.find(v => v._id === selectedVariant);
  };

  const findVariantByColorAndSize = (color: string, size: string) => {
    if (!product || !product.variants) return null;
    return product.variants.find(v => v.color === color && v.size === size);
  };

  const handleColorSelection = (color: string) => {
    console.log('🎯 COLOR SELECTION DEBUG:');
    console.log('🎨 Selected Color:', color);
    console.log('📦 Product availableColors:', product?.availableColors);
    setSelectedColor(color);
    
    // Find the selected color object to get its images
    const selectedColorObj = product?.availableColors?.find(c => c.name === color);
    console.log('🔍 Found Color Object:', selectedColorObj);
    console.log('🖼️ Color Object Images:', selectedColorObj?.images);
    
    // Update images based on selected color
    if (selectedColorObj && selectedColorObj.images && selectedColorObj.images.length > 0) {
      // Use color-specific images from availableColors
      console.log('✅ Setting color-specific images from availableColors:', selectedColorObj.images);
      setCurrentImages(selectedColorObj.images);
    } else {
      console.log('⚠️ No images in selectedColorObj, trying variants fallback');
      // Fallback: collect all images from variants with this color
      const colorVariants = product?.variants?.filter(v => v.color === color) || [];
      console.log('🔧 Color variants found:', colorVariants.length);
      const colorImages: string[] = [];
      
      // Collect unique images from all variants of this color
      colorVariants.forEach(variant => {
        console.log('🔍 Checking variant:', variant.color, variant.size, 'Images:', variant.images?.length || 0);
        if (variant.images && variant.images.length > 0) {
          variant.images.forEach(img => {
            if (!colorImages.includes(img)) {
              colorImages.push(img);
            }
          });
        }
      });
      
      // If no variant images found for this color, filter main product images by color
      if (colorImages.length > 0) {
        console.log('✅ Setting color-specific images from variants:', colorImages);
        setCurrentImages(colorImages);
      } else {
        console.log('⚠️ No color-specific images found for', color);
        // For now, show a subset of main product images based on color selection
        // This is a temporary solution until proper color-specific images are added
        const mainImages = product?.images || [];
        if (mainImages.length > 0) {
          // Show different images based on color selection
          const colorIndex = product?.availableColors?.findIndex(c => c.name === color) || 0;
          const imagesPerColor = Math.max(1, Math.floor(mainImages.length / (product?.availableColors?.length || 1)));
          const startIndex = colorIndex * imagesPerColor;
          const endIndex = Math.min(startIndex + imagesPerColor, mainImages.length);
          const colorSpecificImages = mainImages.slice(startIndex, endIndex);
          
          console.log(`📸 Showing images ${startIndex}-${endIndex-1} for color ${color}:`, colorSpecificImages);
          setCurrentImages(colorSpecificImages.length > 0 ? colorSpecificImages : [mainImages[0]]);
        } else {
          console.log('⚠️ No images available at all');
          setCurrentImages([]);
        }
      }
    }
    
    console.log('🔄 Resetting selectedImageIndex to 0');
    setSelectedImageIndex(0); // Reset to first image
    
    // Find available sizes for this color
    const availableSizesForColor = getAvailableSizesForColor(color);
    // If current size is not available for this color, select the first available size
    if (!availableSizesForColor.includes(selectedSize) && availableSizesForColor.length > 0) {
      setSelectedSize(availableSizesForColor[0]);
    }
    
    // Update selected variant
    const newSize = availableSizesForColor.includes(selectedSize) ? selectedSize : availableSizesForColor[0];
    const variant = findVariantByColorAndSize(color, newSize);
    console.log('🔄 VARIANT UPDATE DEBUG:');
    console.log('🎨 Color:', color);
    console.log('📏 Size:', newSize);
    console.log('🔍 Found Variant:', variant);
    console.log('🆔 Variant ID:', variant?._id);
    console.log('💰 Variant Price:', variant?.price);
    if (variant) {
      console.log('✅ Setting selectedVariant to:', variant._id);
      setSelectedVariant(variant._id || '');
    } else {
      console.log('❌ No variant found for color/size combination');
    }
  };

  const handleSizeSelection = (size: string) => {
    console.log('📏 SIZE SELECTION DEBUG:');
    console.log('📏 Selected Size:', size);
    console.log('🎨 Current Color:', selectedColor);
    
    // Only allow selection if size is available for current color
    if (isSizeAvailableForColor(size, selectedColor)) {
      console.log('✅ Size is available for current color');
      setSelectedSize(size);
      const variant = findVariantByColorAndSize(selectedColor, size);
      console.log('🔍 Found Variant for Size Selection:', variant);
      console.log('🆔 Variant ID:', variant?._id);
      console.log('💰 Variant Price:', variant?.price);
      if (variant) {
        console.log('✅ Setting selectedVariant to:', variant._id);
        setSelectedVariant(variant._id || '');
      } else {
        console.log('❌ No variant found for color/size combination');
      }
      
      // Keep the current color-specific images, don't change them based on size
      // Images should only change when color changes, not size
    } else {
      console.log('❌ Size not available for current color');
    }
  };

  const getAvailableSizesForColor = (color: string): string[] => {
    if (!product || !product.variants) return [];
    return product.variants
      .filter(variant => variant.color === color)
      .map(variant => variant.size);
  };

  const isSizeAvailableForColor = (size: string, color: string): boolean => {
    if (!product || !product.variants) return false;
    return product.variants.some(variant => variant.color === color && variant.size === size);
  };

  const getColorCode = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Red': '#FF0000',
      'Blue': '#0000FF',
      'Green': '#00FF00',
      'Yellow': '#FFFF00',
      'Black': '#000000',
      'White': '#FFFFFF',
      'Gray': '#808080',
      'Grey': '#808080',
      'Pink': '#FFC0CB',
      'Purple': '#800080',
      'Orange': '#FFA500',
      'Brown': '#A52A2A',
      'Navy': '#000080',
      'Maroon': '#800000'
    };
    return colorMap[colorName] || '#CCCCCC'; // Default to light gray if color not found
  };

  const getCurrentPrice = () => {
    const variant = getSelectedVariantData();
    console.log('💰 PRICE CALCULATION DEBUG:');
    console.log('🔍 Selected Variant ID:', selectedVariant);
    console.log('🔍 Found Variant Data:', variant);
    console.log('🔍 Variant Price:', variant?.price);
    console.log('🔍 Product Base Price:', product?.price);
    console.log('🔍 Final Price:', variant ? variant.price : product?.price || 0);
    return variant ? variant.price : product?.price || 0;
  };

  const getCurrentOriginalPrice = () => {
    const variant = getSelectedVariantData();
    return variant ? (variant.originalPrice || 0) : product?.originalPrice || 0;
  };

  const getDiscountPercentage = () => {
    const price = getCurrentPrice();
    const originalPrice = getCurrentOriginalPrice();
    if (originalPrice > price) {
      return Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    return 0;
  };

  const buildBreadcrumbItems = (): BreadcrumbItem[] => {
    if (!product) return [];
    
    const items: BreadcrumbItem[] = [
      { name: 'Home', url: '/' }
    ];
    
    // Add main category if available
    if (product.category) {
      const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
      const categorySlug = typeof product.category === 'object' && product.category.slug 
        ? product.category.slug 
        : categoryName.toLowerCase().replace(/\s+/g, '-');
      
      items.push({
        name: categoryName,
        url: `/products?category=${encodeURIComponent(categorySlug)}`
      });
      
      // Add subcategory if available
      if (product.subCategory) {
        const subCategoryName = typeof product.subCategory === 'object' ? product.subCategory.name : product.subCategory;
        const subCategorySlug = typeof product.subCategory === 'object' && product.subCategory.slug 
          ? product.subCategory.slug 
          : subCategoryName.toLowerCase().replace(/\s+/g, '-');
        
        items.push({
          name: subCategoryName,
          url: `/products?category=${encodeURIComponent(categorySlug)}&subcategory=${encodeURIComponent(subCategorySlug)}`
        });
        
        // Add subsubcategory if available (check both subsubcategory and subcategory fields)
        const subSubCategory = product.subsubcategory || (product as any).subcategory;
        if (subSubCategory) {
          const subSubCategoryName = typeof subSubCategory === 'object' ? subSubCategory.name : subSubCategory;
          const subSubCategorySlug = typeof subSubCategory === 'object' && subSubCategory.slug 
            ? subSubCategory.slug 
            : subSubCategoryName.toLowerCase().replace(/\s+/g, '-');
          
          items.push({
            name: subSubCategoryName,
            url: `/products?category=${encodeURIComponent(categorySlug)}&subcategory=${encodeURIComponent(subCategorySlug)}&subsubcategory=${encodeURIComponent(subSubCategorySlug)}`
          });
        }
      }
    }
    
    // Add product name (no URL for current page)
    items.push({
      name: product.name
    });
    
    return items;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${product.name} - Shoppers9`}
        description={product.description}
        keywords={[product.name, product.brand, typeof product.category === 'object' ? product.category.name : product.category, ...product.tags]}
        image={product.images[0]}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={buildBreadcrumbItems()} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={getImageUrl(currentImages[selectedImageIndex] || product.images[0])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {currentImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {currentImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600 mt-2">{product.brand}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-gray-900">₹{getCurrentPrice()}</span>
                {getDiscountPercentage() > 0 && (
                  <>
                    <span className="text-xl text-gray-500 line-through">₹{getCurrentOriginalPrice()}</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      {getDiscountPercentage()}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>



            {/* Color Options */}
            {product.availableColors && product.availableColors.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {product.availableColors.map((color, index) => {
                    // Get the mapped color from our color mapping function
                    const mappedColor = getColorCode(color.name);
                    
                    // Check if API color code is valid and different from black (which might be incorrect)
                    const apiColorValid = color.code && color.code !== '#000000' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color.code);
                    
                    // Use API color only if it's valid and not black, otherwise use mapped color
                    const finalColor = apiColorValid ? color.code : mappedColor;
                    
                    // Validate the final color and use fallback if needed
                    const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(finalColor);
                    const safeColor = isValidHex ? finalColor : '#CCCCCC';
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleColorSelection(color.name)}
                        className={`flex items-center space-x-2 cursor-pointer group p-2 rounded-lg border-2 transition-colors ${
                          selectedColor === color.name 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div
                          style={{ 
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '2px solid #d1d5db',
                            backgroundColor: safeColor,
                            background: safeColor,
                            backgroundImage: 'none',
                            display: 'inline-block',
                            minWidth: '32px',
                            minHeight: '32px',
                            boxSizing: 'border-box'
                          }}
                          title={`${color.name} - ${safeColor} (Original: ${finalColor})`}
                          data-color-name={color.name}
                          data-color-code={safeColor}
                          data-original-color={finalColor}
                          data-api-color={color.code || 'none'}
                          data-mapped-color={getColorCode(color.name)}
                          data-debug-index={index}
                          className="debug-color-swatch"
                        ></div>
                        <span className="text-sm text-gray-700">{color.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Options */}
            {product.availableSizes && product.availableSizes.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map((size, index) => {
                    const isAvailable = isSizeAvailableForColor(typeof size === 'string' ? size : size.name || size, selectedColor);
                    const sizeName = typeof size === 'string' ? size : size.name || size;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSizeSelection(sizeName)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          !isAvailable
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedSize === sizeName
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {sizeName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variants (fallback for legacy products) */}
            {product.variants && product.variants.length > 0 && !product.availableSizes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isAvailable = isSizeAvailableForColor(variant.size, selectedColor);
                    return (
                      <button
                        key={variant._id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedVariant(variant._id);
                            setSelectedColor(variant.color);
                            setSelectedSize(variant.size);
                            setCurrentImages(variant.images || product.images || []);
                            setSelectedImageIndex(0);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          !isAvailable
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedVariant === variant._id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {variant.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
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

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{addingToCart ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
              
              <button
                onClick={handleWishlistToggle}
                disabled={addingToWishlist}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center space-x-2"
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
                <span>{addingToWishlist ? 'Updating...' : isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Free Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-gray-600">Easy Returns</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Product Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <span className="font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span className="text-gray-600">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Brand Information */}
            {product.brand && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Brand</h3>
                <p className="text-gray-600 font-medium">{product.brand}</p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          {/* Review Summary */}
          {reviewsData?.summary && (
            <ReviewSummary summary={reviewsData.summary} />
          )}

          {/* Write Review Button/Form */}
          <div className="mb-8">
            {isAuthenticated ? (
              !showReviewForm ? (
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Reviews</h3>
                  <div className="flex items-center space-x-3">
                    {userReview && (
                      <button
                        onClick={handleDeleteReview}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete My Review
                      </button>
                    )}
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{userReview ? 'Edit Review' : 'Write Review'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <ReviewForm
                  productId={id!}
                  onSubmit={handleSubmitReview}
                  onCancel={() => setShowReviewForm(false)}
                  isSubmitting={submittingReview}
                  existingReview={userReview ? {
                    rating: userReview.rating,
                    comment: userReview.comment
                  } : undefined}
                />
              )
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews</h3>
                <p className="text-gray-600 mb-4">Please log in to write a review</p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Log In
                </button>
              </div>
            )}
          </div>

          {/* Reviews List */}
          {loadingReviews ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
            <div>
              <div className="space-y-6">
                {reviewsData.reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>

              {/* Pagination */}
              {reviewsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 mt-8">
                  <button
                    onClick={() => setReviewsPage(prev => Math.max(1, prev - 1))}
                    disabled={!reviewsData.pagination.hasPrevPage}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    Page {reviewsData.pagination.currentPage} of {reviewsData.pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setReviewsPage(prev => prev + 1)}
                    disabled={!reviewsData.pagination.hasNextPage}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600">Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetail;