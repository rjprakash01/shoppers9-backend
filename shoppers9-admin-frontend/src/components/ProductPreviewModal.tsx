import React from 'react';
import { X, Edit, Trash2, Eye, EyeOff, Star, Tag, Calendar, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  category: {
    id: string;
    name: string;
  };
  images: string[];
  stock: number;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  brand?: string;
}

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleStatus: (productId: string, currentStatus: boolean) => void;
}

const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  if (!isOpen) return null;

  const stockStatus = {
    color: product.stock > 10 ? 'bg-green-100 text-green-700' : 
           product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 
           'bg-red-100 text-red-700',
    label: product.stock > 10 ? 'In Stock' : 
           product.stock > 0 ? 'Low Stock' : 
           'Out of Stock'
  };

  const handleEdit = () => {
    onEdit(product);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      onDelete(product.id);
      onClose();
    }
  };

  const handleToggleStatus = () => {
    onToggleStatus(product.id, product.isActive);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Product Preview</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Images */}
          {product.images && product.images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.images.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Price and Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{product.discountedPrice || product.price}
                </span>
                {product.discountedPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    ₹{product.price}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="text-lg text-gray-600 font-medium">
                  {product.rating} ({product.reviewCount})
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Category</span>
                </div>
                <span className="text-gray-900">{product.category.name}</span>
              </div>

              {/* Brand */}
              {product.brand && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Brand</span>
                  </div>
                  <span className="text-gray-900">{product.brand}</span>
                </div>
              )}

              {/* Stock Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Stock</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                  {stockStatus.label} ({product.stock})
                </span>
              </div>

              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Status</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created: {new Date(product.createdAt).toLocaleDateString()}
              </span>
              <span className="font-mono">ID: {product.id.slice(-8)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          
          <button
            onClick={handleToggleStatus}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              product.isActive 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {product.isActive ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </button>
          
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPreviewModal;