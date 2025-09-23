import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Edit, Trash2, Eye, Download, Upload, Check, X } from 'lucide-react';

interface PermissionButtonProps {
  action: 'create' | 'edit' | 'delete' | 'read' | 'export' | 'import' | 'approve' | 'reject';
  module: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  tooltip?: string;
}

const PermissionButton: React.FC<PermissionButtonProps> = ({
  action,
  module,
  onClick,
  disabled = false,
  className = '',
  children,
  variant = 'primary',
  size = 'md',
  showIcon = true,
  tooltip
}) => {
  const { user } = useAuth();
  const { hasModuleAccess } = usePermissions();

  // Check if user has module access (binary model)
  const hasAccess = user?.role === 'super_admin' || hasModuleAccess(module);

  // If no access, don't render the button
  if (!hasAccess) {
    return null;
  }

  // Get appropriate icon for the action
  const getActionIcon = () => {
    switch (action) {
      case 'create':
        return <Plus className={getIconSize()} />;
      case 'edit':
        return <Edit className={getIconSize()} />;
      case 'delete':
        return <Trash2 className={getIconSize()} />;
      case 'read':
        return <Eye className={getIconSize()} />;
      case 'export':
        return <Download className={getIconSize()} />;
      case 'import':
        return <Upload className={getIconSize()} />;
      case 'approve':
        return <Check className={getIconSize()} />;
      case 'reject':
        return <X className={getIconSize()} />;
      default:
        return null;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'md':
        return 'h-4 w-4';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'inline-flex items-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300`;
      case 'secondary':
        return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 disabled:bg-yellow-300`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300`;
    }
  };

  const getDefaultLabel = () => {
    switch (action) {
      case 'create':
        return 'Create';
      case 'edit':
        return 'Edit';
      case 'delete':
        return 'Delete';
      case 'read':
        return 'View';
      case 'export':
        return 'Export';
      case 'import':
        return 'Import';
      case 'approve':
        return 'Approve';
      case 'reject':
        return 'Reject';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };

  const getScopeIndicator = () => {
    // Scope functionality removed as it's not implemented in the current permission system
    return null;
  };

  const buttonClasses = `${getVariantClasses()} ${getButtonSize()} ${className}`;

  const buttonContent = (
    <>
      {showIcon && getActionIcon()}
      {children ? (
        <span className={showIcon ? 'ml-2' : ''}>
          {children}
          {getScopeIndicator()}
        </span>
      ) : (
        <span className={showIcon ? 'ml-2' : ''}>
          {getDefaultLabel()}
          {getScopeIndicator()}
        </span>
      )}
    </>
  );

  if (tooltip) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={buttonClasses}
        title={tooltip}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {buttonContent}
    </button>
  );
};

// Convenience components for common actions
export const CreateButton: React.FC<Omit<PermissionButtonProps, 'action'>> = (props) => (
  <PermissionButton {...props} action="create" variant="primary" />
);

export const EditButton: React.FC<Omit<PermissionButtonProps, 'action'>> = (props) => (
  <PermissionButton {...props} action="edit" variant="secondary" />
);

export const DeleteButton: React.FC<Omit<PermissionButtonProps, 'action'>> = (props) => (
  <PermissionButton {...props} action="delete" variant="danger" />
);

export const ViewButton: React.FC<Omit<PermissionButtonProps, 'action'>> = (props) => (
  <PermissionButton {...props} action="read" variant="secondary" />
);

export const ExportButton: React.FC<Omit<PermissionButtonProps, 'action'>> = (props) => (
  <PermissionButton {...props} action="export" variant="secondary" />
);

export const ImportButton: React.FC<Omit<PermissionButtonProps, 'action'>> = (props) => (
  <PermissionButton {...props} action="import" variant="primary" />
);

export const ApproveButton: React.FC<Omit<PermissionButtonProps, 'action'>> = (props) => (
  <PermissionButton {...props} action="approve" variant="success" />
);

export const RejectButton: React.FC<Omit<PermissionButtonProps, 'action'>> = (props) => (
  <PermissionButton {...props} action="reject" variant="danger" />
);

export default PermissionButton;