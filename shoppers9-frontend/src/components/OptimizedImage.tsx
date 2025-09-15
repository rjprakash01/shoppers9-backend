import React, { useState, useRef, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  quality?: number;
  priority?: boolean;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallback?: React.ReactNode;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  quality = 75,
  priority = false,
  sizes,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallback
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Generate optimized image URLs
  const generateImageUrl = (originalSrc: string, format?: 'webp' | 'avif') => {
    // If it's already an optimized URL or external URL, return as is
    if (originalSrc.startsWith('http') || originalSrc.includes('?')) {
      return originalSrc;
    }

    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality !== 75) params.set('q', quality.toString());
    if (format) params.set('f', format);

    const baseUrl = originalSrc.startsWith('/') ? originalSrc : `/${originalSrc}`;
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (originalSrc: string, format?: 'webp' | 'avif') => {
    if (!width) return undefined;

    const breakpoints = [0.5, 1, 1.5, 2];
    return breakpoints
      .map((multiplier) => {
        const scaledWidth = Math.round(width * multiplier);
        const url = generateImageUrl(originalSrc, format);
        const urlWithWidth = url.includes('?') 
          ? url.replace(/w=\d+/, `w=${scaledWidth}`)
          : `${url}?w=${scaledWidth}`;
        return `${urlWithWidth} ${scaledWidth}w`;
      })
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Default fallback component
  const defaultFallback = (
    <div 
      className={`flex items-center justify-center bg-gray-200 ${className}`}
      style={{ width, height }}
    >
      <ImageOff className="w-8 h-8 text-gray-400" />
      <span className="ml-2 text-sm text-gray-500">Image not available</span>
    </div>
  );

  // Show fallback if error occurred
  if (hasError) {
    return fallback || defaultFallback;
  }

  // Show placeholder while not in view or loading
  if (!isInView) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
        aria-label={`Loading ${alt}`}
      >
        {placeholder && (
          <img
            src={placeholder}
            alt=""
            className="w-full h-full object-cover opacity-50"
            style={{ objectFit }}
          />
        )}
      </div>
    );
  }

  return (
    <picture className={className}>
      {/* AVIF format for modern browsers */}
      <source
        srcSet={generateSrcSet(src, 'avif')}
        sizes={sizes}
        type="image/avif"
      />
      
      {/* WebP format for most browsers */}
      <source
        srcSet={generateSrcSet(src, 'webp')}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback to original format */}
      <img
        ref={imgRef}
        src={generateImageUrl(src)}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={{ objectFit }}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />
      
      {/* Loading placeholder overlay */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50"
              style={{ objectFit }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded" />
          )}
        </div>
      )}
    </picture>
  );
};

// Product Image Component with specific optimizations
export const ProductImage: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { width: 150, height: 150 },
    md: { width: 300, height: 300 },
    lg: { width: 500, height: 500 },
    xl: { width: 800, height: 800 }
  };

  const { width, height } = sizeMap[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-lg ${className}`}
      sizes={`(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`}
      quality={85}
    />
  );
};

// Avatar Image Component
export const AvatarImage: React.FC<{
  src: string;
  alt: string;
  size?: number;
  className?: string;
}> = ({ src, alt, size = 40, className = '' }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      quality={90}
      objectFit="cover"
    />
  );
};

// Banner Image Component
export const BannerImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}> = ({ src, alt, className = '', priority = false }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1200}
      height={400}
      className={`w-full ${className}`}
      sizes="100vw"
      quality={80}
      priority={priority}
      objectFit="cover"
    />
  );
};

// Gallery Image Component with zoom functionality
export const GalleryImage: React.FC<{
  src: string;
  alt: string;
  thumbnail?: string;
  className?: string;
  onClick?: () => void;
}> = ({ src, alt, thumbnail, className = '', onClick }) => {
  return (
    <div 
      className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={onClick}
    >
      <OptimizedImage
        src={thumbnail || src}
        alt={alt}
        width={300}
        height={300}
        className="rounded-lg"
        quality={80}
        objectFit="cover"
      />
    </div>
  );
};

export default OptimizedImage;