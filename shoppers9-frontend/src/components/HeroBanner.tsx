import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannerService, type Banner } from '../services/banners';

interface HeroBannerProps {
  className?: string;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ className = '' }) => {
  const [heroBanners, setHeroBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroBanners = async () => {
      try {
        setLoading(true);
        const response = await bannerService.getActiveBanners();
        // Use all active banners for hero display
        setHeroBanners(response);
      } catch (err) {
        console.error('Error fetching hero banners:', err);
        setError('Failed to load hero banners');
      } finally {
        setLoading(false);
      }
    };

    fetchHeroBanners();
  }, []);

  const getCategoryDisplayName = (categoryType: string) => {
    const categoryMap: { [key: string]: string } = {
      'men': "Men's fashion",
      'women': "Women's fashion",
      'electronics': 'Electronics',
      'household': 'Household',
      'gifts': 'Gifts'
    };
    return categoryMap[categoryType] || categoryType;
  };

  const getCategoryColor = (categoryType: string) => {
    const colorMap: { [key: string]: string } = {
      'men': 'from-blue-400 to-blue-600',
      'women': 'from-pink-400 to-pink-600',
      'electronics': 'from-green-400 to-green-600',
      'household': 'from-purple-400 to-purple-600',
      'gifts': 'from-yellow-400 to-yellow-600'
    };
    return colorMap[categoryType] || 'from-gray-400 to-gray-600';
  };

  const getCategoryLink = (categoryType: string) => {
    const linkMap: { [key: string]: string } = {
      'men': '/categories/men',
      'women': '/categories/women',
      'electronics': '/categories/electronics',
      'household': '/categories/household',
      'gifts': '/categories/gifts'
    };
    return linkMap[categoryType] || '/products';
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="animate-pulse bg-gray-200 h-64 md:h-80 lg:h-96 rounded-lg"></div>
      </div>
    );
  }

  if (error || heroBanners.length === 0) {
    return null; // Don't show anything if there are no hero banners
  }

  // Display exactly 5 hero banners in a grid layout
  const displayBanners = heroBanners.slice(0, 5);

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {displayBanners.map((banner, index) => (
          <div key={banner._id} className="relative">
            <Link to={banner.link || getCategoryLink(banner.categoryType || 'products')} className="block">
              <div 
                className="relative h-64 md:h-72 lg:h-80 rounded-lg overflow-hidden group cursor-pointer"
                style={{
                  backgroundImage: `url(${banner.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-lg font-bold mb-2">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-sm opacity-90 mb-3">{banner.subtitle}</p>
                  )}
                  <button className="bg-white text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors font-medium text-sm">
                    {banner.buttonText || 'SHOP NOW'}
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;