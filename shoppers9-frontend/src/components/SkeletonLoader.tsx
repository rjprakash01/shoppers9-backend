import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  rounded = false,
  animate = true 
}) => {
  const baseClasses = 'bg-gray-200';
  const animateClasses = animate ? 'animate-pulse' : '';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`${baseClasses} ${animateClasses} ${roundedClasses} ${className}`}
      style={style}
    />
  );
};

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Image Skeleton */}
      <Skeleton height={200} className="w-full" />
      
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton height={20} width="80%" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="60%" />
        </div>
        
        {/* Price and Rating */}
        <div className="flex items-center justify-between">
          <Skeleton height={24} width={80} />
          <Skeleton height={16} width={60} />
        </div>
        
        {/* Button */}
        <Skeleton height={40} className="w-full" />
      </div>
    </div>
  );
};

// Product Grid Skeleton
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton height={20} width={index === 0 ? '60%' : '80%'} />
        </td>
      ))}
    </tr>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <Skeleton height={16} width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Profile Card Skeleton
export const ProfileCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-4">
        <Skeleton width={64} height={64} rounded className="flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="60%" />
          <Skeleton height={16} width="40%" />
          <Skeleton height={16} width="80%" />
        </div>
      </div>
    </div>
  );
};

// Order Card Skeleton
export const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton height={20} width={120} />
        <Skeleton height={24} width={80} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Skeleton width={48} height={48} />
          <div className="flex-1 space-y-1">
            <Skeleton height={16} width="70%" />
            <Skeleton height={14} width="40%" />
          </div>
          <Skeleton height={16} width={60} />
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <Skeleton height={16} width={100} />
          <Skeleton height={32} width={80} />
        </div>
      </div>
    </div>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height={16} width={100} />
          <Skeleton height={40} className="w-full" />
        </div>
      ))}
      
      <div className="flex space-x-4">
        <Skeleton height={40} width={120} />
        <Skeleton height={40} width={80} />
      </div>
    </div>
  );
};

// Text Block Skeleton
export const TextBlockSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index} 
          height={16} 
          width={index === lines - 1 ? '60%' : '100%'} 
        />
      ))}
    </div>
  );
};

export default Skeleton;