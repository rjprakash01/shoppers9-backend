import React from 'react';
import { UseFormRegister, FieldError, UseFormWatch } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

// Base Input Props
interface BaseInputProps {
  label?: string;
  error?: FieldError;
  required?: boolean;
  className?: string;
  helpText?: string;
}

// Text Input Component
interface TextInputProps extends BaseInputProps {
  name: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  placeholder?: string;
  register: UseFormRegister<any>;
  disabled?: boolean;
  autoComplete?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  register,
  error,
  required,
  disabled,
  className = '',
  helpText,
  autoComplete
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        {...register(name)}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
        `}
      />
      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error.message}</span>
        </div>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Password Input Component
interface PasswordInputProps extends BaseInputProps {
  name: string;
  placeholder?: string;
  register: UseFormRegister<any>;
  disabled?: boolean;
  autoComplete?: string;
  showStrengthIndicator?: boolean;
  watch?: UseFormWatch<any>;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  name,
  label,
  placeholder,
  register,
  error,
  required,
  disabled,
  className = '',
  helpText,
  autoComplete,
  showStrengthIndicator = false,
  watch
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const password = watch ? watch(name) : '';

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Very Weak', color: 'bg-red-500' },
      { score: 2, label: 'Weak', color: 'bg-orange-500' },
      { score: 3, label: 'Fair', color: 'bg-yellow-500' },
      { score: 4, label: 'Good', color: 'bg-blue-500' },
      { score: 5, label: 'Strong', color: 'bg-green-500' }
    ];

    return levels[score];
  };

  const strength = showStrengthIndicator ? getPasswordStrength(password) : null;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          {...register(name)}
          className={`
            block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm
            placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          `}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      
      {showStrengthIndicator && password && strength && (
        <div className="space-y-1">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded ${
                  level <= strength.score ? strength.color : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          {strength.label && (
            <p className="text-xs text-gray-600">
              Password strength: <span className="font-medium">{strength.label}</span>
            </p>
          )}
        </div>
      )}
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error.message}</span>
        </div>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Textarea Component
interface TextareaProps extends BaseInputProps {
  name: string;
  placeholder?: string;
  register: UseFormRegister<any>;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  watch?: UseFormWatch<any>;
}

export const Textarea: React.FC<TextareaProps> = ({
  name,
  label,
  placeholder,
  register,
  error,
  required,
  disabled,
  className = '',
  helpText,
  rows = 4,
  maxLength,
  watch
}) => {
  const value = watch ? watch(name) : '';
  const currentLength = value ? value.length : 0;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          resize-vertical
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
        `}
      />
      
      {maxLength && (
        <div className="flex justify-end">
          <span className={`text-xs ${
            currentLength > maxLength ? 'text-red-600' : 'text-gray-500'
          }`}>
            {currentLength}/{maxLength}
          </span>
        </div>
      )}
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error.message}</span>
        </div>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Select Component
interface SelectProps extends BaseInputProps {
  name: string;
  options: { value: string; label: string }[];
  register: UseFormRegister<any>;
  disabled?: boolean;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  name,
  label,
  options,
  register,
  error,
  required,
  disabled,
  className = '',
  helpText,
  placeholder = 'Select an option'
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        {...register(name)}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error.message}</span>
        </div>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Checkbox Component
interface CheckboxProps extends BaseInputProps {
  name: string;
  register: UseFormRegister<any>;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  name,
  register,
  error,
  disabled,
  className = '',
  helpText,
  children
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-start">
        <input
          id={name}
          type="checkbox"
          disabled={disabled}
          {...register(name)}
          className={`
            mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded
            focus:ring-blue-500 focus:ring-2
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${error ? 'border-red-300' : ''}
          `}
        />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
          {children}
        </label>
      </div>
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error.message}</span>
        </div>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Radio Group Component
interface RadioGroupProps extends BaseInputProps {
  name: string;
  options: { value: string; label: string; description?: string }[];
  register: UseFormRegister<any>;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  register,
  error,
  required,
  disabled,
  className = '',
  helpText
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <input
              id={`${name}-${option.value}`}
              type="radio"
              value={option.value}
              disabled={disabled}
              {...register(name)}
              className={`
                mt-1 h-4 w-4 text-blue-600 border-gray-300
                focus:ring-blue-500 focus:ring-2
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${error ? 'border-red-300' : ''}
              `}
            />
            <div className="ml-2">
              <label htmlFor={`${name}-${option.value}`} className="block text-sm text-gray-700">
                {option.label}
              </label>
              {option.description && (
                <p className="text-xs text-gray-500">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error.message}</span>
        </div>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};