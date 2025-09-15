import React, { Suspense, ComponentType } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

// Higher-order component for lazy loading with error boundary and loading state
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = React.lazy(importFunc);

  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary>
      <Suspense 
        fallback={
          fallback || (
            <div className="flex items-center justify-center min-h-[200px]">
              <LoadingSpinner size="lg" text="Loading component..." />
            </div>
          )
        }
      >
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));
};

// Lazy load main pages with route-based chunking
export const LazyHome = withLazyLoading(
  () => import('../pages/Home'),
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="xl" text="Loading home page..." />
  </div>
);

export const LazyProducts = withLazyLoading(
  () => import('../pages/Products'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading products..." />
  </div>
);

export const LazyProductDetail = withLazyLoading(
  () => import('../pages/ProductDetail'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading product details..." />
  </div>
);

export const LazyCart = withLazyLoading(
  () => import('../pages/Cart'),
  <div className="flex items-center justify-center min-h-[300px]">
    <LoadingSpinner size="lg" text="Loading cart..." />
  </div>
);

export const LazyCheckout = withLazyLoading(
  () => import('../pages/Checkout'),
  <div className="flex items-center justify-center min-h-[500px]">
    <LoadingSpinner size="lg" text="Loading checkout..." />
  </div>
);

export const LazyProfile = withLazyLoading(
  () => import('../pages/Profile'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading profile..." />
  </div>
);

export const LazyOrders = withLazyLoading(
  () => import('../pages/Orders'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading orders..." />
  </div>
);

export const LazyOrderDetail = withLazyLoading(
  () => import('../pages/OrderDetail'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading order details..." />
  </div>
);

export const LazyWishlist = withLazyLoading(
  () => import('../pages/Wishlist'),
  <div className="flex items-center justify-center min-h-[300px]">
    <LoadingSpinner size="lg" text="Loading wishlist..." />
  </div>
);

export const LazySupport = withLazyLoading(
  () => import('../pages/Support'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading support..." />
  </div>
);

export const LazyLogin = withLazyLoading(
  () => import('../pages/Login'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading login..." />
  </div>
);

export const LazyRegister = withLazyLoading(
  () => import('../pages/Register'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading registration..." />
  </div>
);

export const LazyCategory = withLazyLoading(
  () => import('../pages/Category'),
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text="Loading category..." />
  </div>
);

export const LazyTrackOrder = withLazyLoading(
  () => import('../pages/TrackOrder'),
  <div className="flex items-center justify-center min-h-[300px]">
    <LoadingSpinner size="lg" text="Loading order tracking..." />
  </div>
);

// Error pages (keep these non-lazy for immediate error handling)
export const LazyNotFound = withLazyLoading(
  () => import('../pages/NotFound'),
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="xl" text="Loading..." />
  </div>
);

export const LazyServerError = withLazyLoading(
  () => import('../pages/ServerError'),
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="xl" text="Loading..." />
  </div>
);

// Utility function for preloading components
export const preloadComponent = (importFunc: () => Promise<any>) => {
  const componentImport = importFunc();
  return componentImport;
};

// Preload critical components on user interaction
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be needed soon
  const criticalComponents = [
    () => import('../pages/Products'),
    () => import('../pages/Cart'),
    () => import('../pages/Login')
  ];

  criticalComponents.forEach(importFunc => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadComponent(importFunc));
    } else {
      setTimeout(() => preloadComponent(importFunc), 100);
    }
  });
};

// Hook for component preloading on hover
export const usePreloadOnHover = (importFunc: () => Promise<any>) => {
  const preload = React.useCallback(() => {
    preloadComponent(importFunc);
  }, [importFunc]);

  return {
    onMouseEnter: preload,
    onFocus: preload
  };
};

// Component for lazy loading with intersection observer
export const LazySection: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}> = ({ 
  children, 
  fallback = <LoadingSpinner size="lg" />, 
  rootMargin = '100px',
  threshold = 0.1 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
};

// Dynamic import utility for non-component modules
export const dynamicImport = async <T,>(importFunc: () => Promise<T>): Promise<T> => {
  try {
    return await importFunc();
  } catch (error) {
    console.error('Dynamic import failed:', error);
    throw error;
  }
};

// Chunk loading error handler
export const handleChunkError = (error: Error) => {
  console.error('Chunk loading error:', error);
  
  // Reload the page if it's a chunk loading error
  if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
    window.location.reload();
  }
};

// Setup chunk error handling
export const setupChunkErrorHandling = () => {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Loading chunk')) {
      event.preventDefault();
      handleChunkError(event.reason);
    }
  });
};