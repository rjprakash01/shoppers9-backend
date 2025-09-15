// PWA utilities for service worker registration and app installation

// Service Worker registration
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              showUpdateAvailableNotification();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('Service Worker not supported');
    return null;
  }
};

// Update service worker
export const updateServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  }
};

// Skip waiting and activate new service worker
export const skipWaitingAndActivate = (): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
};

// Check if app can be installed
export const canInstallPWA = (): boolean => {
  return 'beforeinstallprompt' in window;
};

// PWA installation prompt
let deferredPrompt: any = null;

export const setupPWAInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (event) => {
    console.log('PWA install prompt available');
    
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    
    // Save the event so it can be triggered later
    deferredPrompt = event;
    
    // Show custom install button
    showInstallButton();
  });
  
  // Handle successful installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    hideInstallButton();
    
    // Track installation
    trackPWAInstallation();
  });
};

// Trigger PWA installation
export const installPWA = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('PWA install prompt not available');
    return false;
  }
  
  try {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`PWA install prompt outcome: ${outcome}`);
    
    if (outcome === 'accepted') {
      deferredPrompt = null;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('PWA installation failed:', error);
    return false;
  }
};

// Check if PWA is installed
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         (window.navigator as any).standalone === true;
};

// Get PWA display mode
export const getPWADisplayMode = (): string => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
};

// Push notification utilities
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }
  return 'denied';
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.error('Service Worker not registered');
        return null;
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVAPIDPublicKey())
      });
      
      console.log('Push subscription successful:', subscription);
      
      // Send subscription to server
      await sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }
  return null;
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('Push unsubscription successful');
          return true;
        }
      }
    } catch (error) {
      console.error('Push unsubscription failed:', error);
    }
  }
  return false;
};

// Background sync
export const registerBackgroundSync = async (tag: string): Promise<void> => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
};

// Cache management
export const clearAppCache = async (): Promise<void> => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('App cache cleared');
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }
};

// Preload critical resources
export const preloadCriticalResources = async (urls: string[]): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'CACHE_URLS',
        payload: urls
      });
    }
  }
};

// Network status monitoring
export const setupNetworkMonitoring = (): void => {
  const updateOnlineStatus = () => {
    const event = new CustomEvent('networkstatuschange', {
      detail: { online: navigator.onLine }
    });
    window.dispatchEvent(event);
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
};

// App update detection
export const setupAppUpdateDetection = (): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('App updated, reloading...');
      window.location.reload();
    });
  }
};

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getVAPIDPublicKey(): string {
  // This should be your VAPID public key
  return process.env.VITE_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
  }
}

function showInstallButton(): void {
  const event = new CustomEvent('pwainstallprompt', {
    detail: { canInstall: true }
  });
  window.dispatchEvent(event);
}

function hideInstallButton(): void {
  const event = new CustomEvent('pwainstallprompt', {
    detail: { canInstall: false }
  });
  window.dispatchEvent(event);
}

function showUpdateAvailableNotification(): void {
  const event = new CustomEvent('pwaupdateavailable');
  window.dispatchEvent(event);
}

function trackPWAInstallation(): void {
  // Track PWA installation with analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: 'PWA Installation'
    });
  }
}

// Initialize PWA features
export const initializePWA = async (): Promise<void> => {
  console.log('Initializing PWA features...');
  
  // Register service worker
  await registerServiceWorker();
  
  // Setup PWA install prompt
  setupPWAInstallPrompt();
  
  // Setup network monitoring
  setupNetworkMonitoring();
  
  // Setup app update detection
  setupAppUpdateDetection();
  
  // Preload critical resources
  const criticalResources = [
    '/',
    '/products',
    '/cart',
    '/manifest.json'
  ];
  await preloadCriticalResources(criticalResources);
  
  console.log('PWA features initialized');
};