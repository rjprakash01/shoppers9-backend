import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { FiSearch, FiFilter, FiCheck, FiX, FiEdit, FiEye, FiMoreVertical, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ProductReviewPreviewModal from '../components/ProductReviewPreviewModal';

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
}

interface ReviewQueueResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const ProductReviewQueue: React.FC = () => {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();

  // Debug logging
  console.log('🔍 ProductReviewQueue: Auth state -', {
    authLoading,
    user: !!user,
    userRole: user?.role,
    isSuperAdminResult: user ? isSuperAdmin() : 'user is null'
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedProductForPreview, setSelectedProductForPreview] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [reviewComments, setReviewComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    console.log('🔍 ProductReviewQueue useEffect: Checking auth state -', {
      authLoading,
      user: !!user,
      userRole: user?.role,
      canCallIsSuperAdmin: !!user
    });
    
    if (authLoading) {
      console.log('🔍 ProductReviewQueue: Auth still loading, skipping fetch');
      return;
    }
    
    if (!user) {
      console.log('🔍 ProductReviewQueue: No user found, skipping fetch');
      return;
    }
    
    try {
      const isSuper = isSuperAdmin();
      console.log('🔍 ProductReviewQueue: isSuperAdmin result:', isSuper);
      if (isSuper) {
        console.log('🔍 ProductReviewQueue: User is super admin, fetching review queue');
        fetchReviewQueue(currentPage);
      } else {
        console.log('🔍 ProductReviewQueue: User is not super admin');
      }
    } catch (error) {
      console.error('🔍 ProductReviewQueue: Error calling isSuperAdmin:', error);
      setError('Authentication error: ' + (error as Error).message);
    }
  }, [currentPage, pageSize, statusFilter, searchTerm, authLoading, user]);

  const fetchReviewQueue = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 ProductReviewQueue: Fetching review queue for page:', page);
      
      const response: ReviewQueueResponse = await authService.getReviewQueue(
        page,
        pageSize,
        statusFilter !== 'all' ? statusFilter : undefined,
        searchTerm || undefined
      );
      
      console.log('🔍 ProductReviewQueue: Received response:', {
        hasProducts: !!response?.products,
        productsLength: response?.products?.length || 0,
        hasPagination: !!response?.pagination,
        paginationData: response?.pagination
      });
      
      // Ensure we have valid data before setting state
      if (response && typeof response === 'object') {
        setProducts(response.products || []);
        setPagination(response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalProducts: 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        console.error('🔍 ProductReviewQueue: Invalid response format:', response);
        setProducts([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalProducts: 0,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (err) {
      console.error('🔍 ProductReviewQueue: Error fetching review queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch review queue');
      setProducts([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReviewQueue(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const openReviewModal = (product: Product, action: 'approve' | 'reject' | 'request_changes') => {
    setSelectedProduct(product);
    setReviewAction(action);
    setReviewComments('');
    setRejectionReason('');
    if (action === 'reject') {
      setShowRejectModal(true);
    } else {
      setShowReviewModal(true);
    }
  };

  const openPreviewModal = (product: Product) => {
    setSelectedProductForPreview(product);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setSelectedProductForPreview(null);
  };

  const handleDirectApproval = async (product: Product) => {
    try {
      setIsLoading(true);
      
      // Make API call first, only update UI after success
      await authService.approveProduct(product.id, '');
      
      // Remove the product from the UI only after successful API call
      const updatedProducts = products.filter(p => p.id !== product.id);
      setProducts(updatedProducts);
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        totalProducts: prev.totalProducts - 1
      }));
      
      toast.success('Product approved successfully');
      
      // Check if this was the only product on the current page and we need to go back
      const isOnlyProductOnPage = updatedProducts.length === 0;
      const shouldGoToPreviousPage = isOnlyProductOnPage && currentPage > 1;
      
      if (shouldGoToPreviousPage) {
        setCurrentPage(currentPage - 1);
      } else if (updatedProducts.length === 0) {
        // If no products left on current page but it's page 1, refresh to show empty state
        fetchReviewQueue(currentPage);
      }
    } catch (err) {
      console.error('Error approving product:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to approve product');
      // No need to revert since UI wasn't changed yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedProduct || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setIsLoading(true);
      
      const productToReject = selectedProduct;
      const reasonToSubmit = rejectionReason;
      
      await authService.rejectProduct(productToReject.id, reasonToSubmit, '');
      
      // Close modal and reset form after successful API call
      setShowRejectModal(false);
      setSelectedProduct(null);
      setRejectionReason('');
      
      // Remove the product from the UI
      const updatedProducts = products.filter(p => p.id !== productToReject.id);
      setProducts(updatedProducts);
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        totalProducts: prev.totalProducts - 1
      }));
      
      toast.success('Product rejected successfully');
      
      // Check if this was the only product on the current page and we need to go back
      const isOnlyProductOnPage = updatedProducts.length === 0;
      const shouldGoToPreviousPage = isOnlyProductOnPage && currentPage > 1;
      
      if (shouldGoToPreviousPage) {
        setCurrentPage(currentPage - 1);
      } else if (updatedProducts.length === 0) {
        // If no products left on current page but it's page 1, refresh to show empty state
        fetchReviewQueue(currentPage);
      }
    } catch (err) {
      console.error('Error rejecting product:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to reject product');
      
      // Revert UI changes on error - add the product back to the list
      const productToRevert = selectedProduct;
      if (productToRevert) {
        setProducts(prevProducts => [...prevProducts, productToRevert]);
        setPagination(prev => ({
          ...prev,
          totalProducts: prev.totalProducts + 1
        }));
      }
      
      // Keep the modal open so user can retry
      // Don't reset selectedProduct or rejectionReason
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedProduct) return;

    try {
      setIsLoading(true);
      
      switch (reviewAction) {
        case 'approve':
          await authService.approveProduct(selectedProduct.id, reviewComments);
          toast.success('Product approved successfully');
          break;
        case 'reject':
          if (!rejectionReason.trim()) {
            toast.error('Rejection reason is required');
            return;
          }
          await authService.rejectProduct(selectedProduct.id, rejectionReason, reviewComments);
          toast.success('Product rejected successfully');
          break;
        case 'request_changes':
          if (!rejectionReason.trim()) {
            toast.error('Reason for changes is required');
            return;
          }
          await authService.requestProductChanges(selectedProduct.id, rejectionReason, reviewComments);
          toast.success('Changes requested successfully');
          break;
      }
      
      setShowReviewModal(false);
      
      // Check if this was the only product on the current page
      const isOnlyProductOnPage = products.length === 1;
      const shouldGoToPreviousPage = isOnlyProductOnPage && currentPage > 1;
      
      if (shouldGoToPreviousPage) {
        // Navigate to previous page if current page will be empty
        setCurrentPage(currentPage - 1);
      } else {
        // Refresh current page
        fetchReviewQueue(currentPage);
      }
    } catch (err) {
      console.error('Error processing review:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to process review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products first');
      return;
    }

    // For reject action, we need a reason
    if (action === 'reject') {
      const reason = prompt('Please provide a reason for bulk rejection:');
      if (!reason || !reason.trim()) {
        toast.error('Rejection reason is required');
        return;
      }
      
      try {
        setIsLoading(true);
        await authService.bulkReviewAction(selectedProducts, action, reason.trim());
        toast.success(`Bulk ${action} completed successfully`);
        
        // Check if all products on current page were selected
        const allProductsSelected = selectedProducts.length === products.length;
        const shouldGoToPreviousPage = allProductsSelected && currentPage > 1;
        
        setSelectedProducts([]);
        
        if (shouldGoToPreviousPage) {
          // Navigate to previous page if current page will be empty
          setCurrentPage(currentPage - 1);
        } else {
          // Refresh current page
          fetchReviewQueue(currentPage);
        }
      } catch (err) {
        console.error('Error performing bulk action:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to perform bulk action');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For approve action, no reason needed
    try {
      setIsLoading(true);
      await authService.bulkReviewAction(selectedProducts, action);
      toast.success(`Bulk ${action} completed successfully`);
      
      // Check if all products on current page were selected
      const allProductsSelected = selectedProducts.length === products.length;
      const shouldGoToPreviousPage = allProductsSelected && currentPage > 1;
      
      setSelectedProducts([]);
      
      if (shouldGoToPreviousPage) {
        // Navigate to previous page if current page will be empty
        setCurrentPage(currentPage - 1);
      } else {
        // Refresh current page
        fetchReviewQueue(currentPage);
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to perform bulk action');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      changes_requested: { color: 'bg-blue-100 text-blue-800', text: 'Changes Requested' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Show loading state while authentication is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Authenticating...</p>
      </div>
    );
  }

  // Check if user exists and has super admin access
  if (!user || !isSuperAdmin()) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-red-500 mb-4">
          <FiShield className="h-16 w-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          {!user ? 'Please log in to access this page.' : 'You need Super Admin privileges to access the Product Review Queue.'}
        </p>
        <p className="text-sm text-gray-500">
          Current role: {user?.role || 'Unknown'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Review Queue</h1>
        <p className="text-gray-600">Review and manage product submissions</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="changes_requested">Changes Requested</option>
            </select>
            
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedProducts.length} product(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Bulk Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchReviewQueue(currentPage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in review queue</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-8 w-8 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {product.category?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {product.price ? `₹${product.price.toLocaleString()}` : '₹N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(product.reviewStatus)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div className="font-medium">
                          {product.submittedAt ? 
                            new Date(product.submittedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'
                          }
                        </div>
                        <div className="text-xs text-gray-400">
                          {product.submittedAt ? 
                            new Date(product.submittedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''
                          }
                        </div>
                        <div className="text-xs mt-1">by {product.submittedBy?.name || 'Unknown'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDirectApproval(product)}
                            disabled={isLoading}
                            className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            title="Approve Product"
                          >
                            <FiCheck size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => openReviewModal(product, 'reject')}
                            disabled={isLoading}
                            className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            title="Reject Product"
                          >
                            <FiX size={12} />
                            Reject
                          </button>
                          <button
                            onClick={() => openPreviewModal(product)}
                            disabled={isLoading}
                            className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            title="Preview Product"
                          >
                            <FiEye size={12} />
                            Preview
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.totalProducts)} of {pagination.totalProducts} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Changes Modal */}
      {showReviewModal && selectedProduct && reviewAction === 'request_changes' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FiEdit className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Request Changes</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Product: <span className="font-medium">{selectedProduct.name}</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Changes *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Please specify what changes are needed..."
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Optional additional notes..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={isLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Request Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Product Modal */}
      {showRejectModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <FiX className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Product</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Product: <span className="font-medium">{selectedProduct.name}</span></p>
              <p className="text-sm text-red-600 mt-1">This action will permanently reject the product submission.</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Please provide a clear reason for rejecting this product..."
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={isLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Rejecting...' : 'Reject Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Preview Modal */}
      {showPreviewModal && selectedProductForPreview && (
        <ProductReviewPreviewModal
          product={selectedProductForPreview}
          isOpen={showPreviewModal}
          onClose={closePreviewModal}
          onApprove={() => {
            closePreviewModal();
            handleDirectApproval(selectedProductForPreview);
          }}
          onReject={() => {
            closePreviewModal();
            openReviewModal(selectedProductForPreview, 'reject');
          }}
          onRequestChanges={() => {
            closePreviewModal();
            openReviewModal(selectedProductForPreview, 'request_changes');
          }}
        />
      )}
    </div>
  );
};

export default ProductReviewQueue;