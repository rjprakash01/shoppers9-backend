import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import ProductForm from './ProductForm';
import {
  X,
  Edit,
  Package,
  Tag,
  Star,
  Calendar,
  DollarSign,
  Trash2
} from 'lucide-react';

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
  specifications?: any;
  features?: string;
  tags?: string;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onProductUpdate: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  productId,
  onProductUpdate
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct();
    }
  }, [isOpen, productId]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError('');
      const productData = await authService.getProductById(productId);
      setProduct(productData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!product) return;
    
    try {
      setUpdatingStatus(true);
      await authService.updateProductStatus(product.id, !product.isActive);
      setProduct({ ...product, isActive: !product.isActive });
      onProductUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update product status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProductUpdate = async (productData: any) => {
    try {
      await authService.updateProduct(productId, productData);
      await fetchProduct(); // Refresh product data
      setIsEditing(false);
      onProductUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      await authService.deleteProduct(product.id);
      onProductUpdate();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Product' : 'Product Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          ) : product ? (
            isEditing ? (
              <ProductForm
                isOpen={true}
                onClose={() => setIsEditing(false)}
                onSubmit={handleProductUpdate}
                initialData={{
                  name: product.name,
                  description: product.description,
                  price: product.discountedPrice || product.price,
                  originalPrice: product.price,
                  category: typeof product.category === 'object' ? product.category.id : product.category,
                  subCategory: '',
                  brand: product.brand || '',
                  stock: product.stock,
                  images: product.images || [],
                  features: product.features && typeof product.features === 'string' ? product.features.split(',').map(f => f.trim()) : [],
                  tags: product.tags && typeof product.tags === 'string' ? product.tags.split(',').map(t => t.trim()) : [],
                  isActive: product.isActive,
                  isFeatured: false
                }}
                isEditing={true}
              />
            ) : (
              <div className="space-y-6">
                {/* Product Images */}
                {product.images && product.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.startsWith('http') ? image : `http://localhost:4000${image}`}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA5NkM4MC41Njg1IDk2IDk2IDgwLjU2ODUgOTYgNjRDOTYgNDcuNDMxNSA4MC41Njg1IDMyIDY0IDMyQzQ3LjQzMTUgMzIgMzIgNDcuNDMxNSAzMiA2NEMzMiA4MC41Njg1IDQ3LjQzMTUgOTYgNjQgOTZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik02NCA4MEM3Mi44MzY2IDgwIDgwIDcyLjgzNjYgODAgNjRDODAgNTUuMTYzNCA3Mi44MzY2IDQ4IDY0IDQ4QzU1LjE2MzQgNDggNDggNTUuMTYzNCA0OCA2NEM0OCA3Mi44MzY2IDU1LjE2MzQgODAgNjQgODBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Product Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name
                      </label>
                      <p className="text-lg font-semibold text-gray-900">{product.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <p className="text-gray-600">{product.description}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-semibold text-green-600">
                            {formatCurrency(product.discountedPrice || product.price)}
                          </span>
                          {product.discountedPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock
                        </label>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="text-lg font-semibold">{product.stock}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-900">{product.category.name}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rating
                      </label>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-900">
                          {(product.rating || 0).toFixed(1)} ({product.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </div>

                    {product.brand && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brand
                        </label>
                        <p className="text-gray-900">{product.brand}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{formatDate(product.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {(product.specifications || product.features || product.tags) && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {product.specifications && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Specifications
                          </label>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                              {typeof product.specifications === 'object' 
                                ? JSON.stringify(product.specifications, null, 2)
                                : product.specifications}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      {product.features && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Features
                          </label>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-600">{product.features}</p>
                          </div>
                        </div>
                      )}
                      
                      {product.tags && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags
                          </label>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-600">{product.tags}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Product
                    </button>
                    

                    
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Product
                    </button>
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Product not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;