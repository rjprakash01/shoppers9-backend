import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  ArrowLeft,
  Palette
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

interface FilterOption {
  _id: string;
  filter: string;
  value: string;
  displayValue: string;
  colorCode?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Filter {
  _id: string;
  name: string;
  displayName: string;
  type: 'single' | 'multiple';
  dataType: 'string' | 'number' | 'boolean';
  options: FilterOption[];
}

interface FilterOptionFormData {
  value: string;
  displayValue: string;
  colorCode: string;
  isActive: boolean;
  sortOrder: number;
}

const FilterOptionManagement: React.FC = () => {
  const { filterId } = useParams<{ filterId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter | null>(null);
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<FilterOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FilterOptionFormData>({
    value: '',
    displayValue: '',
    colorCode: '',
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    if (filterId) {
      fetchFilter();
      fetchFilterOptions();
    }
  }, [filterId]);

  const fetchFilter = async () => {
    try {
      const response = await authService.get(`/admin/filters/${filterId}`);
      setFilter(response.data);
      setError(null);
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch filter details';
      setError(errorMessage);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.get(`/admin/filter-options/filter/${filterId}`);

      // Handle the backend response format: {success: true, data: {filter, options, pagination}}
      if (response.success && response.data && Array.isArray(response.data.options)) {
        
        setOptions(response.data.options);
      } else if (Array.isArray(response.data)) {
        
        setOptions(response.data);
      } else {
        
        setOptions([]);
      }
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch filter options';
      setError(errorMessage);
      setOptions([]);
      
      // If it's an authentication error, show a more specific message
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FilterOptionFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        filter: filterId
      };

      if (editingOption) {
        await authService.put(`/admin/filter-options/${editingOption._id}`, submitData);
      } else {
        await authService.post('/admin/filter-options', submitData);
      }

      await fetchFilterOptions();
      handleCloseForm();
    } catch (error) {
      
      alert('Error saving filter option. Please try again.');
    }
  };

  const handleEdit = (option: FilterOption) => {
    setEditingOption(option);
    setFormData({
      value: option.value,
      displayValue: option.displayValue,
      colorCode: option.colorCode || '',
      isActive: option.isActive,
      sortOrder: option.sortOrder
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (optionId: string) => {
    if (!confirm('Are you sure you want to delete this filter option?')) return;
    
    try {
      await authService.delete(`/admin/filter-options/${optionId}`);
      await fetchFilterOptions();
    } catch (error) {
      
      alert('Error deleting filter option. Please try again.');
    }
  };

  const handleToggleStatus = async (optionId: string, currentStatus: boolean) => {
    try {
      await authService.put(`/admin/filter-options/${optionId}`, {
        isActive: !currentStatus
      });
      await fetchFilterOptions();
    } catch (error) {
      
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOption(null);
    setFormData({
      value: '',
      displayValue: '',
      colorCode: '',
      isActive: true,
      sortOrder: 0
    });
  };

  const handleAddNew = () => {
    setEditingOption(null);
    setFormData({
      value: '',
      displayValue: '',
      colorCode: '',
      isActive: true,
      sortOrder: options.length
    });
    setIsFormOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button
            onClick={() => {
              setError(null);
              if (filterId) {
                fetchFilter();
                fetchFilterOptions();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!filter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading filter...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Manage Options: {filter.displayName}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Filter: {filter.name} • Type: {filter.type} • Data Type: {filter.dataType}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddNew}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading options...</div>
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No filter options found for this filter</div>
              <div className="text-sm text-gray-400 mb-6">
                Filter ID: {filterId}<br/>
                Filter Name: {filter.name}<br/>
                This filter currently has no options configured.
              </div>
              <button
                onClick={handleAddNew}
                className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Option
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {options.map((option) => (
                <div key={option._id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{option.displayValue}</h3>
                        {option.colorCode && (
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: option.colorCode }}
                            title={option.colorCode}
                          />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Value: {option.value}</p>
                      <p className="text-sm text-gray-500">Sort: {option.sortOrder}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(option)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit Option"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(option._id, option.isActive)}
                        className={`p-1 ${
                          option.isActive
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                        title={option.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {option.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(option._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete Option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      option.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {option.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Option Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingOption ? 'Edit Filter Option' : 'Add New Filter Option'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value *
                </label>
                <input
                  type="text"
                  value={formData?.value || ''}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., red, large, xl"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Value *
                </label>
                <input
                  type="text"
                  value={formData?.displayValue || ''}
                  onChange={(e) => handleInputChange('displayValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Red, Large, XL"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Code
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.colorCode || '#000000'}
                    onChange={(e) => handleInputChange('colorCode', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData?.colorCode || ''}
                    onChange={(e) => handleInputChange('colorCode', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000 (optional)"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Optional: For color-based filters
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingOption ? 'Update' : 'Create'} Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterOptionManagement;