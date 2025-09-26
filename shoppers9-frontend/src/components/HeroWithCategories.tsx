import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannerService, type Banner } from '../services/banners';
import { categoriesService, type Category } from '../services/categories';
import { getImageUrl } from '../utils/imageUtils';

interface HeroWithCategoriesProps {
  className?: string;
}

const HeroWithCategories: React.FC<HeroWithCategoriesProps> = ({ className = '' }) => {
  const [heroBanner, setHeroBanner] = useState<Banner | null>(null);
  const [gridBanners, setGridBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch banners and categories in parallel
        const [heroResponse, gridResponse, categoriesResponse] = await Promise.all([
          bannerService.getHeroBanner(),
          bannerService.getGridBanners(),
          categoriesService.getAllCategories()
        ]);
        
        setHeroBanner(heroResponse);
        setGridBanners(gridResponse);
        
        // Create a map of categories by ID for quick lookup
        const categoryMap: { [key: string]: Category } = {};
        categoriesResponse.forEach(cat => {
          categoryMap[cat._id] = cat;
        });
        setCategories(categoryMap);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load banners');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBannerImage = (banner: Banner) => {
    if (!banner.image) {
      return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    
    // If it's a data URL (base64) or external URL, use it directly
    if (banner.image.startsWith('data:') || banner.image.startsWith('http')) {
      return banner.image;
    }
    
    // For uploaded images, use the imageUtils helper to construct the proper URL
    return getImageUrl(banner.image, 'banner');
  };

  const getBannerLink = (banner: Banner) => {
    const category = categories[banner.categoryId];
    if (category) {
      return `/products?category=${encodeURIComponent(category.slug || category.name.toLowerCase())}`;
    }
    return banner.link || '/products';
  };

  const getBannerDisplayName = (banner: Banner) => {
    const category = categories[banner.categoryId];
    if (category) {
      const nameMap: { [key: string]: string } = {
        'women': "Women's fashion",
        'men': "Men's fashion",
        'electronics': 'Electronics',
        'household': 'Household',
        'gifts': 'Gifts'
      };
      return nameMap[category.name.toLowerCase()] || category.name;
    }
    return banner.title;
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="animate-pulse bg-gray-200 h-80 lg:h-[500px]"></div>
      </div>
    );
  }

  if (error || (!heroBanner && gridBanners.length === 0)) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-gray-100 h-80 lg:h-[500px] flex items-center justify-center">
          <p className="text-gray-500">{error || 'No banners available'}</p>
        </div>
      </div>
    );
  }

  // Use the hero banner and grid banners from API
  const displayGridBanners = gridBanners.slice(0, 4); // Limit to 4 grid banners

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 h-auto lg:h-[500px]">
        {/* Main Hero Banner */}
        {heroBanner && (
          <div className="lg:col-span-2 h-80 lg:h-full">
            <Link to={getBannerLink(heroBanner)} className="block h-full">
              <div 
                className="relative h-full overflow-hidden group cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  backgroundImage: `url(${getBannerImage(heroBanner)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundBlendMode: 'overlay'
                }}
              >
                {/* Subtle overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-900/20 via-transparent to-transparent group-hover:from-pink-900/30 transition-all duration-300"></div>
                
                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-start p-6 lg:p-8">
                  <div className="text-gray-800 max-w-md">
                    <h2 className="text-2xl lg:text-4xl font-bold mb-2 lg:mb-4 text-gray-900">
                      {heroBanner.title || getBannerDisplayName(heroBanner)}
                    </h2>
                    <p className="text-sm lg:text-base mb-4 lg:mb-6 text-gray-700 leading-relaxed">
                      {heroBanner.description || 'Discover the latest trends and timeless classics in our curated collection'}
                    </p>
                    <button className="bg-gray-900 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-md hover:bg-gray-800 transition-colors font-medium text-sm lg:text-base uppercase tracking-wide">
                      {heroBanner.buttonText || 'SHOP NOW'}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Grid Banners */}
        <div className="grid grid-cols-2 gap-1 h-80 lg:h-full">
          {displayGridBanners.map((banner, index) => {
            // Define background colors for each grid banner
            const getCardBackground = (banner: Banner, index: number) => {
              const category = categories[banner.categoryId];
              const categoryName = category?.name.toLowerCase() || '';
              const backgrounds = {
                'men': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                'electronics': 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
                'household': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
                'gifts': 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)'
              };
              return backgrounds[categoryName] || `linear-gradient(135deg, hsl(${index * 60}, 70%, 80%) 0%, hsl(${index * 60 + 30}, 70%, 85%) 100%)`;
            };
            
            return (
              <div key={banner._id || banner.id || index} className="h-full">
                <Link to={getBannerLink(banner)} className="block h-full">
                  <div 
                    className="relative h-full overflow-hidden group cursor-pointer"
                    style={{
                      background: getCardBackground(banner, index),
                      backgroundImage: `url(${getBannerImage(banner)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundBlendMode: 'overlay'
                    }}
                  >
                    {/* Subtle overlay */}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-300"></div>
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3 lg:p-4 text-gray-800">
                      <h3 className="text-sm lg:text-base font-bold mb-1 lg:mb-2 text-gray-900">
                        {banner.title || getBannerDisplayName(banner)}
                      </h3>
                      <button className="bg-gray-900 text-white px-2 lg:px-3 py-1 lg:py-1.5 rounded text-xs lg:text-sm hover:bg-gray-800 transition-colors font-medium self-start uppercase tracking-wide">
                        {banner.buttonText || 'SHOP NOW'}
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeroWithCategories;