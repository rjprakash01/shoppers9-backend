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
  Search,
  Settings,
  Tag,
  Link,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Filter {
  _id: string;
  name: string;
  displayName: string;
  type: 'single' | 'multiple';
  dataType: 'string' | 'number' | 'boolean';
  description?: string;
  isActive: boolean;
  sortOrder: number;
  options: FilterOption[];
  createdAt: string;
  updatedAt: string;
}

interface FilterOption {
  _id: string;
  value: string;
  displayValue: string;
  colorCode?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  _id?: string; // Keep for backward compatibility
  name: string;
  level: number;
  parentCategory?: string;
  isActive: boolean;
  children?: Category[];
}

interface CategoryFilter {
  _id: string;
  category: {
    _id: string;
    name: string;
  };
  filter: {
    _id: string;
    name: string;
    displayName: string;
  };
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface FilterFormData {
  name: string;
  displayName: string;
  type: 'single' | 'multiple';
  dataType: 'string' | 'number' | 'boolean';
  description: string;
  isActive: boolean;
  sortOrder: number;
  options: {
    value: string;
    displayValue: string;
    colorCode?: string;
    isActive: boolean;
    sortOrder: number;
  }[];
}

const FilterManagement: React.FC = () => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'filters' | 'assignments'>('filters');
  
  // Filter Management State
  const [isFilterFormOpen, setIsFilterFormOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [currentFilterPage, setCurrentFilterPage] = useState(1);
  const [filterPageSize, setFilterPageSize] = useState(10);
  
  // Assignment Management State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [assignedFilters, setAssignedFilters] = useState<CategoryFilter[]>([]);
  const [isAssignmentLoading, setIsAssignmentLoading] = useState(false);
  
  const [filterFormData, setFilterFormData] = useState<FilterFormData>({
    name: '',
    displayName: '',
    type: 'multiple',
    dataType: 'string',
    description: '',
    isActive: true,
    sortOrder: 0,
    options: []
  });

  useEffect(() => {
    fetchFilters();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryFilters(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchFilters = async () => {
    try {
      setIsLoading(true);
      // Fetch all filters by setting a high limit to avoid pagination issues
      const response = await authService.get('/api/admin/filters?limit=1000');
      
      setFilters(response.data.filters || []);
      
    } catch (error) {
      setError('Failed to fetch filters');
      
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authService.get('/api/admin/categories/tree');

      setCategories(response.data || []);
    } catch (error) {
      
    }
  };

  const fetchCategoryFilters = async (categoryId: string) => {
    try {
      setIsAssignmentLoading(true);

      // Fetch assigned filters
      const assignedResponse = await authService.get(`/api/admin/categories/${categoryId}/filters`);
      
      setAssignedFilters(assignedResponse.data.categoryFilters || assignedResponse.data.filters || []);
      
      // Fetch available filters
      const availableResponse = await authService.get(`/api/admin/categories/${categoryId}/available-filters`);

      const availableFiltersData = availableResponse.data.availableFilters || [];
      
      setAvailableFilters(availableFiltersData);
    } catch (error) {

    } finally {
      setIsAssignmentLoading(false);
    }
  };

  const handleCreateFilter = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Authentication required. Please login again.');
        window.location.href = '/login';
        return;
      }

      const validOptions = filterFormData.options.filter(opt => opt.value && opt.displayValue);
      const filterData = {
        name: filterFormData.name,
        displayName: filterFormData.displayName,
        type: filterFormData.type,
        dataType: filterFormData.dataType,
        description: filterFormData.description,
        isActive: filterFormData.isActive,
        sortOrder: filterFormData.sortOrder,
        options: validOptions
      };

      const response = await authService.post('/api/admin/filters', filterData);

      if (response.success) {
        await fetchFilters();
        resetFilterForm();
        setIsFilterFormOpen(false);
        setError(''); // Clear any previous errors
      } else {
        setError('Failed to create filter: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
        return;
      }
      
      const errorMessage = error?.response?.data?.message || 'Failed to create filter';
      setError(errorMessage);

    }
  };

  const handleUpdateFilter = async () => {
    if (!editingFilter) {
      
      return;
    }
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Authentication required. Please login again.');
        window.location.href = '/login';
        return;
      }

      const validOptions = filterFormData.options.filter(opt => opt.value && opt.displayValue);
      const filterData = {
        name: filterFormData.name,
        displayName: filterFormData.displayName,
        type: filterFormData.type,
        dataType: filterFormData.dataType,
        description: filterFormData.description,
        isActive: filterFormData.isActive,
        sortOrder: filterFormData.sortOrder,
        options: validOptions
      };

      const response = await authService.put(`/api/admin/filters/${editingFilter._id}`, filterData);

      if (response.success) {
        await fetchFilters();
        resetFilterForm();
        setIsFilterFormOpen(false);
        setEditingFilter(null);
        setError(''); // Clear any previous errors
      } else {
        setError('Failed to update filter: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
        return;
      }
      
      const errorMessage = error?.response?.data?.message || 'Failed to update filter';
      setError(errorMessage);

    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    if (!confirm('Are you sure you want to delete this filter?')) return;
    
    try {
      
      const response = await authService.delete(`/api/admin/filters/${filterId}`);
      
      await fetchFilters();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete filter';
      setError(errorMessage);

    }
  };

  const handleAssignFilter = async (filterId: string) => {
    if (!selectedCategory) {
      
      return;
    }
    
    try {
      
      const requestData = {
        filterId,
        isRequired: false,
        isActive: true,
        sortOrder: assignedFilters.length + 1
      };

      const response = await authService.post(`/api/admin/categories/${selectedCategory}/filters`, requestData);

      if (response.success) {
        await fetchCategoryFilters(selectedCategory);
      } else {
        setError('Failed to assign filter: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to assign filter';
      setError(errorMessage);

    }
  };

  const handleUnassignFilter = async (categoryFilterId: string) => {
    try {
      await authService.delete(`/api/admin/category-filters/${categoryFilterId}`);
      if (selectedCategory) {
        await fetchCategoryFilters(selectedCategory);
      }
    } catch (error) {
      setError('Failed to unassign filter');
      
    }
  };

  const handleAutoAssignFilters = async () => {
    if (!selectedCategory) return;
    
    try {
      const response = await authService.post(`/api/admin/categories/${selectedCategory}/filters/auto-assign`, {
        force: true
      });
      
      if (response.success) {
        await fetchCategoryFilters(selectedCategory);
      }
    } catch (error) {
      setError('Failed to auto-assign filters');
      
    }
  };

  const resetFilterForm = () => {
    setFilterFormData({
      name: '',
      displayName: '',
      type: 'multiple',
      dataType: 'string',
      description: '',
      isActive: true,
      sortOrder: 0,
      options: []
    });
  };

  const openEditFilter = (filter: Filter) => {
    setEditingFilter(filter);
    setFilterFormData({
      name: filter.name,
      displayName: filter.displayName,
      type: filter.type,
      dataType: filter.dataType,
      description: filter.description || '',
      isActive: filter.isActive,
      sortOrder: filter.sortOrder,
      options: (filter.options || []).map(opt => ({
        value: opt.value,
        displayValue: opt.displayValue,
        colorCode: opt.colorCode || '',
        isActive: opt.isActive,
        sortOrder: opt.sortOrder
      }))
    });
    setIsFilterFormOpen(true);
  };

  const renderCategoryTree = (categories: Category[], level = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];
    
    categories.forEach(category => {
      const categoryId = category.id || category._id; // Support both id and _id
      options.push(
        <option 
          key={categoryId}
          value={categoryId}
          style={{ paddingLeft: `${level * 20}px` }}
        >
          {'—'.repeat(level)} {category.name}
        </option>
      );
      
      if (category.children && category.children.length > 0) {
        options.push(...renderCategoryTree(category.children, level + 1));
      }
    });
    
    return options;
  };

  const filteredFilters = filters.filter(filter =>
    filter.name.toLowerCase().includes(filterSearchTerm.toLowerCase()) ||
    filter.displayName.toLowerCase().includes(filterSearchTerm.toLowerCase())
  );

  const paginatedFilters = filteredFilters.slice(
    (currentFilterPage - 1) * filterPageSize,
    currentFilterPage * filterPageSize
  );

  const totalFilterPages = Math.ceil(filteredFilters.length / filterPageSize);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Filter Management</h1>
        <p className="text-gray-600">Manage filters and assign them to categories for product filtering</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          {(error.includes('Authentication') || error.includes('Session expired')) && (
            <button
              onClick={() => window.location.href = '/login'}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Login Now
            </button>
          )}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Authentication Status Check */}
      {!localStorage.getItem('adminToken') && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>You are not authenticated. Please login to create or modify filters.</span>
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="ml-4 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
          >
            Login
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('filters')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'filters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FilterIcon className="w-4 h-4 inline mr-2" />
              Filter Management
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Link className="w-4 h-4 inline mr-2" />
              Category Assignments
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'filters' && (
        <div>
          {/* Filter Management Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search filters..."
                  value={filterSearchTerm}
                  onChange={(e) => setFilterSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => {
                resetFilterForm();
                setEditingFilter(null);
                setIsFilterFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Filter
            </button>
          </div>

          {/* Filters Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Loading filters...
                    </td>
                  </tr>
                ) : paginatedFilters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No filters found
                    </td>
                  </tr>
                ) : (
                  paginatedFilters.map((filter, index) => (
                    <tr key={filter._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {((currentFilterPage - 1) * filterPageSize) + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{filter.displayName}</div>
                          <div className="text-sm text-gray-500">{filter.name}</div>
                          {filter.description && (
                            <div className="text-xs text-gray-400 mt-1">{filter.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          filter.type === 'multiple' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {filter.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {filter.dataType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {filter.options.length} options
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          filter.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {filter.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditFilter(filter)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFilter(filter._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {totalFilterPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="text-sm text-gray-700">
                Showing {((currentFilterPage - 1) * filterPageSize) + 1} to {Math.min(currentFilterPage * filterPageSize, filteredFilters.length)} of {filteredFilters.length} filters
              </div>
              
              <div className="flex items-center gap-4">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Show:</label>
                  <select
                    value={filterPageSize}
                    onChange={(e) => {
                      setFilterPageSize(Number(e.target.value));
                      setCurrentFilterPage(1);
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentFilterPage(1)}
                    disabled={currentFilterPage === 1}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    First
                  </button>
                  
                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentFilterPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentFilterPage === 1}
                    className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Page:</span>
                    <select
                      value={currentFilterPage}
                      onChange={(e) => setCurrentFilterPage(Number(e.target.value))}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[60px]"
                    >
                      {Array.from({ length: totalFilterPages }, (_, i) => i + 1).map(page => (
                        <option key={page} value={page}>
                          {page}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-600">of {totalFilterPages}</span>
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentFilterPage(prev => Math.min(prev + 1, totalFilterPages))}
                    disabled={currentFilterPage === totalFilterPages}
                    className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentFilterPage(totalFilterPages)}
                    disabled={currentFilterPage === totalFilterPages}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div>
          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a category...</option>
              {renderCategoryTree(categories)}
            </select>
          </div>

          {selectedCategory && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assigned Filters */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Assigned Filters</h3>
                  <button
                    onClick={handleAutoAssignFilters}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Auto-Assign
                  </button>
                </div>
                
                {isAssignmentLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : assignedFilters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No filters assigned to this category</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedFilters.map((categoryFilter) => (
                      <div key={categoryFilter._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                        <div>
                          <div className="font-medium text-gray-900">{categoryFilter.filter.displayName}</div>
                          <div className="text-sm text-gray-500">{categoryFilter.filter.name}</div>
                        </div>
                        <button
                          onClick={() => handleUnassignFilter(categoryFilter._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Filters */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Filters</h3>
                
                {isAssignmentLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : availableFilters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>All filters are already assigned</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableFilters.map((filter) => (
                      <div key={filter._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                        <div>
                          <div className="font-medium text-gray-900">{filter.displayName}</div>
                          <div className="text-sm text-gray-500">{filter.name}</div>
                          {filter.description && (
                            <div className="text-xs text-gray-400 mt-1">{filter.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => {

                            const filterId = filter._id || filter.id;
                            
                            handleAssignFilter(filterId);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Form Modal */}
      {isFilterFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingFilter ? 'Edit Filter' : 'Create New Filter'}
              </h2>
              <button
                onClick={() => {
                  setIsFilterFormOpen(false);
                  setEditingFilter(null);
                  resetFilterForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter Name *
                  </label>
                  <input
                    type="text"
                    value={filterFormData.name}
                    onChange={(e) => setFilterFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., storage_capacity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={filterFormData.displayName}
                    onChange={(e) => setFilterFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Storage Capacity"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter Type
                  </label>
                  <select
                    value={filterFormData.type}
                    onChange={(e) => setFilterFormData(prev => ({ ...prev, type: e.target.value as 'single' | 'multiple' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single">Single Selection</option>
                    <option value="multiple">Multiple Selection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <select
                    value={filterFormData.dataType}
                    onChange={(e) => setFilterFormData(prev => ({ ...prev, dataType: e.target.value as 'string' | 'number' | 'boolean' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={filterFormData.description}
                  onChange={(e) => setFilterFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this filter is used for..."
                />
              </div>

              {/* Filter Options Management */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter Options
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      
                      const newOption = {
                        value: '',
                        displayValue: '',
                        colorCode: '',
                        isActive: true,
                        sortOrder: filterFormData.options.length + 1
                      };
                      
                      setFilterFormData(prev => {
                        const updated = {
                          ...prev,
                          options: [...prev.options, newOption]
                        };
                        
                        return updated;
                      });
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Plus className="w-3 h-3" />
                    Add Option
                  </button>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {filterFormData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border border-gray-200 rounded-md">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Value (e.g., red)"
                          value={option.value}
                          onChange={(e) => {
                            const newOptions = [...filterFormData.options];
                            newOptions[index].value = e.target.value;
                            setFilterFormData(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Display Value (e.g., Red)"
                          value={option.displayValue}
                          onChange={(e) => {
                            const newOptions = [...filterFormData.options];
                            newOptions[index].displayValue = e.target.value;
                            setFilterFormData(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Color Code (optional)"
                          value={option.colorCode || ''}
                          onChange={(e) => {
                            const newOptions = [...filterFormData.options];
                            newOptions[index].colorCode = e.target.value;
                            setFilterFormData(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={option.isActive}
                            onChange={(e) => {
                              const newOptions = [...filterFormData.options];
                              newOptions[index].isActive = e.target.checked;
                              setFilterFormData(prev => ({ ...prev, options: newOptions }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-1 text-xs text-gray-600">Active</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            
                            const newOptions = filterFormData.options.filter((_, i) => i !== index);
                            
                            setFilterFormData(prev => {
                              const updated = { ...prev, options: newOptions };
                              
                              return updated;
                            });
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {filterFormData.options.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No options added yet. Click "Add Option" to create filter options.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={filterFormData.sortOrder}
                    onChange={(e) => setFilterFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterFormData.isActive}
                      onChange={(e) => setFilterFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setIsFilterFormOpen(false);
                  setEditingFilter(null);
                  resetFilterForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingFilter ? handleUpdateFilter : handleCreateFilter}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                {editingFilter ? 'Update Filter' : 'Create Filter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterManagement;