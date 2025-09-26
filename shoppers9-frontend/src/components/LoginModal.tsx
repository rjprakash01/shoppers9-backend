import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AuthToggle from './AuthToggle';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated } = useAuth();

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, [isAuthenticated, isOpen, onClose, onLoginSuccess]);

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('login');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Modal content */}
          <div className="p-4">
            {/* Auth Toggle Component */}
            <AuthToggle mode={mode} onModeChange={setMode} />
            
            {/* Switch between login and register */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {mode === 'login' ? "Don't have an account yet? Sign Up" : 'Sign-in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;