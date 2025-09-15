import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react';

// Skip to main content link
export const SkipToMain: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
};

// Screen reader only text
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="sr-only">{children}</span>;
};

// Accessible button with proper ARIA attributes
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaPressed,
  className = '',
  type = 'button',
  variant = 'primary',
  size = 'md'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Accessible dropdown/collapsible content
interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultOpen = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useRef(`collapsible-${Math.random().toString(36).substr(2, 9)}`);
  const buttonId = useRef(`button-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <button
        id={buttonId.current}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId.current}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-lg"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" aria-hidden="true" />
        )}
      </button>
      
      <div
        id={contentId.current}
        role="region"
        aria-labelledby={buttonId.current}
        className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
      >
        <div className="px-4 py-3 border-t border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};

// Accessible modal with focus management
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
      
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus within modal
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto focus:outline-none ${className}`}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>
        
        <div className="px-6 py-4">
          {children}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <AccessibleButton
            onClick={onClose}
            variant="secondary"
            ariaLabel="Close modal"
          >
            Close
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};

// Accessible form field with proper labeling
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
}

export const AccessibleFormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  helpText,
  required = false,
  className = ''
}) => {
  const fieldId = useRef(`field-${Math.random().toString(36).substr(2, 9)}`);
  const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`);
  const helpId = useRef(`help-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={fieldId.current}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId.current,
          'aria-describedby': `${error ? errorId.current : ''} ${helpText ? helpId.current : ''}`.trim() || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required
        })}
      </div>
      
      {error && (
        <div
          id={errorId.current}
          role="alert"
          className="text-sm text-red-600 flex items-center space-x-1"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      {helpText && !error && (
        <div
          id={helpId.current}
          className="text-sm text-gray-500"
        >
          {helpText}
        </div>
      )}
    </div>
  );
};

// Accessible progress indicator
interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const AccessibleProgress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  className = ''
}) => {
  const percentage = Math.round((value / max) * 100);
  const progressId = useRef(`progress-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={progressId.current} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {showPercentage && (
            <span className="text-sm text-gray-500" aria-live="polite">
              {percentage}%
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          id={progressId.current}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${percentage}%`}
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <ScreenReaderOnly>
        Progress: {percentage}% complete
      </ScreenReaderOnly>
    </div>
  );
};

// Accessible notification/alert
interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const AccessibleAlert: React.FC<AlertProps> = ({
  type,
  title,
  children,
  onClose,
  className = ''
}) => {
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Announce to screen readers
    if (alertRef.current) {
      alertRef.current.focus();
    }
  }, []);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };

  return (
    <div
      ref={alertRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className={`border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${typeStyles[type]} ${className}`}
    >
      <div className="flex items-start space-x-3">
        <span aria-hidden="true" className="text-lg">
          {icons[type]}
        </span>
        
        <div className="flex-1">
          {title && (
            <h3 className="font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        
        {onClose && (
          <AccessibleButton
            onClick={onClose}
            variant="secondary"
            size="sm"
            ariaLabel="Close alert"
            className="!p-1 !bg-transparent hover:!bg-black hover:!bg-opacity-10"
          >
            <span aria-hidden="true">×</span>
          </AccessibleButton>
        )}
      </div>
    </div>
  );
};

// Accessibility preferences hook
export const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false
  });

  useEffect(() => {
    // Check for user preferences
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const largeText = window.matchMedia('(prefers-font-size: large)').matches;
    
    setPreferences(prev => ({
      ...prev,
      reducedMotion,
      highContrast,
      largeText,
      screenReader: 'speechSynthesis' in window
    }));
  }, []);

  return preferences;
};

// Focus management hook
export const useFocusManagement = () => {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  const focusFirstError = () => {
    const firstError = document.querySelector('[aria-invalid="true"]') as HTMLElement;
    if (firstError) {
      firstError.focus();
    }
  };

  const announceLiveRegion = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  };

  return {
    focusElement,
    focusFirstError,
    announceLiveRegion
  };
};

export default {
  SkipToMain,
  ScreenReaderOnly,
  AccessibleButton,
  Collapsible,
  AccessibleModal,
  AccessibleFormField,
  AccessibleProgress,
  AccessibleAlert,
  useAccessibilityPreferences,
  useFocusManagement
};