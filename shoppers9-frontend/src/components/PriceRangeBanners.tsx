import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannerService } from '../services/banners';
import type { Banner } from '../services/banners';
import { getImageUrl } from '../utils/imageUtils';

interface PriceRangeBannersProps {
  className?: string;
}

const PriceRangeBanners: React.FC<PriceRangeBannersProps> = ({ className = '' }) => {
  const [priceRangeBanners, setPriceRangeBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPriceRangeBanners();
  }, []);

  const loadPriceRangeBanners = async () => {
    try {
      const activeBanners = await bannerService.getActiveBanners();
      
      // Filter only price-range banners
      const priceRangeBanners = activeBanners.filter(banner => 
        banner.displayType === 'price-range'
      );
      
      // Sort banners by order field
      const sortedPriceRangeBanners = priceRangeBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPriceRangeBanners(sortedPriceRangeBanners);
    } catch (error) {
      console.error('Error loading price range banners:', error);
      setPriceRangeBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePriceRangeLink = (banner: Banner) => {
    if (banner.link) {
      // Fix category links to use proper product filtering
      if (banner.link.startsWith('/categories/')) {
        return `/products?category=${banner.link.replace('/categories/', '')}`;
      }
      return banner.link;
    }
    
    // Generate link based on price range
    const { priceRange } = banner;
    if (!priceRange) return '/products';
    
    const params = new URLSearchParams();
    if (priceRange.minPrice !== undefined) {
      params.append('minPrice', priceRange.minPrice.toString());
    }
    if (priceRange.maxPrice !== undefined) {
      params.append('maxPrice', priceRange.maxPrice.toString());
    }
    
    return `/products?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <section className={`py-8 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="h-6 bg-gray-300 rounded w-48 mx-auto mb-3 animate-pulse"></div>
          <div className="h-3 bg-gray-300 rounded w-72 mx-auto animate-pulse"></div>
        </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, index) => (
              <div key={`price-range-skeleton-${index}`} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="bg-gray-300 h-20"></div>
                <div className="p-4">
                  <div className="h-16 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (priceRangeBanners.length === 0) {
    return null; // Don't show section if no price range banners
  }

  return (
    <section className={`py-8 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Shop by Price Range
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Great deals at every budget
          </p>
        </div>
        
        <div className={`grid gap-3 sm:gap-4 ${
          priceRangeBanners.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
          priceRangeBanners.length === 2 ? 'grid-cols-2 max-w-lg mx-auto' :
          priceRangeBanners.length === 3 ? 'grid-cols-2 sm:grid-cols-3 max-w-3xl mx-auto' :
          priceRangeBanners.length === 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' :
          'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        }`}>
          {priceRangeBanners.map((banner) => (
            <Link 
              key={banner._id} 
              to={generatePriceRangeLink(banner)} 
              className="group"
            >
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                {/* Header with gradient/color */}
                <div 
                  className="text-white p-3 sm:p-4 text-center relative overflow-hidden"
                  style={{ 
                    background: banner.priceRange?.color || '#3B82F6',
                    minHeight: '70px'
                  }}
                >
                  <h3 className="text-sm sm:text-base md:text-lg font-bold mb-1 leading-tight">
                    {banner.priceRange?.label || banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs sm:text-sm opacity-90 leading-tight">{banner.subtitle}</p>
                  )}
                  {banner.priceRange && (
                    <p className="text-xs opacity-75 mt-1 leading-tight">
                      {banner.priceRange.minPrice !== undefined && banner.priceRange.maxPrice !== undefined
                        ? `₹${banner.priceRange.minPrice} - ₹${banner.priceRange.maxPrice}`
                        : banner.priceRange.minPrice !== undefined
                        ? `From ₹${banner.priceRange.minPrice}`
                        : banner.priceRange.maxPrice !== undefined
                        ? `Up to ₹${banner.priceRange.maxPrice}`
                        : ''
                      }
                    </p>
                  )}
                </div>
                
                {/* Image section */}
                <div className="p-2 sm:p-3">
                  <img
                    src={getImageUrl(banner.image)}
                    alt={banner.title}
                    className="w-full h-10 sm:h-12 md:h-14 object-cover rounded group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  {banner.description && (
                    <p className="text-xs text-gray-600 mt-2 text-center leading-tight">
                      {banner.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PriceRangeBanners;