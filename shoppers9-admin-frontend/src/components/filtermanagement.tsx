import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import {
  Plus,
  Edit,
  Trash2,
  Filter as FilterIcon,
  Save,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Filter {
  _id: string;
  id?: string; // Optional for backward compatibility
  name: string;
  displayName: string;
  type: 'single' | 'multiple';
  dataType: 'string' | 'number' | 'boolean';
  description?: string;
  categoryLevels: (1 | 2 | 3)[];
  categories: string[];
  isActive: boolean;
  sortOrder: number;
  options: FilterOption[];
  createdAt: string;
  updatedAt: string;
}

interface FilterOption {
  id: string;
  filter: string;
  value: string;
  displayValue: string;
  colorCode?: string;
  isActive: boolean;
  sortOrder: number;
}

interface FilterFormData {
  name: string;
  displayName: string;
  type: 'single' | 'multiple';
  dataType: 'string' | 'number' | 'boolean';
  description: string;
  categoryLevels: (1 | 2 | 3)[];
  categories: string[];
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  _id: string;
  name: string;
  displayName: string;
  level: 1 | 2 | 3;
  isActive: boolean;
}

const FilterManagement: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFilters, setTotalFilters] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState<FilterFormData>({
    name: '',
    displayName: '',
    type: 'single',
    dataType: 'string',
    description: '',
    categoryLevels: [2, 3],
    categories: [],
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    fetchFilters();
  }, [currentPage, searchTerm, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await authService.getCategoryTree();
      if (response.success && response.data) {
        // Flatten the category tree
        const flattenCategories = (cats: any[], level = 1): Category[] => {
          let result: Category[] = [];
          for (const cat of cats) {
            result.push({
              _id: cat._id || cat.id,
              name: cat.name,
              displayName: cat.displayName || cat.name,
              level: cat.level || level,
              isActive: cat.isActive
            });
            if (cat.children && cat.children.length > 0) {
              result = result.concat(flattenCategories(cat.children, level + 1));
            }
          }
          return result;
        };
        
        const flatCategories = flattenCategories(response.data);
        setCategories(flatCategories);
      }
    } catch (err: any) {
      
    }
  };

  const fetchFilters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await authService.get(`/admin/filters?page=${currentPage}&limit=${pageSize}${searchParam}`);

      // Handle the backend response format: {success: true, data: {filters: [...], pagination: {...}}}
      // Note: authService.get() returns response.data directly, so we access response.data.filters
      if (response && response.success && response.data && Array.isArray(response.data.filters)) {

        setFilters(response.data.filters);
        
        // Handle pagination data
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages);
          setTotalFilters(response.data.pagination.total);
        }
      } else if (response && Array.isArray(response)) {
        :', response);
        setFilters(response);
      } else {
        
        setFilters([]);
      }
    } catch (err: any) {
      
      setError(err.response?.data?.message || 'Failed to fetch filters');
      setFilters([]); // Ensure filters is always an array
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      let response;
      if (editingFilter) {
        response = await authService.put(`/admin/filters/${editingFilter._id}`, formData);
      } else {
        response = await authService.post('/admin/filters', formData);
        // Reset to page 1 to see the newly created filter
        setCurrentPage(1);
      }

      await fetchFilters();
      handleCloseForm();
    } catch (err: any) {
      
      setError(err.response?.data?.message || 'Failed to save filter');
    }
  };

  const handleEdit = (filter: Filter) => {

    setEditingFilter(filter);
    setFormData({
      name: filter.name,
      displayName: filter.displayName,
      type: filter.type,
      dataType: filter.dataType,
      description: filter.description || '',
      categoryLevels: filter.categoryLevels || [2, 3],
      categories: filter.categories || [],
      isActive: filter.isActive,
      sortOrder: filter.sortOrder
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (filterId: string) => {
    
    if (!window.confirm('Are you sure you want to delete this filter?')) {
      return;
    }
    
    try {
      setError(null);
      
      await authService.delete(`/admin/filters/${filterId}`);
      await fetchFilters();
    } catch (err: any) {
      
      setError(err.response?.data?.message || 'Failed to delete filter');
    }
  };

  const handleToggleStatus = async (filterId: string, currentStatus: boolean) => {
    
    try {
      setError(null);
      
      await authService.put(`/admin/filters/${filterId}/toggle-status`);
      await fetchFilters();
    } catch (err: any) {
      
      setError(err.response?.data?.message || 'Failed to update filter status');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFilter(null);
    setFormData({
      name: '',
      displayName: '',
      type: 'single',
      dataType: 'string',
      description: '',
      categoryLevels: [2, 3],
      categories: [],
      isActive: true,
      sortOrder: 0
    });
  };

  const handleInputChange = (field: keyof FilterFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleManageOptions = (filter: Filter) => {

    if (filter._id) {
      navigate(`/filter-options/${filter._id}`);
    } else {
      alert('Filter ID is missing. Please try refreshing the page.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filter Management</h1>
          <p className="text-gray-600 mt-1">Manage product filters and their options</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search filters..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : filters.length === 0 ? (
        <div className="text-center py-12">
          <FilterIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No filters</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No filters match your search.' : 'Get started by creating a new filter.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Levels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Options
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filters.map((filter) => (
                <tr key={filter._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{filter.displayName}</div>
                      <div className="text-sm text-gray-500">{filter.name}</div>
                      {filter.description && (
                        <div className="text-xs text-gray-400 mt-1">{filter.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      filter.type === 'single' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {filter.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{filter.dataType}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {filter.categoryLevels?.map((level) => (
                        <span key={level} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Level {level}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {filter.categories?.length > 0 ? (
                        <span className="text-xs text-gray-600">
                          {filter.categories.length} categories assigned
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No categories</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{filter.options?.length || 0}</span>
                      <button
                        onClick={() => handleManageOptions(filter)}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(filter._id, filter.isActive)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        filter.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {filter.isActive ? (
                        <><Eye className="h-3 w-3 mr-1" /> Active</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(filter)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(filter._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalFilters)}
                </span>{' '}
                of <span className="font-medium">{totalFilters}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === currentPage
                          ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Filter Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingFilter ? 'Edit Filter' : 'Add New Filter'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData?.displayName || ''}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData?.type || 'single'}
                    onChange={(e) => handleInputChange('type', e.target.value as 'single' | 'multiple')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="single">Single Selection</option>
                    <option value="multiple">Multiple Selection</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Type *
                  </label>
                  <select
                    value={formData?.dataType || 'string'}
                    onChange={(e) => handleInputChange('dataType', e.target.value as 'string' | 'number' | 'boolean')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData?.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description for this filter"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Levels
                </label>
                <div className="flex gap-4">
                  {[1, 2, 3].map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.categoryLevels.includes(level as 1 | 2 | 3)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              categoryLevels: [...formData.categoryLevels, level as 1 | 2 | 3]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              categoryLevels: formData.categoryLevels.filter(l => l !== level)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      Level {level}
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Select which category levels this filter applies to
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categories
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {/* Select All checkbox */}
                  {categories.filter(cat => formData.categoryLevels.includes(cat.level)).length > 0 && (
                    <label className="flex items-center mb-3 pb-2 border-b border-gray-200">
                      <input
                        type="checkbox"
                        checked={(() => {
                          const filteredCategories = categories.filter(cat => formData.categoryLevels.includes(cat.level));
                          return filteredCategories.length > 0 && filteredCategories.every(cat => formData.categories.includes(cat._id));
                        })()}
                        onChange={(e) => {
                          const filteredCategories = categories.filter(cat => formData.categoryLevels.includes(cat.level));
                          if (e.target.checked) {
                            // Select all categories
                            const allCategoryIds = filteredCategories.map(cat => cat._id);
                            setFormData({
                              ...formData,
                              categories: [...new Set([...formData.categories, ...allCategoryIds])]
                            });
                          } else {
                            // Deselect all categories
                            const categoryIdsToRemove = filteredCategories.map(cat => cat._id);
                            setFormData({
                              ...formData,
                              categories: formData.categories.filter(id => !categoryIdsToRemove.includes(id))
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-semibold text-blue-600">
                        Select All
                      </span>
                    </label>
                  )}
                  
                  {/* Individual category checkboxes */}
                  {categories
                    .filter(cat => formData.categoryLevels.includes(cat.level))
                    .map((category) => (
                    <label key={category._id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              categories: [...formData.categories, category._id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              categories: formData.categories.filter(id => id !== category._id)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {category.displayName} (Level {category.level})
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Select categories this filter applies to (filtered by selected levels)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData?.sortOrder || 0}
                  onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              
              {/* Filter Options Section - Only show when editing existing filter */}
              {editingFilter && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Filter Options</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Current options: <span className="font-medium">{editingFilter.options?.length || 0}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Manage the available options for this filter
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleManageOptions(editingFilter)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Manage Options
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  {editingFilter ? 'Update Filter' : 'Create Filter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterManagement;