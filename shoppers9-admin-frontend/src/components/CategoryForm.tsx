import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  parentCategory?: string;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryFormData {
  id?: string;
  name: string;
  description: string;
  slug: string;
  image: string;
  parentCategory: string;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryFormState extends CategoryFormData {
  imageFile?: File;
  imagePreview?: string;
}

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  initialData?: Partial<CategoryFormData>;
  isEditing?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<CategoryFormState>({
    name: '',
    description: '',
    slug: '',
    image: '',
    parentCategory: '',
    isActive: true,
    sortOrder: 0,
    imageFile: undefined,
    imagePreview: undefined
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          slug: initialData.slug || '',
          image: initialData.image || '',
          parentCategory: initialData.parentCategory || '',
          isActive: initialData.isActive ?? true,
          sortOrder: initialData.sortOrder || 0,
          imageFile: undefined,
          imagePreview: initialData.image ? 
            (initialData.image.startsWith('http') ? initialData.image : `${window.location.origin}${initialData.image}`) 
            : undefined
        });
      }
    } else {
      // Reset form when modal closes
      setFormData({
        name: '',
        description: '',
        slug: '',
        image: '',
        parentCategory: '',
        isActive: true,
        sortOrder: 0,
        imageFile: undefined,
        imagePreview: undefined
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  const fetchCategories = async () => {
    try {
      const response = await authService.getAllCategories(1, 100);
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: undefined,
      imagePreview: undefined,
      image: ''
    }));
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string | boolean | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug when name changes
      if (field === 'name' && !isEditing && typeof value === 'string') {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };



  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Category name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (formData.sortOrder < 0) newErrors.sortOrder = 'Sort order cannot be negative';

    // Check for duplicate slug (simplified validation)
    const existingCategory = categories.find(cat => 
      cat.slug === formData.slug && (!isEditing || cat.id !== initialData?.id)
    );
    if (existingCategory) {
      newErrors.slug = 'This slug is already in use';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('slug', formData.slug);
      submitData.append('parentCategory', formData.parentCategory);
      submitData.append('isActive', formData.isActive.toString());
      submitData.append('sortOrder', formData.sortOrder.toString());
      
      // Add image file if selected, otherwise add existing image URL
      if (formData.imageFile) {
        submitData.append('image', formData.imageFile);
      } else if (formData.image) {
        submitData.append('image', formData.image);
      }
      
      await onSubmit(submitData as any);
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        slug: '',
        image: '',
        parentCategory: '',
        isActive: true,
        sortOrder: 0,
        imageFile: undefined,
        imagePreview: undefined
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter category name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={formData?.slug || ''}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="category-slug"
              />
              {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
              <p className="text-xs text-gray-500 mt-1">URL-friendly version of the name</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData?.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter category description"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Image and Parent Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Image
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Upload an image for the category. Maximum file size: 10MB. Supported formats: JPG, PNG, WebP.
                </p>
                
                {/* Image Preview */}
                {formData.imagePreview && (
                  <div className="relative">
                    <img
                      src={formData.imagePreview}
                      alt="Category preview"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category
              </label>
              <select
                value={formData?.parentCategory || ''}
                onChange={(e) => handleInputChange('parentCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Parent (Top Level)</option>
                {categories
                  .filter(cat => !isEditing || cat.id !== initialData?.id)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Sort Order and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <input
                type="number"
                min="0"
                value={formData?.sortOrder || 0}
                onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sortOrder ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.sortOrder && <p className="text-red-500 text-sm mt-1">{errors.sortOrder}</p>}
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>



          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;