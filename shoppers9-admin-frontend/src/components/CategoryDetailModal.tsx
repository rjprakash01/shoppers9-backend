import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import CategoryForm from './CategoryForm';
import {
  X,
  Edit,
  Package,
  Calendar,
  Eye,
  EyeOff,
  Grid,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

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
}

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  onCategoryUpdate: () => void;
}

const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  onCategoryUpdate
}) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  useEffect(() => {
    if (isOpen && categoryId) {
      fetchCategory();
    }
  }, [isOpen, categoryId]);

  useEffect(() => {
    if (showProducts && categoryId) {
      fetchCategoryProducts();
    }
  }, [showProducts, categoryId, currentPage]);

  const fetchCategory = async () => {
    try {
      setIsLoading(true);
      setError('');
      const categoryData = await authService.getCategoryById(categoryId);
      setCategory(categoryData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch category');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await authService.getProductsByCategory(categoryId, currentPage, productsPerPage);
      setProducts(response.products);
      setTotalPages(response.totalPages);
      setTotalProducts(response.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch category products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!category) return;
    
    try {
      setUpdatingStatus(true);
      await authService.updateCategoryStatus(category.id, !category.isActive);
      setCategory({ ...category, isActive: !category.isActive });
      onCategoryUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update category status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCategoryUpdate = async (categoryData: any) => {
    try {
      await authService.updateCategory(categoryId, categoryData);
      await fetchCategory(); // Refresh category data
      setIsEditing(false);
      onCategoryUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Category' : showProducts ? `Products in ${category?.name}` : 'Category Details'}
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
          ) : category ? (
            isEditing ? (
              <CategoryForm
                isOpen={true}
                onClose={() => setIsEditing(false)}
                onSubmit={handleCategoryUpdate}
                initialData={{
                  name: category.name,
                  description: category.description,
                  isActive: category.isActive
                }}
                isEditing={true}
              />
            ) : showProducts ? (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={() => setShowProducts(false)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Category Details
                </button>

                {/* Products Header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Products ({totalProducts})
                  </h3>
                </div>

                {/* Products Grid */}
                {productsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          {/* Product Image */}
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:4000${product.images[0]}`}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded-md mb-3"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA5NkM4MC41Njg1IDk2IDk2IDgwLjU2ODUgOTYgNjRDOTYgNDcuNDMxNSA4MC41Njg1IDMyIDY0IDMyQzQ3LjQzMTUgMzIgMzIgNDcuNDMxNSAzMiA2NEMzMiA4MC41Njg1IDQ3LjQzMTUgOTYgNjQgOTZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik02NCA4MEM3Mi44MzY2IDgwIDgwIDcyLjgzNjYgODAgNjRDODAgNTUuMTYzNCA3Mi44MzY2IDQ4IDY0IDQ4QzU1LjE2MzQgNDggNDggNTUuMTYzNCA0OCA2NEM0OCA3Mi44MzY2IDU1LjE2MzQgODAgNjQgODBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                              }}
                            />
                          )}
                          
                          {/* Product Info */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-semibold text-green-600">
                                  {formatCurrency(product.discountedPrice || product.price)}
                                </span>
                                {product.discountedPrice && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatCurrency(product.price)}
                                  </span>
                                )}
                              </div>
                              
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Stock: {product.stock}</span>
                              <span>Rating: {(product.rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Showing{' '}
                              <span className="font-medium">
                                {(currentPage - 1) * productsPerPage + 1}
                              </span>{' '}
                              to{' '}
                              <span className="font-medium">
                                {Math.min(currentPage * productsPerPage, totalProducts)}
                              </span>{' '}
                              of <span className="font-medium">{totalProducts}</span> results
                            </p>
                          </div>
                          <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                              <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                    page === currentPage
                                      ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                              <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No products found in this category</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Category Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name
                      </label>
                      <p className="text-lg font-semibold text-gray-900">{category.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Count
                      </label>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-lg font-semibold">{category.productCount}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{formatDate(category.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Category
                    </button>
                    
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updatingStatus}
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                        category.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updatingStatus ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : category.isActive ? (
                        <EyeOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      {category.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    {category.productCount > 0 && (
                      <button
                        onClick={() => setShowProducts(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
                      >
                        <Grid className="h-4 w-4 mr-2" />
                        View Products ({category.productCount})
                      </button>
                    )}
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
              <p className="text-gray-500">Category not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;