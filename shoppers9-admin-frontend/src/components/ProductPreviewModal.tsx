import React from 'react';
import { X, Edit, Trash2, Star, Tag, Calendar, Package, Palette, Ruler, Image, User, MessageSquare } from 'lucide-react';

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

interface ProductColor {
  name: string;
  code: string;
  images: string[];
}

interface ProductSizeOption {
  name: string;
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

interface Category {
  id: string;
  name: string;
  level?: number;
  parentCategory?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  originalPrice?: number;
  category: Category;
  subCategory?: Category;
  subSubCategory?: Category;
  images: string[];
  stock: number;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  brand?: string;
  variants?: ProductVariant[];
  availableColors?: ProductColor[];
  availableSizes?: ProductSizeOption[];
  specifications?: ProductSpecification;
  features?: string[];
  tags?: string[];
  submissionNotes?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  reviewStatus?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'needs_changes';
}

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete
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

  // Build category path
  const buildCategoryPath = () => {
    const path = [];
    if (product.category) path.push(product.category.name);
    if (product.subCategory) path.push(product.subCategory.name);
    if (product.subSubCategory) path.push(product.subSubCategory.name);
    return path;
  };

  const categoryPath = buildCategoryPath();

  // Calculate total stock from variants if available
  const totalStock = product.variants && product.variants.length > 0 
    ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
    : product.stock;

  const handleEdit = () => {
    onEdit(product);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const productId = product.id || product._id;
      if (productId) {
        onDelete(productId);
      }
      onClose();
    }
  };

  // Determine product status display
  const getProductStatus = () => {
    // If product has reviewStatus, use it to determine display
    if (product.reviewStatus) {
      switch (product.reviewStatus) {
        case 'PENDING_REVIEW':
        case 'pending_review':
          return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
        case 'REJECTED':
        case 'rejected':
          return { label: 'Rejected', color: 'bg-red-100 text-red-700' };
        case 'APPROVED':
        case 'approved':
          return { label: 'Active', color: 'bg-green-100 text-green-700' };
        case 'NEEDS_INFO':
        case 'needs_info':
          return { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700' };
        case 'DRAFT':
        case 'draft':
          return { label: 'Draft', color: 'bg-gray-100 text-gray-700' };
        default:
          return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
      }
    }
    
    // If no reviewStatus, check approvalStatus
    if (product.approvalStatus) {
      switch (product.approvalStatus) {
        case 'pending':
          return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
        case 'rejected':
          return { label: 'Rejected', color: 'bg-red-100 text-red-700' };
        case 'approved':
          return { label: 'Active', color: 'bg-green-100 text-green-700' };
        case 'needs_changes':
          return { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700' };
        default:
          return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
      }
    }
    
    // Fallback to isActive for backward compatibility
    return product.isActive 
      ? { label: 'Active', color: 'bg-green-100 text-green-700' }
      : { label: 'Inactive', color: 'bg-red-100 text-red-700' };
  };

  const productStatus = getProductStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Product Preview</h2>
            <span className={`px-2 py-1 rounded text-xs font-medium ${productStatus.color}`}>
              {productStatus.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images and Basic Info */}
            <div className="space-y-6">
              {/* Product Images */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Image className="h-5 w-5 mr-2 text-blue-600" />
                  Product Images
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {product.images.map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{product.discountedPrice || product.price}
                  </span>
                  {product.discountedPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      ₹{product.price}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice !== (product.discountedPrice || product.price) && (
                    <span className="text-sm text-gray-400">
                      (Original: ₹{product.originalPrice})
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {product.brand && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Brand</span>
                      <p className="text-gray-900">{product.brand}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Stock</span>
                    <p className={`font-medium ${
                      totalStock > 10 ? 'text-green-600' : 
                      totalStock > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {totalStock} units
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="space-y-6">
              {/* Category Path */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-blue-600" />
                  Category Path
                </h4>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-sm">
                    {categoryPath.map((category, index) => (
                      <React.Fragment key={index}>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                          {category}
                        </span>
                        {index < categoryPath.length - 1 && (
                          <span className="text-blue-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Available Colors */}
              {product.availableColors && product.availableColors.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Palette className="h-5 w-5 mr-2 text-blue-600" />
                    Available Colors ({product.availableColors.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {product.availableColors.map((color, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded p-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: color.code }}
                        ></div>
                        <span className="text-sm font-medium">{color.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Sizes */}
              {product.availableSizes && product.availableSizes.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Ruler className="h-5 w-5 mr-2 text-blue-600" />
                    Available Sizes ({product.availableSizes.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.availableSizes.map((size, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        {size.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Features</h4>
                  <ul className="space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Metadata */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-lg font-semibold text-gray-900 mb-3">Product Information</h4>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-gray-500">Product ID</span>
                     <p className="font-mono text-gray-900">{product.id}</p>
                   </div>
                   <div>
                     <span className="text-gray-500">Status</span>
                     <p className={`font-medium ${
                       product.isActive ? 'text-green-600' : 'text-red-600'
                     }`}>
                       {product.isActive ? 'Active' : 'Inactive'}
                     </p>
                   </div>
                   <div>
                     <span className="text-gray-500">Created</span>
                     <p className="text-gray-900">{new Date(product.createdAt).toLocaleDateString()}</p>
                   </div>
                   <div>
                     <span className="text-gray-500">Updated</span>
                     <p className="text-gray-900">{new Date(product.updatedAt).toLocaleDateString()}</p>
                   </div>
                   {product.isFeatured && (
                     <div>
                       <span className="text-gray-500">Featured</span>
                       <p className="text-green-600 font-medium">Yes</p>
                     </div>
                   )}
                   {product.isTrending && (
                     <div>
                       <span className="text-gray-500">Trending</span>
                       <p className="text-purple-600 font-medium">Yes</p>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           </div>

          {/* Product Variants Section */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Product Variants ({product.variants.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.variants.map((variant, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: variant.colorCode || '#ccc' }}
                        ></div>
                        <span className="font-medium text-gray-900">{variant.color}</span>
                      </div>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                        {variant.size}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-blue-600">₹{variant.price}</span>
                          {variant.originalPrice && variant.originalPrice !== variant.price && (
                            <span className="text-gray-400 line-through text-xs">₹{variant.originalPrice}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stock:</span>
                        <span className={`font-medium ${
                          variant.stock > 10 ? 'text-green-600' : 
                          variant.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {variant.stock} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">SKU:</span>
                        <span className="font-mono text-gray-700 text-xs">{variant.sku}</span>
                      </div>
                    </div>
                    
                    {variant.images && variant.images.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs text-gray-500 mb-2 block">Variant Images:</span>
                        <div className="flex space-x-2">
                          {variant.images.slice(0, 3).map((image, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={image}
                              alt={`${variant.color} ${variant.size}`}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                            />
                          ))}
                          {variant.images.length > 3 && (
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">+{variant.images.length - 3}</span>
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

          {/* Specifications Section */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Specifications</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium text-gray-900">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submission Notes Section */}
          {product.submissionNotes && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                Submission Notes
              </h4>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{product.submissionNotes}</p>
              </div>
            </div>
          )}
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