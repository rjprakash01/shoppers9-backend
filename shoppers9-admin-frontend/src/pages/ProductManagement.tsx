import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import ProductForm from '../components/ProductForm';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductPreviewModal from '../components/ProductPreviewModal';
import { CreateButton, EditButton, DeleteButton, ViewButton } from '../components/PermissionButton';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Package,
  Plus,
  Edit,
  Trash2,
  Star,
  Tag,
  Calendar,
  Filter,
  Menu,
  X
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentCategory?: string;
  isActive: boolean;
  children: Category[];
  productCount?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discountedPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  minOriginalPrice?: number;
  maxOriginalPrice?: number;
  maxDiscount?: number;
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
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  reviewStatus?: 'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested';
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
    _id?: string;
    id?: string;
  };
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const ProductManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false
  });
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isProductPreviewOpen, setIsProductPreviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pageSize, setPageSize] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);

  useEffect(() => {
    console.log('=== PRODUCT MANAGEMENT COMPONENT MOUNTED ===');
    console.log('Starting to fetch categories and products...');
    fetchCategoryTree();
    // Fetch all products by default
    fetchAllProducts(1);
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchQuery]);

  useEffect(() => {
    if (selectedCategory) {
      setCurrentPage(1);
      fetchProductsByCategory(selectedCategory, 1);
    } else {
      setCurrentPage(1);
      fetchAllProducts(1);
    }
  }, [selectedCategory, filterStatus, pageSize]);

  useEffect(() => {
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory, currentPage);
    } else {
      fetchAllProducts(currentPage);
    }
  }, [currentPage, pageSize]);

  // Close page selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPageSelector) {
        const target = event.target as Element;
        if (!target.closest('.page-selector-dropdown')) {
          setShowPageSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPageSelector]);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
    setShowPageSelector(false);
  };

  const fetchCategoryTree = async () => {
    try {
      console.log('=== PRODUCT MANAGEMENT: Fetching category tree ===');
      console.log('Auth token:', localStorage.getItem('adminToken') ? 'Present' : 'Missing');
      console.log('API URL:', import.meta.env.VITE_API_URL);
      setIsLoading(true);
      const response = await authService.getCategoryTree();
      console.log('Category tree response:', response);
      console.log('Response success:', response.success);
      console.log('Response data type:', typeof response.data);
      console.log('Response data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
      
      // Handle the backend response format: {success: true, data: [...]}
      let categories: Category[] = [];
      if (response && response.success && Array.isArray(response.data)) {
        categories = response.data;
        console.log('Categories found:', categories.length);
      } else if (Array.isArray(response)) {
        categories = response;
        console.log('Direct array response, categories found:', categories.length);
      } else {
        console.log('Unexpected response format:', response);
      }
      
      setCategories(categories);
      setError(null);
      console.log('Categories set in state:', categories);
      console.log('Main categories (level 1):', categories.filter(cat => cat.level === 1));
    } catch (err) {
      console.error('=== PRODUCT MANAGEMENT: Error fetching categories ===', err);
      if (err && typeof err === 'object' && 'response' in err) {
        console.error('Error response:', (err as any).response);
        console.error('Error status:', (err as any).response?.status);
        console.error('Error data:', (err as any).response?.data);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProducts = async (page: number) => {
    try {
      console.log('=== FRONTEND: Fetching all products ===');
      console.log('Page:', page, 'PageSize:', pageSize, 'FilterStatus:', filterStatus);
      setIsProductsLoading(true);
      
      // Map filter status to backend expected values
      let statusParam: string | undefined;
      if (filterStatus !== 'all') {
        switch (filterStatus) {
          case 'active':
            statusParam = 'active';
            break;
          case 'pending':
            statusParam = 'pending';
            break;
          case 'rejected':
            statusParam = 'rejected';
            break;
          default:
            statusParam = undefined;
        }
      }
      
      // Use the proper authService method that calls the correct admin endpoint
      const response = await authService.getAllProducts(
        page,
        pageSize,
        searchQuery || undefined,
        statusParam,
        selectedCategory || undefined
      );
      

       setProducts(response.products || []);
       setPagination(response.pagination);
      setError(null);
    } catch (err) {
        console.error('=== FRONTEND ERROR ===', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
        setProducts([]);
      } finally {
        setIsProductsLoading(false);
      }
    };

    // Manual refresh function for debugging
    const handleManualRefresh = () => {
      console.log('=== MANUAL REFRESH TRIGGERED ===');
      fetchAllProducts(1);
    };

  const fetchProductsByCategory = async (categoryId: string, page: number) => {
    try {
      setIsProductsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filterStatus !== 'all' && { isActive: filterStatus === 'active' ? 'true' : 'false' })
      });
      
      const responseData = await authService.get(`/admin/products/category/${categoryId}?${params}`);
      // Handle backend response format: {success: true, data: {products: [...], pagination: {...}}}
      const data = responseData.success ? responseData.data : responseData;
      const products = data.products || [];
      setProducts(products);
      
      // Ensure pagination has proper fallback values
      const paginationData = data.pagination || {};
      setPagination({
        currentPage: paginationData.currentPage || page,
        totalPages: paginationData.totalPages || Math.ceil(products.length / pageSize) || 1,
        totalProducts: paginationData.totalProducts || products.length,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || page > 1
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleCreateProduct = async (productData: FormData) => {
    try {
      // Add selected category to the product data if not already present
      if (selectedCategory && !productData.has('category')) {
        productData.append('category', selectedCategory);
      }
      
      await authService.createProduct(productData);
      setIsProductFormOpen(false);
      if (selectedCategory) {
        await fetchProductsByCategory(selectedCategory, currentPage);
      } else {
        await fetchAllProducts(currentPage);
      }
      await fetchCategoryTree();
    } catch (error) {
      
      throw error;
    }
  };

  const handleUpdateProduct = async (productData: FormData) => {
    if (!editingProduct) return;
    
    try {
      await authService.updateProduct(editingProduct.id, productData);
      
      setIsProductFormOpen(false);
      setEditingProduct(null);
      if (selectedCategory) {
        fetchProductsByCategory(selectedCategory, currentPage);
      } else {
        fetchAllProducts(currentPage);
      }
    } catch (err) {
      
      alert(`Error updating product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await authService.delete(`/admin/products/${productId}`);
      
      if (selectedCategory) {
        fetchProductsByCategory(selectedCategory, currentPage);
      } else {
        fetchAllProducts(currentPage);
      }
      fetchCategoryTree();
    } catch (err) {
      
    }
  };



  const handleEditProduct = async (product: Product) => {
    try {
      // Fetch complete product data including filter values
      const completeProductData = await authService.getProductById(product.id);
      
      // Fetch product filter values
      const filterValuesResponse = await authService.get(`/admin/products/${product.id}/filter-values`);
      const filterValues = filterValuesResponse.success ? filterValuesResponse.data.filterValues : [];
      
      // Transform filter values to match ProductForm expectations
      const transformedFilterValues = filterValues.map((fv: any) => ({
        filterId: fv.filter._id,
        filterOptionId: fv.filterOption?._id,
        customValue: fv.customValue
      }));
      
      // Create complete initial data with all required fields
      const completeInitialData = {
        name: completeProductData.name,
        description: completeProductData.description,
        price: completeProductData.discountedPrice || completeProductData.price,
        originalPrice: completeProductData.price,
        category: completeProductData.category?.id || completeProductData.category,
        subCategory: completeProductData.subCategory?.id || completeProductData.subCategory || '',
        subSubCategory: completeProductData.subSubCategory?.id || completeProductData.subSubCategory || '',
        brand: completeProductData.brand || '',
        stock: completeProductData.stock,
        images: completeProductData.images || [],
        features: Array.isArray(completeProductData.features) ? completeProductData.features : 
                 (completeProductData.features ? completeProductData.features.split(',').map((f: string) => f.trim()) : ['']),
        tags: Array.isArray(completeProductData.tags) ? completeProductData.tags : 
             (completeProductData.tags ? completeProductData.tags.split(',').map((t: string) => t.trim()) : ['']),
        isActive: completeProductData.isActive,
        isFeatured: completeProductData.isFeatured || false,
        isTrending: completeProductData.isTrending || false,
        filterValues: transformedFilterValues
      };
      
      setEditingProduct({ ...product, ...completeInitialData });
      setIsProductFormOpen(true);
    } catch (error) {
      
      // Fallback to basic product data if detailed fetch fails
      setEditingProduct(product);
      setIsProductFormOpen(true);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductPreviewOpen(true);
  };

  const handleProductPreviewClose = () => {
    setIsProductPreviewOpen(false);
    setSelectedProduct(null);
  };

  const handleProductDetailClose = () => {
    setIsProductDetailOpen(false);
    setSelectedProductId(null);
  };

  const handleResetPage = () => {
    // Reset all filters and selections
    setSelectedMainCategory('');
    setSelectedSubCategory('');
    setSelectedSubSubCategory('');
    setSelectedCategory(null);
    setFilterStatus('all');
    setCurrentPage(1);
    setPageSize(12);
    setShowPageSelector(false);
    
    // Refresh data
    fetchCategoryTree();
    fetchAllProducts(1);
  };

  const handleProductUpdate = () => {
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory, currentPage);
    } else {
      fetchAllProducts(currentPage);
    }
  };

  // Get main categories (level 1)
  const getMainCategories = (): Category[] => {
    return categories.filter(cat => cat.level === 1);
  };

  // Get sub-categories for selected main category
  const getSubCategories = (): Category[] => {
    if (!selectedMainCategory) return [];
    const mainCat = categories.find(cat => cat.id === selectedMainCategory);
    return mainCat?.children || [];
  };

  // Get sub-sub-categories for selected sub-category
  const getSubSubCategories = (): Category[] => {
    if (!selectedSubCategory) return [];
    const subCat = getSubCategories().find(cat => cat.id === selectedSubCategory);
    return subCat?.children || [];
  };

  // Handle dropdown changes
  const handleMainCategoryChange = (categoryId: string) => {
    setSelectedMainCategory(categoryId);
    setSelectedSubCategory('');
    setSelectedSubSubCategory('');
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleSubCategoryChange = (categoryId: string) => {
    setSelectedSubCategory(categoryId);
    setSelectedSubSubCategory('');
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleSubSubCategoryChange = (categoryId: string) => {
    setSelectedSubSubCategory(categoryId);
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const getCategoryPath = (categoryId: string): string => {
    const findPath = (cats: Category[], targetId: string, path: string[] = []): string[] | null => {
      for (const cat of cats) {
        const currentPath = [...path, cat.name];
        if (cat.id === targetId) {
          return currentPath;
        }
        if (cat.children.length > 0) {
          const result = findPath(cat.children, targetId, currentPath);
          if (result) return result;
        }
      }
      return null;
    };
    
    const path = findPath(categories, categoryId);
    return path ? path.join(' → ') : 'Unknown Category';
  };

  const getSelectedCategory = (): Category | null => {
    const findCategory = (cats: Category[], targetId: string): Category | null => {
      for (const cat of cats) {
        if (cat.id === targetId) return cat;
        if (cat.children.length > 0) {
          const result = findCategory(cat.children, targetId);
          if (result) return result;
        }
      }
      return null;
    };
    
    return selectedCategory ? findCategory(categories, selectedCategory) : null;
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (stock < 10) return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50' };
    return { label: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  const renderProductCard = (product: Product) => {
    const stockStatus = getStockStatus(product.stock);
    
    return (
      <div 
        key={product.id} 
        className="group bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-all duration-200 hover:border-blue-300 cursor-pointer relative overflow-hidden"
        onClick={() => handleProductClick(product)}
      >
        {/* Product Image */}
        {product.images && product.images.length > 0 ? (
          <div className="mb-2 relative">
            <div className="aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-md overflow-hidden">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDOTQuNDc3MiA3MCA5MCA3NC40NzcyIDkwIDgwVjEyMEM5MCA5NC40NzcyIDk0LjQ3NzIgOTAgMTAwIDkwSDEyMEMxMjUuNTIzIDkwIDEzMCA5NC40NzcyIDEzMCAxMDBWMTIwQzEzMCAxMjUuNTIzIDEyNS41MjMgMTMwIDEyMCAxMzBIMTAwQzk0LjQ3NzIgMTMwIDkwIDEyNS41MjMgOTAgMTIwVjgwWiIgZmlsbD0iI0Q5RDlEOSIvPgo8L3N2Zz4K';
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="aspect-square w-full bg-gray-100 rounded-xl flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          </div>
        )}
        
        {/* Product Info */}
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-tight line-clamp-2">
              {product.name}
            </h3>
            {product.brand && (
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <Tag className="h-3 w-3 mr-1" />
                <span className="font-medium">{product.brand}</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
        
        {/* Pricing Section */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900">
                  {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice ? 
                    `₹${product.minPrice} - ₹${product.maxPrice}` : 
                    `₹${product.price}`
                  }
                </span>
                {product.maxDiscount && product.maxDiscount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    {product.maxDiscount}% OFF
                  </span>
                )}
              </div>
              {product.maxDiscount && product.maxDiscount > 0 && (
                <span className="text-xs text-gray-500 line-through">
                  {product.minOriginalPrice && product.maxOriginalPrice && product.minOriginalPrice !== product.maxOriginalPrice ? 
                    `₹${product.minOriginalPrice} - ₹${product.maxOriginalPrice}` : 
                    `₹${product.originalPrice}`
                  }
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Status and Stock */}
        <div className="mt-2 flex items-center justify-between">
          <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.color}`}>
            {product.stock} in stock
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            product.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
            product.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            product.approvalStatus === 'needs_changes' ? 'bg-orange-100 text-orange-700' :
            product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {product.approvalStatus === 'rejected' ? 'Rejected' :
             product.approvalStatus === 'pending' ? 'Pending' :
             product.approvalStatus === 'needs_changes' ? 'Needs Changes' :
             product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(product.createdAt).toLocaleDateString()}
            </span>
            <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded">
              #{product.id.slice(-6)}
            </span>
          </div>
          {/* Product Owner Information */}
          {product.createdBy && (
            <div className="mt-1 text-xs text-blue-600">
              Created by: {product.createdBy.firstName} {product.createdBy.lastName}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Products Content */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-3">
            {/* Title */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1 bg-green-100 rounded-md">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Product Management</h1>
            </div>
            
            {/* Category Selection Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {/* Main Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedMainCategory}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Category</option>
                  {getMainCategories().map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sub Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sub-category
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  disabled={!selectedMainCategory}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Sub-category</option>
                  {getSubCategories().map(subCategory => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sub-Sub Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sub-sub-category
                </label>
                <select
                  value={selectedSubSubCategory}
                  onChange={(e) => handleSubSubCategoryChange(e.target.value)}
                  disabled={!selectedSubCategory}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Sub-sub-category</option>
                  {getSubSubCategories().map(subSubCategory => (
                    <option key={subSubCategory.id} value={subSubCategory.id}>
                      {subSubCategory.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Action Buttons and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-6 pr-2 py-1 text-xs border border-gray-300 rounded-md leading-4 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {searchQuery.trim() && (
                  <p className="text-xs text-gray-500 mt-1">
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Add Product Button */}
              <CreateButton
                module="products"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductFormOpen(true);
                }}
                tooltip="Add a new product"
                size="sm"
              >
                Add Product
              </CreateButton>
              
              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                className="flex items-center px-2 py-1 text-xs font-medium bg-blue-600 text-white border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </button>
              
              {/* Reset Button */}
              <button
                onClick={handleResetPage}
                className="flex items-center px-2 py-1 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Reset
              </button>
            </div>
            </div>
            
            {/* Filter Options */}
            <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">Filter by Status:</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'active'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isProductsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4 text-sm px-4">{error}</p>
              <button
                onClick={() => selectedCategory ? fetchProductsByCategory(selectedCategory, currentPage) : fetchAllProducts(currentPage)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500 mb-4 text-sm px-4">This category doesn't have any products yet</p>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductFormOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                Add First Product
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 mb-6">
                {(searchQuery.trim() ? filteredProducts : products).map(product => renderProductCard(product))}
              </div>
              
              {/* Search Results Summary */}
              {searchQuery.trim() && (
                <div className="bg-white p-3 rounded-lg border border-gray-200 mb-6">
                  <p className="text-sm text-gray-600">
                    Found <span className="font-medium">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''} matching "{searchQuery}"
                  </p>
                </div>
              )}
              
              {/* Pagination */}
              {(pagination.totalProducts > 0 || products.length > 0) && (
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="text-xs text-gray-600">
                      Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * pageSize, pagination.totalProducts)}</span> of{' '}
                      <span className="font-medium">{pagination.totalProducts}</span> products
                    </div>
                    
                    {/* Items per page selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Items per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={6}>6</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Mobile Pagination */}
                  {(pagination.totalPages > 1 || products.length > pageSize) && (
                    <div className="flex sm:hidden flex-col items-center space-y-2">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-2 py-1.5 text-xs font-medium rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          First
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!pagination.hasPrev}
                          className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-md">
                          {currentPage} / {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!pagination.hasNext}
                          className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          disabled={currentPage === pagination.totalPages}
                          className="px-2 py-1.5 text-xs font-medium rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Last
                        </button>
                      </div>
                      
                      {/* Mobile page selector */}
                      {pagination.totalPages > 3 && (
                        <div className="relative page-selector-dropdown">
                          <button
                            onClick={() => setShowPageSelector(!showPageSelector)}
                            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Go to page
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </button>
                          
                          {showPageSelector && (
                            <div className="absolute left-1/2 transform -translate-x-1/2 mt-1 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                              {Array.from({ length: pagination.totalPages }, (_, i) => (
                                <button
                                  key={i + 1}
                                  onClick={() => handlePageSelect(i + 1)}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                                    currentPage === i + 1 ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  Page {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Desktop Pagination */}
                  {(pagination.totalPages > 1 || products.length > pageSize) && (
                    <div className="hidden sm:flex items-center space-x-2">
                      {/* First Page Button */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2.5 py-1.5 text-xs font-medium rounded-md ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Page selector dropdown */}
                      {pagination.totalPages > 5 && (
                        <div className="relative page-selector-dropdown">
                          <button
                            onClick={() => setShowPageSelector(!showPageSelector)}
                            className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Go to
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </button>
                          
                          {showPageSelector && (
                            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                              {Array.from({ length: pagination.totalPages }, (_, i) => (
                                <button
                                  key={i + 1}
                                  onClick={() => handlePageSelect(i + 1)}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                                    currentPage === i + 1 ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  Page {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </button>
                      
                      {/* Last Page Button */}
                      <button
                        onClick={() => setCurrentPage(pagination.totalPages)}
                        disabled={currentPage === pagination.totalPages}
                        className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {isProductFormOpen && (
        <ProductForm
          isOpen={isProductFormOpen}
          onClose={() => {
            setIsProductFormOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          initialData={editingProduct ? {
            ...editingProduct,
            category: typeof editingProduct.category === 'object' ? editingProduct.category.id : editingProduct.category
          } : selectedCategory ? {
            category: selectedCategory
          } : undefined}
          isEditing={!!editingProduct}
        />
      )}

      {/* Product Detail Modal */}
      {isProductDetailOpen && selectedProductId && (
        <ProductDetailModal
          isOpen={isProductDetailOpen}
          onClose={handleProductDetailClose}
          productId={selectedProductId}
          onProductUpdate={handleProductUpdate}
        />
      )}

      {/* Product Preview Modal */}
      {isProductPreviewOpen && selectedProduct && (
        <ProductPreviewModal
          isOpen={isProductPreviewOpen}
          onClose={handleProductPreviewClose}
          product={selectedProduct}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

    </div>
  );
};

export default ProductManagement;