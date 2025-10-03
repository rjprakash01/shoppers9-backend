import React from 'react';
import { X, Package, Tag, Calendar, DollarSign, User, MessageSquare, Image, Palette, Ruler } from 'lucide-react';

interface ProductVariant {
  id?: string;
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  originalPrice: number;
  stock: number;
  sku: string;
  images: string[];
}

interface ProductSpecification {
  fabric?: string;
  fit?: string;
  washCare?: string;
  material?: string;
  capacity?: string;
  microwaveSafe?: boolean;
  dimensions?: string;
  weight?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: {
    id: string;
    name: string;
  };
  images: string[];
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  submittedAt: string;
  submittedBy: {
    id: string;
    name: string;
  };
  reviewComments?: string;
  rejectionReason?: string;
  brand?: string;
  variants?: ProductVariant[];
  specifications?: ProductSpecification;
  tags?: string[];
  submissionNotes?: string;
}

interface ProductReviewPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestChanges?: () => void;
}

const ProductReviewPreviewModal: React.FC<ProductReviewPreviewModalProps> = ({
  isOpen,
  onClose,
  product,
  onApprove,
  onReject,
  onRequestChanges
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'changes_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Product Preview</h2>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(product.reviewStatus)}`}>
              {(product.reviewStatus || 'pending').replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images and Basic Info */}
            <div className="space-y-6">
              {/* Product Images */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Product Images
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {product.images.map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/300/300';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product Name</label>
                    <p className="text-gray-900">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{product.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <p className="text-gray-900">{product.category.name}</p>
                    </div>
                    {product.brand && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Brand</label>
                        <p className="text-gray-900">{product.brand}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Base Price</label>
                    <p className="text-gray-900 text-lg font-semibold">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Tag className="h-5 w-5 mr-2" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Variants, Specifications, and Submission Info */}
            <div className="space-y-6">
              {/* Product Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Product Variants
                  </h3>
                  <div className="space-y-4">
                    {product.variants.map((variant, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-gray-500">Color</label>
                            <div className="flex items-center space-x-2">
                              {variant.colorCode && (
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: variant.colorCode }}
                                />
                              )}
                              <span className="text-gray-900">{variant.color}</span>
                            </div>
                          </div>
                          <div>
                            <label className="font-medium text-gray-500">Size</label>
                            <p className="text-gray-900">{variant.size}</p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-500">Price</label>
                            <p className="text-gray-900 font-semibold">${variant.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-500">Original Price</label>
                            <p className="text-gray-900">${variant.originalPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-500">Stock</label>
                            <p className="text-gray-900">{variant.stock} units</p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-500">SKU</label>
                            <p className="text-gray-900 font-mono text-xs">{variant.sku}</p>
                          </div>
                        </div>
                        {variant.images && variant.images.length > 0 && (
                          <div className="mt-3">
                            <label className="font-medium text-gray-500 text-sm">Variant Images</label>
                            <div className="flex space-x-2 mt-2">
                              {variant.images.slice(0, 3).map((image, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={image}
                                  alt={`${variant.color} ${variant.size}`}
                                  className="w-12 h-12 object-cover rounded border"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/api/placeholder/48/48';
                                  }}
                                />
                              ))}
                              {variant.images.length > 3 && (
                                <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                  +{variant.images.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Ruler className="h-5 w-5 mr-2" />
                    Specifications
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500 capitalize">
                          {(key || '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm text-gray-900">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Submission Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted By</label>
                    <p className="text-gray-900">{product.submittedBy.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted At</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(product.submittedAt)}
                    </p>
                  </div>
                  {product.submissionNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Submission Notes</label>
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-gray-900 whitespace-pre-wrap">{product.submissionNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Comments */}
              {(product.reviewComments || product.rejectionReason) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Review Comments
                  </h3>
                  <div className="space-y-3">
                    {product.reviewComments && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Comments</label>
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">{product.reviewComments}</p>
                        </div>
                      </div>
                    )}
                    {product.rejectionReason && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">{product.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          
          {/* Action Buttons - Only show if product is pending review */}
          {product.reviewStatus === 'pending' && (onApprove || onReject || onRequestChanges) && (
            <div className="flex space-x-3">
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>✓</span>
                  <span>Approve</span>
                </button>
              )}
              {onReject && (
                <button
                  onClick={onReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span>✕</span>
                  <span>Reject</span>
                </button>
              )}
              {onRequestChanges && (
                <button
                  onClick={onRequestChanges}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <span>✎</span>
                  <span>Request Changes</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewPreviewModal;