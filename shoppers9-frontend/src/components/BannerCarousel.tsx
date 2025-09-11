import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bannerService } from '../services/banners';
import type { Banner } from '../services/banners';
import { getImageUrl } from '../utils/imageUtils';

interface BannerCarouselProps {
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ 
  className = '',
  autoPlay = true,
  autoPlayInterval = 5000
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Load banners (use cache if available)
    loadBanners(false);
    
    // Set up periodic refresh to catch banner updates (reduced frequency)
    const refreshInterval = setInterval(() => {
      loadBanners(true); // Force refresh every 5 minutes to reduce server load
    }, 300000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Preload banner images for better performance (with error handling)
  useEffect(() => {
    if (banners.length > 0) {
      banners.forEach((banner) => {
        if (banner.image && !banner.image.startsWith('data:')) {
          const img = new Image();
          img.onload = () => {
            // Image loaded successfully
          };
          img.onerror = () => {
            
          };
          img.src = getImageUrl(banner.image);
        }
      });
    }
  }, [banners]);

  // Reset currentIndex when banners change
  useEffect(() => {
    if (banners.length > 0 && currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, banners.length, currentIndex]);

  const loadBanners = async (forceRefresh = false) => {
    try {
      // Clear cache on force refresh
      if (forceRefresh) {
        bannerService.clearCache();
      }
      
      const activeBanners = await bannerService.getActiveBanners(forceRefresh);

      // Filter only carousel banners
      const carouselBanners = activeBanners.filter(banner => 
        !banner.displayType || banner.displayType === 'carousel' || banner.displayType === 'both'
      );
      
      // Sort banners by order field
      const sortedCarouselBanners = carouselBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(sortedCarouselBanners);
    } catch (error) {
      
      // Service handles fallback, so this should rarely happen
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (isTransitioning || banners.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevSlide = () => {
    if (isTransitioning || banners.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex || banners.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(Math.max(0, Math.min(index, banners.length - 1)));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (isLoading) {
    return (
      <div className={`relative w-full h-64 md:h-80 lg:h-96 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.max(0, Math.min(currentIndex, banners.length - 1));
  const currentBanner = banners[safeCurrentIndex];
  
  // Safety check for currentBanner
  if (!currentBanner) {
    
    return null;
  }

  return (
    <div className={`relative w-full h-full overflow-hidden shadow-2xl ${className}`}>
      {/* Banner Image and Content */}
      <div className="relative w-full h-full">
        <img
          src={getImageUrl(currentBanner.image)}
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-all duration-500"
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Fallback to a modern gradient if image fails
            target.style.display = 'none';
            target.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          }}
        />
        
        {/* Enhanced Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content - Mobile Optimized */}
        <div className="absolute inset-0 flex items-center justify-center text-center text-white p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl w-full">
            {/* Enhanced Title */}
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-6xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight drop-shadow-lg">
              {currentBanner.title}
            </h2>
            
            {currentBanner.subtitle && (
              <p key={`banner-subtitle-${currentBanner._id}`} className="text-base sm:text-lg md:text-xl lg:text-3xl mb-2 sm:mb-3 md:mb-4 opacity-95 drop-shadow-md font-medium">
                {currentBanner.subtitle}
              </p>
            )}
            
            {currentBanner.description && (
              <p key={`banner-description-${currentBanner._id}`} className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 opacity-90 drop-shadow-md max-w-2xl mx-auto leading-relaxed">
                {currentBanner.description}
              </p>
            )}
            
            {currentBanner.link && currentBanner.buttonText && (
              <Link
                key={`banner-link-${currentBanner._id}`}
                to={currentBanner.link}
                className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-sm sm:text-base md:text-lg"
              >
                {currentBanner.buttonText}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Arrows */}
      {banners.length > 1 && (
        <React.Fragment key="navigation-arrows">
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 sm:p-3 rounded-full transition-all duration-300 disabled:opacity-50 hover:scale-110 shadow-lg"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 sm:p-3 rounded-full transition-all duration-300 disabled:opacity-50 hover:scale-110 shadow-lg"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </React.Fragment>
      )}

      {/* Enhanced Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3">
          {banners.map((banner, index) => (
            <button
              key={banner._id || `banner-${index}`}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`transition-all duration-300 rounded-full ${
                index === safeCurrentIndex
                  ? 'w-8 h-3 bg-white shadow-lg'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/75 hover:scale-110'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;