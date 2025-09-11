import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Tag,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  parentCategory?: string | { id: string; name: string; level: number };
  level: 1 | 2 | 3;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

interface CategoryFormData {
  name: string;
  description: string;
  parentCategory: string;
  level: 1 | 2 | 3;
  isActive: boolean;
  sortOrder: number;
  image?: string;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parentCategory: '',
    level: 1,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    fetchCategoryTree();
  }, []);

  const sortCategoriesByStatus = (categories: Category[]): Category[] => {
    return categories.map(category => ({
      ...category,
      children: category.children ? sortCategoriesByStatus(category.children) : undefined
    })).sort((a, b) => {
      // Sort by isActive first (active categories first), then by sortOrder, then by name
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const fetchCategoryTree = async () => {
    try {
      setIsLoading(true);
      const response = await authService.get('/api/admin/categories/tree');
      // Handle the backend response format: {success: true, data: {categories: [...]}}
      const categoryData = response.data;
      let rawCategories: any[] = [];
      if (categoryData && categoryData.success && categoryData.data && Array.isArray(categoryData.data.categories)) {
        rawCategories = categoryData.data.categories;
      } else if (categoryData && categoryData.success && Array.isArray(categoryData.data)) {
        rawCategories = categoryData.data;
      } else if (Array.isArray(categoryData)) {
        rawCategories = categoryData;
      }
      
      // Map API response to match interface (backend already converts _id to id)
      const mapCategory = (cat: any): Category => ({
        id: cat.id, // Backend already provides id field
        name: cat.name,
        description: cat.description,
        slug: cat.slug,
        image: cat.image,
        parentCategory: cat.parentCategory,
        level: cat.level,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        children: cat.children ? cat.children.map(mapCategory) : []
      });
      
      const categories: Category[] = rawCategories.map(mapCategory);
      // Sort categories to show active ones first
      const sortedCategories = sortCategoriesByStatus(categories);
      setCategories(sortedCategories);
    } catch (err) {
      
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]); // Ensure categories is always an array
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const openForm = (parent?: Category, editing?: Category) => {
    if (editing) {
      setEditingCategory(editing);
      // Handle parentCategory - extract ID if it's an object
      let parentCategoryId = '';
      if (editing.parentCategory) {
        if (typeof editing.parentCategory === 'object' && 'id' in editing.parentCategory) {
          parentCategoryId = (editing.parentCategory as any).id;
        } else if (typeof editing.parentCategory === 'string') {
          parentCategoryId = editing.parentCategory;
        }
      }
      
      setFormData({
        name: editing.name,
        description: editing.description || '',
        parentCategory: parentCategoryId,
        level: editing.level,
        isActive: editing.isActive,
        sortOrder: editing.sortOrder
      });
    } else {
      setEditingCategory(null);
      setSelectedParent(parent || null);
      setFormData({
        name: '',
        description: '',
        parentCategory: parent?.id || '',
        level: parent ? (parent.level + 1 as 1 | 2 | 3) : 1,
        isActive: true,
        sortOrder: 0
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setSelectedParent(null);
    setFormData({
      name: '',
      description: '',
      parentCategory: '',
      level: 1,
      isActive: true,
      sortOrder: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await authService.put(`/api/admin/categories/${editingCategory.id}`, formData);
      } else {
        await authService.post('/api/admin/categories', formData);
      }
      await fetchCategoryTree();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  const handleDelete = async (category: Category) => {
    const hasChildren = category.children && category.children.length > 0;
    const confirmMessage = hasChildren 
      ? `⚠️ WARNING: Are you sure you want to delete "${category.name}"?\n\nThis will permanently delete:\n• The category "${category.name}"\n• All ${category.children!.length} subcategories\n• All products in these categories\n\nThis action CANNOT be undone!`
      : `Are you sure you want to delete the category "${category.name}"?\n\nThis will permanently delete the category and all its products.\n\nThis action CANNOT be undone!`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      await authService.delete(`/api/admin/categories/${category.id}`);
      await fetchCategoryTree();
      // Show success message
      setError(null);
    } catch (err) {
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      setError(`Delete failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      await authService.put(`/api/admin/categories/${category.id}/status`, { isActive: !category.isActive });
      await fetchCategoryTree();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category status');
    }
  };

  const renderCategoryIcon = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    if (category.level === 1) {
      return hasChildren ? (
        isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />
      ) : (
        <Folder className="w-4 h-4" />
      );
    } else {
      return <Tag className="w-4 h-4" />;
    }
  };

  const renderCategory = (category: Category, depth: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const paddingLeft = depth * 24;

    return (
      <div key={category.id} className="border-b border-gray-100">
        <div 
          className="flex items-center justify-between p-3 hover:bg-gray-50"
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            {renderCategoryIcon(category)}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{category.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  category.level === 1 ? 'bg-blue-100 text-blue-800' :
                  category.level === 2 ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  Level {category.level}
                </span>
                {!category.isActive && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleStatus(category)}
              className={`p-2 rounded-lg transition-colors ${
                category.isActive
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-red-600 hover:bg-red-50'
              }`}
              title={category.isActive ? 'Deactivate' : 'Activate'}
            >
              {category.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            
            {category.level <= 2 && (
              <button
                onClick={() => openForm(category)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={`Add ${category.level === 1 ? 'Subcategory' : 'Sub-Subcategory'}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => openForm(undefined, category)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleDelete(category)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {category.children!.map(child => (
              <React.Fragment key={child.id}>
                {renderCategory(child, depth + 1)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your three-level category hierarchy: Categories → Subcategories → Sub-Subcategories
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Category Tree */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Category Hierarchy</h2>
        </div>
        
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No categories found. Create your first category to get started.</p>
          </div>
        ) : (
          <div>
            {categories.map(category => (
              <React.Fragment key={category.id}>
                {renderCategory(category, 0)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
                {selectedParent && (
                  <span className="text-sm font-normal text-gray-600 block">
                    Under: {selectedParent.name}
                  </span>
                )}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData?.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData?.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <div className={`px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 ${
                  formData.level === 1 ? 'text-blue-800' :
                  formData.level === 2 ? 'text-green-800' :
                  'text-purple-800'
                }`}>
                  Level {formData.level} - {
                    formData.level === 1 ? 'Category' :
                    formData.level === 2 ? 'Subcategory' :
                    'Sub-Subcategory'
                  }
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData?.sortOrder || 0}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCategory ? 'Update' : 'Create'}</span>
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;