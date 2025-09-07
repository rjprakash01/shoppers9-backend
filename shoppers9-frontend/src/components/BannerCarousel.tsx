import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bannerService } from '../services/banners';
import type { Banner } from '../services/banners';

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
    loadBanners();
    
    // Set up periodic refresh to catch banner updates
    const refreshInterval = setInterval(() => {
      loadBanners(true); // Force refresh every 2 minutes
    }, 120000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Preload banner images for better performance
  useEffect(() => {
    if (banners.length > 0) {
      banners.forEach((banner) => {
        if (banner.image && !banner.image.startsWith('data:')) {
          const img = new Image();
          img.src = banner.image;
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
      const activeBanners = await bannerService.getActiveBanners(forceRefresh);
      // Filter only carousel banners
      const carouselBanners = activeBanners.filter(banner => 
        !banner.displayType || banner.displayType === 'carousel' || banner.displayType === 'both'
      );
      setBanners(carouselBanners);
    } catch (error) {
      console.error('Failed to load banners:', error);
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
    console.error('Current banner is undefined', { currentIndex, safeCurrentIndex, banners });
    return null;
  }

  return (
    <div className={`relative w-full h-64 md:h-80 lg:h-96 overflow-hidden shadow-lg ${className}`}>
      {/* Banner Image and Content */}
      <div className="relative w-full h-full">
        <img
          src={currentBanner.image}
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Fallback to a simple gradient if image fails
            target.style.display = 'none';
            target.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center text-center text-white p-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
              {currentBanner.title}
            </h2>
            
            {currentBanner.subtitle && (
              <p key={`banner-subtitle-${currentBanner._id}`} className="text-lg md:text-xl lg:text-2xl mb-2 md:mb-4 opacity-90">
                {currentBanner.subtitle}
              </p>
            )}
            
            {currentBanner.description && (
              <p key={`banner-description-${currentBanner._id}`} className="text-sm md:text-base lg:text-lg mb-4 md:mb-6 opacity-80">
                {currentBanner.description}
              </p>
            )}
            
            {currentBanner.link && currentBanner.buttonText && (
              <Link
                key={`banner-link-${currentBanner._id}`}
                to={currentBanner.link}
                className="inline-block bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105"
              >
                {currentBanner.buttonText}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <React.Fragment key="navigation-arrows">
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </React.Fragment>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((banner, index) => (
            <button
              key={banner._id || `banner-${index}`}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === safeCurrentIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
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