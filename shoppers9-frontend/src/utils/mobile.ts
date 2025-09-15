// Mobile optimization utilities and responsive design helpers

// Device detection
export const deviceDetection = {
  isMobile: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  isTablet: (): boolean => {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  },
  
  isDesktop: (): boolean => {
    return !deviceDetection.isMobile() && !deviceDetection.isTablet();
  },
  
  isIOS: (): boolean => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },
  
  isAndroid: (): boolean => {
    return /Android/i.test(navigator.userAgent);
  },
  
  isSafari: (): boolean => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },
  
  isChrome: (): boolean => {
    return /Chrome/i.test(navigator.userAgent) && /Google Inc/i.test(navigator.vendor);
  },
  
  getDeviceType: (): 'mobile' | 'tablet' | 'desktop' => {
    if (deviceDetection.isMobile()) return 'mobile';
    if (deviceDetection.isTablet()) return 'tablet';
    return 'desktop';
  }
};

// Viewport utilities
export const viewport = {
  getWidth: (): number => {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  },
  
  getHeight: (): number => {
    return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  },
  
  isPortrait: (): boolean => {
    return viewport.getHeight() > viewport.getWidth();
  },
  
  isLandscape: (): boolean => {
    return viewport.getWidth() > viewport.getHeight();
  },
  
  getBreakpoint: (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
    const width = viewport.getWidth();
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  },
  
  isMobileBreakpoint: (): boolean => {
    return ['xs', 'sm'].includes(viewport.getBreakpoint());
  },
  
  isTabletBreakpoint: (): boolean => {
    return viewport.getBreakpoint() === 'md';
  },
  
  isDesktopBreakpoint: (): boolean => {
    return ['lg', 'xl', '2xl'].includes(viewport.getBreakpoint());
  }
};

// Touch utilities
export const touch = {
  isSupported: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  addTouchListeners: (element: HTMLElement, handlers: {
    onTouchStart?: (event: TouchEvent) => void;
    onTouchMove?: (event: TouchEvent) => void;
    onTouchEnd?: (event: TouchEvent) => void;
    onTouchCancel?: (event: TouchEvent) => void;
  }) => {
    if (handlers.onTouchStart) {
      element.addEventListener('touchstart', handlers.onTouchStart, { passive: true });
    }
    if (handlers.onTouchMove) {
      element.addEventListener('touchmove', handlers.onTouchMove, { passive: true });
    }
    if (handlers.onTouchEnd) {
      element.addEventListener('touchend', handlers.onTouchEnd, { passive: true });
    }
    if (handlers.onTouchCancel) {
      element.addEventListener('touchcancel', handlers.onTouchCancel, { passive: true });
    }
  },
  
  removeTouchListeners: (element: HTMLElement, handlers: {
    onTouchStart?: (event: TouchEvent) => void;
    onTouchMove?: (event: TouchEvent) => void;
    onTouchEnd?: (event: TouchEvent) => void;
    onTouchCancel?: (event: TouchEvent) => void;
  }) => {
    if (handlers.onTouchStart) {
      element.removeEventListener('touchstart', handlers.onTouchStart);
    }
    if (handlers.onTouchMove) {
      element.removeEventListener('touchmove', handlers.onTouchMove);
    }
    if (handlers.onTouchEnd) {
      element.removeEventListener('touchend', handlers.onTouchEnd);
    }
    if (handlers.onTouchCancel) {
      element.removeEventListener('touchcancel', handlers.onTouchCancel);
    }
  },
  
  getTouchPosition: (event: TouchEvent): { x: number; y: number } => {
    const touch = event.touches[0] || event.changedTouches[0];
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  },
  
  getDistance: (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
};

// Gesture recognition
export class GestureRecognizer {
  private element: HTMLElement;
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private isTracking: boolean = false;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.setupListeners();
  }
  
  private setupListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }
  
  private handleTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.startTime = Date.now();
      this.isTracking = true;
    }
  }
  
  private handleTouchMove(event: TouchEvent) {
    if (!this.isTracking || event.touches.length !== 1) return;
    
    // Prevent default scrolling for horizontal swipes
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.startX);
    const deltaY = Math.abs(touch.clientY - this.startY);
    
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault();
    }
  }
  
  private handleTouchEnd(event: TouchEvent) {
    if (!this.isTracking) return;
    
    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();
    
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = endTime - this.startTime;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    
    // Detect gestures
    if (deltaTime < 300 && distance > 30) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.onSwipeRight(deltaX, velocity);
        } else {
          this.onSwipeLeft(Math.abs(deltaX), velocity);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.onSwipeDown(deltaY, velocity);
        } else {
          this.onSwipeUp(Math.abs(deltaY), velocity);
        }
      }
    } else if (deltaTime < 200 && distance < 10) {
      // Tap
      this.onTap(endX, endY);
    } else if (deltaTime > 500 && distance < 10) {
      // Long press
      this.onLongPress(endX, endY);
    }
    
    this.isTracking = false;
  }
  
  // Override these methods to handle gestures
  onSwipeLeft(distance: number, velocity: number) {}
  onSwipeRight(distance: number, velocity: number) {}
  onSwipeUp(distance: number, velocity: number) {}
  onSwipeDown(distance: number, velocity: number) {}
  onTap(x: number, y: number) {}
  onLongPress(x: number, y: number) {}
  
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}

// Performance optimization for mobile
export const mobilePerformance = {
  // Optimize images for mobile
  optimizeImage: (src: string, width: number, quality: number = 75): string => {
    if (deviceDetection.isMobile()) {
      // Reduce quality and size for mobile
      const mobileWidth = Math.min(width, viewport.getWidth() * 2); // 2x for retina
      const mobileQuality = Math.min(quality, 60);
      
      // Add mobile optimization parameters
      const url = new URL(src, window.location.origin);
      url.searchParams.set('w', mobileWidth.toString());
      url.searchParams.set('q', mobileQuality.toString());
      url.searchParams.set('f', 'webp');
      
      return url.toString();
    }
    return src;
  },
  
  // Lazy load with intersection observer
  setupLazyLoading: (selector: string = 'img[data-src]') => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px'
      });
      
      document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img);
      });
    }
  },
  
  // Reduce animations on mobile
  shouldReduceMotion: (): boolean => {
    return deviceDetection.isMobile() || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Optimize scroll performance
  optimizeScrolling: () => {
    // Use passive listeners for better scroll performance
    const passiveSupported = (() => {
      let passive = false;
      try {
        const options = {
          get passive() {
            passive = true;
            return false;
          }
        };
        window.addEventListener('test', () => {}, options);
        window.removeEventListener('test', () => {}, options);
      } catch (err) {
        passive = false;
      }
      return passive;
    })();
    
    if (passiveSupported) {
      // Add passive scroll listeners
      document.addEventListener('scroll', () => {}, { passive: true });
      document.addEventListener('touchstart', () => {}, { passive: true });
      document.addEventListener('touchmove', () => {}, { passive: true });
    }
  }
};

// Mobile-specific CSS utilities
export const mobileCSS = {
  // Add mobile-specific styles
  addMobileStyles: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile optimizations */
      @media (max-width: 768px) {
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        
        input, textarea, select {
          font-size: 16px; /* Prevent zoom on iOS */
        }
        
        button, a {
          min-height: 44px; /* iOS touch target size */
          min-width: 44px;
        }
        
        .scroll-smooth {
          -webkit-overflow-scrolling: touch;
        }
      }
      
      /* Reduce motion for users who prefer it */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  },
  
  // Safe area insets for notched devices
  addSafeAreaSupport: () => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }
      
      .safe-area-top {
        padding-top: var(--safe-area-inset-top);
      }
      
      .safe-area-bottom {
        padding-bottom: var(--safe-area-inset-bottom);
      }
      
      .safe-area-left {
        padding-left: var(--safe-area-inset-left);
      }
      
      .safe-area-right {
        padding-right: var(--safe-area-inset-right);
      }
    `;
    document.head.appendChild(style);
  }
};

// Haptic feedback (for supported devices)
export const haptics = {
  isSupported: (): boolean => {
    return 'vibrate' in navigator;
  },
  
  light: () => {
    if (haptics.isSupported()) {
      navigator.vibrate(10);
    }
  },
  
  medium: () => {
    if (haptics.isSupported()) {
      navigator.vibrate(20);
    }
  },
  
  heavy: () => {
    if (haptics.isSupported()) {
      navigator.vibrate(50);
    }
  },
  
  pattern: (pattern: number[]) => {
    if (haptics.isSupported()) {
      navigator.vibrate(pattern);
    }
  },
  
  success: () => {
    haptics.pattern([100, 50, 100]);
  },
  
  error: () => {
    haptics.pattern([200, 100, 200, 100, 200]);
  }
};

// Initialize mobile optimizations
export const initializeMobileOptimizations = () => {
  // Add mobile-specific styles
  mobileCSS.addMobileStyles();
  mobileCSS.addSafeAreaSupport();
  
  // Optimize scrolling
  mobilePerformance.optimizeScrolling();
  
  // Setup lazy loading
  mobilePerformance.setupLazyLoading();
  
  // Prevent zoom on double tap (iOS Safari)
  if (deviceDetection.isIOS()) {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }
  
  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    // Force a reflow to fix viewport issues
    setTimeout(() => {
      window.scrollTo(0, window.scrollY);
    }, 100);
  });
  
  console.log('Mobile optimizations initialized');
};

export default {
  deviceDetection,
  viewport,
  touch,
  GestureRecognizer,
  mobilePerformance,
  mobileCSS,
  haptics,
  initializeMobileOptimizations
};