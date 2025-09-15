import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp, Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  brand?: string;
  averageRating?: number;
  reviewCount?: number;
  discount?: number;
  isInStock?: boolean;
  category?: { name: string; slug: string };
  subCategory?: { name: string; slug: string };
  subSubCategory?: { name: string; slug: string };
}

interface SearchMeta {
  query: string;
  resultCount: number;
  searchTime: number;
  didYouMean?: string;
  relatedSearches: string[];
}

interface SearchResultsProps {
  products: Product[];
  searchMeta: SearchMeta;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  onProductClick?: (productId: string) => void;
  onRelatedSearchClick?: (query: string) => void;
  onDidYouMeanClick?: (query: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  products,
  searchMeta,
  isLoading = false,
  viewMode = 'grid',
  onProductClick,
  onRelatedSearchClick,
  onDidYouMeanClick
}) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product._id,
      quantity: 1,
      variantId: undefined
    });
  };

  const handleWishlistToggle = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist({
        productId: product._id,
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          images: product.images,
          brand: product.brand
        }
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderProductCard = (product: Product) => {
    const isWishlisted = isInWishlist(product._id);
    
    return (
      <Link
        key={product._id}
        to={`/products/${product._id}`}
        onClick={() => onProductClick?.(product._id)}
        className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={getImageUrl(product.images?.[0] || '/placeholder-image.svg')}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.svg';
            }}
          />
          
          {/* Discount Badge */}
          {product.discount && product.discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{product.discount}%
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={(e) => handleWishlistToggle(product, e)}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          
          {/* Quick View */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
              <Eye className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              {product.brand}
            </p>
          )}
          
          {/* Name */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          
          {/* Rating */}
          {product.averageRating && product.reviewCount && (
            <div className="flex items-center space-x-2 mb-2">
              {renderStars(product.averageRating)}
              <span className="text-xs text-gray-500">({product.reviewCount})</span>
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {/* Add to Cart Button */}
          <button
            onClick={(e) => handleAddToCart(product, e)}
            disabled={!product.isInStock}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              product.isInStock
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.isInStock ? (
              <div className="flex items-center justify-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </div>
            ) : (
              'Out of Stock'
            )}
          </button>
        </div>
      </Link>
    );
  };

  const renderProductList = (product: Product) => {
    const isWishlisted = isInWishlist(product._id);
    
    return (
      <Link
        key={product._id}
        to={`/products/${product._id}`}
        onClick={() => onProductClick?.(product._id)}
        className="group flex bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 p-4"
      >
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-100 rounded-lg">
          <img
            src={getImageUrl(product.images?.[0] || '/placeholder-image.svg')}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.svg';
            }}
          />
          
          {/* Discount Badge */}
          {product.discount && product.discount > 0 && (
            <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded">
              -{product.discount}%
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 ml-4 flex flex-col justify-between">
          <div>
            {/* Brand */}
            {product.brand && (
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {product.brand}
              </p>
            )}
            
            {/* Name */}
            <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            
            {/* Category */}
            {product.subSubCategory && (
              <p className="text-xs text-gray-500 mb-2">
                {product.category?.name} › {product.subCategory?.name} › {product.subSubCategory.name}
              </p>
            )}
            
            {/* Rating */}
            {product.averageRating && product.reviewCount && (
              <div className="flex items-center space-x-2 mb-2">
                {renderStars(product.averageRating)}
                <span className="text-xs text-gray-500">({product.reviewCount})</span>
              </div>
            )}
          </div>
          
          {/* Price and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Wishlist Button */}
              <button
                onClick={(e) => handleWishlistToggle(product, e)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isWishlisted
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              
              {/* Add to Cart Button */}
              <button
                onClick={(e) => handleAddToCart(product, e)}
                disabled={!product.isInStock}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  product.isInStock
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {product.isInStock ? (
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </div>
                ) : (
                  'Out of Stock'
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Meta */}
      <div className="space-y-4">
        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {searchMeta.resultCount > 0 ? (
                <>Search results for "{searchMeta.query}"</>
              ) : (
                <>No results found for "{searchMeta.query}"</>
              )}
            </h2>
            <p className="text-sm text-gray-500">
              {searchMeta.resultCount} {searchMeta.resultCount === 1 ? 'result' : 'results'} found in {searchMeta.searchTime}ms
            </p>
          </div>
        </div>
        
        {/* Did You Mean */}
        {searchMeta.didYouMean && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Did you mean:{' '}
              <button
                onClick={() => onDidYouMeanClick?.(searchMeta.didYouMean!)}
                className="font-medium underline hover:no-underline"
              >
                {searchMeta.didYouMean}
              </button>
              ?
            </p>
          </div>
        )}
        
        {/* Related Searches */}
        {searchMeta.relatedSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Related searches:</span>
            {searchMeta.relatedSearches.map((relatedSearch, index) => (
              <button
                key={index}
                onClick={() => onRelatedSearchClick?.(relatedSearch)}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                <TrendingUp className="w-3 h-3" />
                <span>{relatedSearch}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Products */}
      {products.length > 0 ? (
        <div className={viewMode === 'grid' ? 
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 
          'space-y-4'
        }>
          {products.map(product => 
            viewMode === 'grid' ? renderProductCard(product) : renderProductList(product)
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
          
          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['T-shirts', 'Jeans', 'Sneakers', 'Dresses'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onRelatedSearchClick?.(suggestion)}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;