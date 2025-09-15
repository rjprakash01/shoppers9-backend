import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Wifi, Bell } from 'lucide-react';
import { installPWA, isPWAInstalled, requestNotificationPermission, subscribeToPushNotifications } from '../utils/pwa';

interface PWAInstallPromptProps {
  onClose?: () => void;
  showNotificationPrompt?: boolean;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  onClose, 
  showNotificationPrompt = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [currentStep, setCurrentStep] = useState<'install' | 'notifications' | 'complete'>('install');

  useEffect(() => {
    // Check if PWA is already installed
    if (isPWAInstalled()) {
      return;
    }

    // Listen for PWA install prompt availability
    const handleInstallPrompt = (event: CustomEvent) => {
      setIsVisible(event.detail.canInstall);
    };

    window.addEventListener('pwainstallprompt', handleInstallPrompt as EventListener);

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    return () => {
      window.removeEventListener('pwainstallprompt', handleInstallPrompt as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const installed = await installPWA();
      
      if (installed) {
        if (showNotificationPrompt && notificationPermission === 'default') {
          setCurrentStep('notifications');
        } else {
          setCurrentStep('complete');
          setTimeout(() => {
            handleClose();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleNotificationPermission = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPushNotifications();
      }
      
      setCurrentStep('complete');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Notification permission failed:', error);
      setCurrentStep('complete');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleSkipNotifications = () => {
    setCurrentStep('complete');
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentStep === 'install' && 'Install Shoppers9'}
                {currentStep === 'notifications' && 'Enable Notifications'}
                {currentStep === 'complete' && 'All Set!'}
              </h3>
              <p className="text-sm text-gray-500">
                {currentStep === 'install' && 'Get the app experience'}
                {currentStep === 'notifications' && 'Stay updated with deals'}
                {currentStep === 'complete' && 'Welcome to Shoppers9'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'install' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Monitor className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Install Shoppers9 App
                </h4>
                <p className="text-gray-600 mb-6">
                  Get faster access, offline browsing, and a native app experience right on your device.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>Works offline - browse products without internet</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>Faster loading - instant access to your favorites</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>Push notifications - never miss a deal</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>Home screen access - one tap to shop</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Installing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Install App</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'notifications' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Bell className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Stay in the Loop
                </h4>
                <p className="text-gray-600 mb-6">
                  Get notified about exclusive deals, order updates, and new arrivals.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Exclusive flash sale alerts</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Order status and delivery updates</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Personalized product recommendations</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSkipNotifications}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleNotificationPermission}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>Enable Notifications</span>
                </button>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                <span className="text-3xl text-white">🎉</span>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to Shoppers9!
                </h4>
                <p className="text-gray-600">
                  You're all set! Enjoy the enhanced shopping experience.
                </p>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-full transition-all duration-1000" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for managing PWA install prompt
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isPWAInstalled());

    const handleInstallPrompt = (event: CustomEvent) => {
      setCanInstall(event.detail.canInstall);
    };

    window.addEventListener('pwainstallprompt', handleInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('pwainstallprompt', handleInstallPrompt as EventListener);
    };
  }, []);

  return {
    canInstall,
    isInstalled,
    install: installPWA
  };
};

// Mini install button component
export const PWAInstallButton: React.FC<{
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}> = ({ className = '', variant = 'primary', size = 'md' }) => {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled || !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
  };

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className={`
        inline-flex items-center space-x-2 rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Installing...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Install App</span>
        </>
      )}
    </button>
  );
};

export default PWAInstallPrompt;