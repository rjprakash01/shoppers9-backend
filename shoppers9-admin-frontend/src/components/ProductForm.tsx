import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import {
  Save,
  X,
  Plus,
  Minus,
  Upload,
  Image as ImageIcon,
  Package,
  Tag,
  DollarSign,
  Filter as FilterIcon
} from 'lucide-react';

interface Category {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  level: number;
  parentCategory?: string | { id?: string; _id?: string; name?: string };
  isActive: boolean;
  children: Category[];
}

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
}

interface FilterOption {
  _id: string;
  id?: string;
  filter: string;
  value: string;
  displayValue: string;
  colorCode?: string;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryFilter {
  _id: string;
  category: string;
  filter: Filter;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface ProductFilterValue {
  filterId: string;
  filterOptionId?: string;
  customValue?: string;
}

interface ProductVariant {
  id?: string;
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  originalPrice: number;
  stock: number;
  sku: string; // Unique SKU for this variant
  images: string[];
}

// Keep the old interfaces for backward compatibility
interface ProductSize {
  size: string;
  price: number;
  originalPrice: number;
  stock: number;
}

// Available colors and sizes for the product
interface ProductColor {
  name: string;
  code: string;
  images: string[];  // Color-specific images
}

interface ProductSizeOption {
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  subCategory: string;
  subSubCategory?: string;
  brand: string;
  stock: number;
  images: string[];
  features: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  filterValues: ProductFilterValue[];
  displayFilters: string[];
  variants: ProductVariant[];
  availableColors: ProductColor[];
  availableSizes: ProductSizeOption[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  submissionNotes?: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: Partial<ProductFormData>;
  isEditing?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: '',
    subCategory: '',
    subSubCategory: '',
    brand: '',
    stock: 0,
    images: [],
    features: [''],
    tags: [''],
    isActive: true,
    isFeatured: false,
    isTrending: false,
    filterValues: [],
    displayFilters: [],
    variants: [],
    availableColors: [],
    availableSizes: [],
    approvalStatus: 'pending',
    submissionNotes: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<Category[]>([]);
  const [availableFilters, setAvailableFilters] = useState<CategoryFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUploadError, setImageUploadError] = useState<string>('');

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          price: initialData.price || 0,
          originalPrice: initialData.originalPrice || 0,
          category: initialData.category || '',
          subCategory: initialData.subCategory || '',
          subSubCategory: initialData.subSubCategory || '',
          brand: initialData.brand || '',
          stock: initialData.stock || 0,
          images: initialData.images || [],
          features: initialData.features || [''],
          tags: initialData.tags || [''],
          isActive: initialData.isActive !== undefined ? initialData.isActive : true,
          isFeatured: initialData.isFeatured || false,
          isTrending: initialData.isTrending || false,
          filterValues: initialData.filterValues || [],
          displayFilters: initialData.displayFilters || [],
          variants: initialData.variants || [],
          availableColors: initialData.availableColors || [],
          availableSizes: initialData.availableSizes || [],
          approvalStatus: initialData.approvalStatus || 'pending',
          submissionNotes: initialData.submissionNotes || ''
        });
      }
    } else {
      resetForm();
    }
  }, [isOpen, initialData]);

  // Fetch available filters when category selection changes
  useEffect(() => {

    if (categories.length === 0) {
      
      return;
    }

    const categoryToCheck = formData.subSubCategory || formData.subCategory || formData.category;

    if (categoryToCheck) {
      
      fetchAvailableFilters(categoryToCheck);
    } else {
      
      setAvailableFilters([]);
    }
  }, [formData.category, formData.subCategory, formData.subSubCategory, categories]);

  // Update category hierarchy when categories change
  useEffect(() => {
    if (categories.length > 0) {
      const mainCats = categories.filter(cat => cat.level === 1);
      setMainCategories(mainCats);
      
    }
  }, [categories]);

  const fetchCategories = async () => {
    try {
      console.log('=== PRODUCT FORM: Fetching categories ===');
      console.log('Auth token:', localStorage.getItem('adminToken') ? 'Present' : 'Missing');
      console.log('API URL:', import.meta.env.VITE_API_URL);
      
      const response = await authService.getCategoryTree();
      console.log('Categories response:', response);
      console.log('Response success:', response.success);
      console.log('Response data type:', typeof response.data);
      console.log('Response data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');

      if (!response.success) {
        console.error('API returned success: false', response.message);
        setCategories([]);
        return;
      }

      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response data format:', response.data);
        setCategories([]);
        return;
      }

      const flattenCategories = (categories: any[]): Category[] => {
        let flattened: Category[] = [];
        
        categories.forEach(category => {
          const flatCategory: Category = {
            id: category._id || category.id,
            _id: category._id || category.id,
            name: category.name,
            slug: category.slug,
            level: category.level,
            parentCategory: category.parentCategory?._id || category.parentCategory?.id || null,
            isActive: category.isActive,
            children: []
          };
          
          flattened.push(flatCategory);
          
          if (category.children && category.children.length > 0) {
            const childrenFlattened = flattenCategories(category.children);
            flattened = flattened.concat(childrenFlattened);
          }
        });
        
        return flattened;
      };
      
      const flatCategories = flattenCategories(response.data);
      console.log('Flattened categories count:', flatCategories.length);
      console.log('Main categories (level 1):', flatCategories.filter(cat => cat.level === 1));
      
      setCategories(flatCategories);
    } catch (error) {
      console.error('=== PRODUCT FORM: Error fetching categories ===', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', (error as any).response);
        console.error('Error status:', (error as any).response?.status);
        console.error('Error data:', (error as any).response?.data);
      }
      setCategories([]);
    }
  };

  const fetchAvailableFilters = async (categoryId: string) => {
    try {
      console.log('Fetching filters for category:', categoryId);
      const filtersResponse = await authService.get(`/admin/categories/${categoryId}/filters`);
      console.log('Filters response:', filtersResponse);

      if (filtersResponse.success && filtersResponse.data && filtersResponse.data.categoryFilters) {
        console.log('Setting available filters:', filtersResponse.data.categoryFilters);
        setAvailableFilters(filtersResponse.data.categoryFilters);
        
        filtersResponse.data.categoryFilters.forEach((categoryFilter: CategoryFilter, index: number) => {
          console.log(`Filter ${index}:`, categoryFilter);
        });
      } else {
        console.log('No filters found for category');
        setAvailableFilters([]);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
      setAvailableFilters([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      originalPrice: 0,
      category: '',
      subCategory: '',
      subSubCategory: '',
      brand: '',
      stock: 0,
      images: [],
      features: [''],
      tags: [''],
      isActive: true,
      isFeatured: false,
      isTrending: false,
      filterValues: [],
      displayFilters: [],
      variants: [],
      availableColors: [],
      availableSizes: [],
      approvalStatus: 'pending',
      submissionNotes: ''
    });
    setErrors({});
    setSubCategories([]);
    setSubSubCategories([]);
    setAvailableFilters([]);
  };

  const getParentCategoryId = (parentCategory: string | { id?: string; _id?: string; name?: string } | undefined): string | undefined => {
    if (typeof parentCategory === 'string') return parentCategory;
    return parentCategory?.id || parentCategory?._id;
  };

  const filterCategoriesByParent = (level: number, parentId: string) => {
    return categories.filter(cat => {
      const catParentId = getParentCategoryId(cat.parentCategory);
      return cat.level === level && catParentId === parentId;
    });
  };

  const handleMainCategoryChange = (categoryId: string) => {

    if (categoryId) {
      const subCats = filterCategoriesByParent(2, categoryId);
      setSubCategories(subCats);
      
    } else {
      setSubCategories([]);
    }
    
    setSubSubCategories([]);
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      subCategory: '',
      subSubCategory: ''
    }));
  };

  const handleSubCategoryChange = (categoryId: string) => {

    if (categoryId) {
      const subSubCats = filterCategoriesByParent(3, categoryId);
      setSubSubCategories(subSubCats);
      
    } else {
      setSubSubCategories([]);
    }
    
    setFormData(prev => ({
      ...prev,
      subCategory: categoryId,
      subSubCategory: ''
    }));
  };

  const handleSubSubCategoryChange = (categoryId: string) => {
    
    setFormData(prev => ({
      ...prev,
      subSubCategory: categoryId
    }));
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFilterValueChange = (filterId: string, filterOptionId?: string, customValue?: string) => {
    const filter = availableFilters.find(cf => cf.filter._id === filterId);
    
    if (filter?.filter.type === 'single') {
      const newFilterValues = formData.filterValues.filter(fv => fv.filterId !== filterId);
      
      if (filterOptionId || customValue) {
        newFilterValues.push({
          filterId,
          filterOptionId,
          customValue
        });
      }
      
      setFormData(prev => ({ ...prev, filterValues: newFilterValues }));
    } else {
      const existingValues = formData.filterValues.filter(fv => fv.filterId === filterId);
      const alreadyExists = existingValues.some(fv => fv.filterOptionId === filterOptionId);
      
      if (!alreadyExists && (filterOptionId || customValue)) {
        const newFilterValue = {
          filterId,
          filterOptionId,
          customValue
        };
        
        setFormData(prev => ({
          ...prev,
          filterValues: [...prev.filterValues, newFilterValue]
        }));
      }
    }
  };

  const handleFilterValueRemove = (filterId: string, filterOptionId?: string) => {
    const newFilterValues = formData.filterValues.filter(fv => 
      !(fv.filterId === filterId && fv.filterOptionId === filterOptionId)
    );
    
    setFormData(prev => ({ ...prev, filterValues: newFilterValues }));
  };

  const getFilterValue = (filterId: string) => {
    return formData.filterValues.find(fv => fv.filterId === filterId);
  };

  const getMultipleFilterValues = (filterId: string) => {
    return formData.filterValues.filter(fv => fv.filterId === filterId);
  };

  const handleDisplayFilterToggle = (filterId: string) => {
    const isCurrentlyDisplayed = formData.displayFilters.includes(filterId);
    if (isCurrentlyDisplayed) {
      setFormData(prev => ({
        ...prev,
        displayFilters: prev.displayFilters.filter(id => id !== filterId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        displayFilters: [...prev.displayFilters, filterId]
      }));
    }
  };

  // Old image upload functions removed - now using color-specific images

  // Color and Size management functions
  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      availableColors: [...prev.availableColors, {
        name: '',
        code: '#000000',
        images: []
      }]
    }));
  };

  // Color image management with compression
  const handleColorImageUpload = (colorIndex: number, files: FileList) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        setImageUploadError(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setImageUploadError(`File ${file.name} is not an image.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    validFiles.forEach(file => {
      // Create canvas for image compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxDimension = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        
        setFormData(prev => ({
          ...prev,
          availableColors: prev.availableColors.map((color, i) => 
            i === colorIndex 
              ? { ...color, images: [...color.images, compressedBase64] }
              : color
          )
        }));
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    setImageUploadError('');
  };

  const removeColorImage = (colorIndex: number, imageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.map((color, i) => 
        i === colorIndex 
          ? { ...color, images: color.images.filter((_, j) => j !== imageIndex) }
          : color
      )
    }));
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      availableSizes: [...prev.availableSizes, {
        name: ''
      }]
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.filter((_, i) => i !== index),
      variants: prev.variants.filter(variant => variant.color !== prev.availableColors[index]?.name)
    }));
  };

  const removeSizeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availableSizes: prev.availableSizes.filter((_, i) => i !== index),
      variants: prev.variants.filter(variant => variant.size !== prev.availableSizes[index]?.name)
    }));
  };

  const updateColor = (index: number, field: keyof ProductColor, value: string) => {
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.map((color, i) => 
        i === index ? { ...color, [field]: value } : color
      )
    }));
  };

  const updateSizeOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      availableSizes: prev.availableSizes.map((size, i) => 
        i === index ? { ...size, name: value } : size
      )
    }));
  };

  // Variant management functions
  const addVariant = () => {
    const newVariant: ProductVariant = {
      color: '',
      colorCode: '#000000',
      size: '',
      price: 0,
      originalPrice: 0,
      stock: 0,
      sku: '', // Auto-generate or let user input
      images: []
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setFormData(prev => {
      const updatedVariants = prev.variants.map((variant, i) => {
        if (i === index) {
          const updatedVariant = { ...variant, [field]: value };
          
          // If color is being updated, automatically assign images from that color
          if (field === 'color') {
            const selectedColor = prev.availableColors.find(color => color.name === value);
            if (selectedColor) {
              updatedVariant.images = selectedColor.images;
              updatedVariant.colorCode = selectedColor.code;
            }
          }
          
          return updatedVariant;
        }
        return variant;
      });
      
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Old size management functions removed - now using individual color-size combinations

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subCategory) newErrors.subCategory = 'Sub category is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (formData.price <= 0) newErrors.price = 'Selling price must be greater than 0';
    if (formData.originalPrice <= 0) newErrors.originalPrice = 'Original price must be greater than 0';
    if (formData.originalPrice < formData.price) newErrors.originalPrice = 'Original price must be greater than or equal to selling price';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';

    // Validate variants if they exist
    formData.variants.forEach((variant, vIndex) => {
      if (!variant.color.trim()) {
        newErrors[`variant_${vIndex}_color`] = 'Color is required';
      }
      if (!variant.size.trim()) {
        newErrors[`variant_${vIndex}_size`] = 'Size is required';
      }
      if (variant.price <= 0) {
        newErrors[`variant_${vIndex}_price`] = 'Selling price must be greater than 0';
      }
      if (variant.originalPrice <= 0) {
        newErrors[`variant_${vIndex}_originalPrice`] = 'Original price must be greater than 0';
      }
      if (variant.originalPrice < variant.price) {
        newErrors[`variant_${vIndex}_originalPrice`] = 'Original price must be greater than or equal to selling price';
      }
      if (variant.stock < 0) {
        newErrors[`variant_${vIndex}_stock`] = 'Stock cannot be negative';
      }
      if (!variant.sku || !variant.sku.trim()) {
        newErrors[`variant_${vIndex}_sku`] = 'SKU is required';
      }
    });
    
    // Check for duplicate SKUs
    const skus = formData.variants.map(v => v.sku).filter(sku => sku.trim());
    const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index);
    if (duplicateSkus.length > 0) {
      formData.variants.forEach((variant, vIndex) => {
        if (duplicateSkus.includes(variant.sku)) {
          newErrors[`variant_${vIndex}_sku`] = 'SKU must be unique';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      
      return;
    }

    try {
      setIsLoading(true);
      
      // Create FormData object for submission
      const submitData = new FormData();
      
      // Add basic product data (exclude availableColors and availableSizes as they're frontend-only)
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'availableColors' || key === 'availableSizes') {
          // Skip these fields - they're only for frontend management
          return;
        } else if (key === 'variants' || key === 'filterValues' || key === 'displayFilters' || key === 'features' || key === 'tags') {
          submitData.append(key, JSON.stringify(value));
        } else if (key === 'images') {
          // Handle images separately - they're already base64 strings from FileReader
          submitData.append(key, JSON.stringify(value));
        } else {
          submitData.append(key, value.toString());
        }
      });

      await onSubmit(submitData);
      
      if (!isEditing) {
        resetForm();
      }
      onClose();
    } catch (error) {
      
      setErrors({ submit: 'Failed to save product. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column - Main Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Category Selection */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Category Selection
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Main Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleMainCategoryChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.category ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Main Category</option>
                        {mainCategories.map((category) => (
                          <option key={category.id || category._id} value={category.id || category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub Category *
                      </label>
                      <select
                        value={formData.subCategory}
                        onChange={(e) => handleSubCategoryChange(e.target.value)}
                        disabled={!formData.category}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.subCategory ? 'border-red-500' : 'border-gray-300'
                        } ${!formData.category ? 'bg-gray-100' : ''}`}
                      >
                        <option value="">{!formData.category ? 'Please select a main category first' : 'Select Sub Category'}</option>
                        {subCategories.map((category) => (
                          <option key={category.id || category._id} value={category.id || category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.subCategory && <p className="text-red-500 text-sm mt-1">{errors.subCategory}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub-Sub Category
                      </label>
                      <select
                        value={formData.subSubCategory || ''}
                        onChange={(e) => handleSubSubCategoryChange(e.target.value)}
                        disabled={!formData.subCategory}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.subSubCategory ? 'border-red-500' : 'border-gray-300'
                        } ${!formData.subCategory ? 'bg-gray-100' : ''}`}
                      >
                        <option value="">{!formData.subCategory ? 'Select sub category first' : 'Select Sub-Sub Category (Optional)'}</option>
                        {subSubCategories.map((category) => (
                          <option key={category.id || category._id} value={category.id || category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.subSubCategory && <p className="text-red-500 text-sm mt-1">{errors.subSubCategory}</p>}
                    </div>
                  </div>
                </div>

                {/* Basic Product Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter product name"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand *
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.brand ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter brand name"
                      />
                      {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter detailed product description"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission Notes
                    </label>
                    <textarea
                      value={formData.submissionNotes}
                      onChange={(e) => handleInputChange('submissionNotes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Add any notes for the admin review process (optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1">These notes will be visible to admins during the review process</p>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pricing & Inventory
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price * <span className="text-xs text-gray-500">(Before Discount - Higher Price)</span>
                      </label>
                      <input
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.originalPrice ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter the original price before any discount</p>
                      {errors.originalPrice && <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selling Price * <span className="text-xs text-gray-500">(After Discount - Lower Price)</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter the current selling price (discounted price)</p>
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.stock ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0"
                        min="0"
                      />
                      {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                    </div>
                  </div>
                </div>

                {/* Available Colors Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Available Colors
                    </h3>
                    <button
                      type="button"
                      onClick={addColor}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Color
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Define the available colors for this product.
                  </p>

                  {formData.availableColors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No colors added yet. Click "Add Color" to define available colors.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.availableColors.map((color, cIndex) => (
                        <div key={cIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-3 gap-3 items-end mb-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Color Name *
                              </label>
                              <input
                                type="text"
                                value={color.name}
                                onChange={(e) => updateColor(cIndex, 'name', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm border-gray-300"
                                placeholder="e.g., Red, Blue, Black"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Color Code
                              </label>
                              <input
                                type="color"
                                value={color.code}
                                onChange={(e) => updateColor(cIndex, 'code', e.target.value)}
                                className="w-full h-8 border rounded"
                              />
                            </div>
                            
                            <div>
                              <button
                                type="button"
                                onClick={() => removeColor(cIndex)}
                                className="w-full px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                              >
                                <Minus className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Color Images Section */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Color Images (up to 6 images)
                            </label>
                            
                            {/* Image Upload */}
                            <div className="mb-3">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => e.target.files && handleColorImageUpload(cIndex, e.target.files)}
                                className="hidden"
                                id={`color-images-${cIndex}`}
                              />
                              <label
                                htmlFor={`color-images-${cIndex}`}
                                className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                              >
                                <div className="text-center">
                                  <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                                  <p className="text-xs text-gray-500">Click to upload images (Max 5MB each)</p>
                                </div>
                              </label>
                              {imageUploadError && (
                                <p className="text-red-500 text-xs mt-1">{imageUploadError}</p>
                              )}
                            </div>
                            
                            {/* Display uploaded images */}
                            {color.images.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                {color.images.map((image, imgIndex) => (
                                  <div key={imgIndex} className="relative group">
                                    <img
                                      src={image}
                                      alt={`${color.name} ${imgIndex + 1}`}
                                      className="w-full h-16 object-cover rounded border"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeColorImage(cIndex, imgIndex)}
                                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Sizes Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Available Sizes
                    </h3>
                    <button
                      type="button"
                      onClick={addSize}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Size
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Define the available sizes for this product.
                  </p>

                  {formData.availableSizes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No sizes added yet. Click "Add Size" to define available sizes.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {formData.availableSizes.map((size, sIndex) => (
                        <div key={sIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <input
                            type="text"
                            value={size.name}
                            onChange={(e) => updateSizeOption(sIndex, e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm border-gray-300"
                            placeholder="e.g., S, M, L"
                          />
                          <button
                            type="button"
                            onClick={() => removeSizeOption(sIndex)}
                            className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Variants Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Color-Size Combinations
                    </h3>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Combination
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Create specific color-size combinations with individual pricing and stock levels.
                  </p>

                  {formData.variants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No combinations added yet. Click "Add Combination" to create color-size combinations.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.variants.map((variant, vIndex) => (
                        <div key={vIndex} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">Combination {vIndex + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeVariant(vIndex)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color *
                              </label>
                              <select
                                value={variant.color}
                                onChange={(e) => updateVariant(vIndex, 'color', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`variant_${vIndex}_color`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              >
                                <option value="">Select Color</option>
                                {formData.availableColors.map((color, cIndex) => (
                                  <option key={cIndex} value={color.name}>{color.name}</option>
                                ))}
                              </select>
                              {errors[`variant_${vIndex}_color`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`variant_${vIndex}_color`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Size *
                              </label>
                              <select
                                value={variant.size}
                                onChange={(e) => updateVariant(vIndex, 'size', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`variant_${vIndex}_size`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              >
                                <option value="">Select Size</option>
                                {formData.availableSizes.map((size, sIndex) => (
                                  <option key={sIndex} value={size.name}>{size.name}</option>
                                ))}
                              </select>
                              {errors[`variant_${vIndex}_size`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`variant_${vIndex}_size`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selling Price * <span className="text-xs text-gray-500">(Discounted)</span>
                              </label>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) => updateVariant(vIndex, 'price', parseFloat(e.target.value) || 0)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`variant_${vIndex}_price`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                              <p className="text-xs text-gray-500 mt-1">Current selling price for this variant</p>
                              {errors[`variant_${vIndex}_price`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`variant_${vIndex}_price`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Original Price * <span className="text-xs text-gray-500">(Before Discount)</span>
                              </label>
                              <input
                                type="number"
                                value={variant.originalPrice}
                                onChange={(e) => updateVariant(vIndex, 'originalPrice', parseFloat(e.target.value) || 0)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`variant_${vIndex}_originalPrice`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                              <p className="text-xs text-gray-500 mt-1">Original price before discount for this variant</p>
                              {errors[`variant_${vIndex}_originalPrice`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`variant_${vIndex}_originalPrice`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock *
                              </label>
                              <input
                                type="number"
                                value={variant.stock}
                                onChange={(e) => updateVariant(vIndex, 'stock', parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`variant_${vIndex}_stock`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0"
                                min="0"
                              />
                              {errors[`variant_${vIndex}_stock`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`variant_${vIndex}_stock`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                SKU *
                              </label>
                              <input
                                type="text"
                                value={variant.sku || ''}
                                onChange={(e) => updateVariant(vIndex, 'sku', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`variant_${vIndex}_sku`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="SKU-001"
                              />
                              {errors[`variant_${vIndex}_sku`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`variant_${vIndex}_sku`]}</p>
                              )}
                            </div>
                            
                            <div className="flex items-end">
                              <div
                                className="w-8 h-8 rounded border-2 border-gray-300"
                                style={{ backgroundColor: variant.colorCode || '#000000' }}
                                title={`${variant.color} (${variant.colorCode})`}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column - Filters & Settings */}
              <div className="space-y-6">
                
                {/* Product Filters */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FilterIcon className="w-5 h-5" />
                    Product Filters
                  </h3>
                  
                  {availableFilters.length > 0 ? (
                    <div className="space-y-4">
                      {availableFilters.filter(categoryFilter => categoryFilter && categoryFilter.filter && categoryFilter._id).map((categoryFilter) => (
                        <div key={categoryFilter._id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                              {categoryFilter.filter.displayName}
                              {categoryFilter.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <label className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={formData.displayFilters.includes(categoryFilter.filter._id)}
                                onChange={() => handleDisplayFilterToggle(categoryFilter.filter._id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-gray-600">Show on product page</span>
                            </label>
                          </div>
                          
                          {categoryFilter.filter.type === 'single' ? (
                            categoryFilter.filter.dataType === 'string' && categoryFilter.filter.options && categoryFilter.filter.options.length > 0 ? (
                              <div>
                                <select
                                  value={getFilterValue(categoryFilter.filter._id)?.filterOptionId || ''}
                                  onChange={(e) => handleFilterValueChange(categoryFilter.filter._id, e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors[`filter_${categoryFilter.filter._id}`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">Select {categoryFilter.filter.displayName}</option>
                                  {(categoryFilter.filter.options || []).filter(option => option && (option._id || option.id)).map((option, optionIndex) => {
                                    const optionId = option._id || option.id;
                                    return (
                                      <option key={`${optionId}-${optionIndex}`} value={optionId}>
                                        {option.displayValue}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            ) : (
                              <input
                                type={categoryFilter.filter.dataType === 'number' ? 'number' : 'text'}
                                value={getFilterValue(categoryFilter.filter._id)?.customValue || ''}
                                onChange={(e) => handleFilterValueChange(categoryFilter.filter._id, undefined, e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`filter_${categoryFilter.filter._id}`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder={`Enter ${categoryFilter.filter.displayName.toLowerCase()}`}
                              />
                            )
                          ) : (
                            <div>
                              {/* Enhanced Color Filter Display */}
                              {categoryFilter.filter.name.toLowerCase().includes('color') ? (
                                <div className="space-y-3">
                                  <p className="text-xs text-gray-600 mb-2">💡 Select multiple colors for this product</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                                    {(categoryFilter.filter.options || []).filter(option => option && (option._id || option.id)).map((option, optionIndex) => {
                                      const filterValues = getMultipleFilterValues(categoryFilter.filter._id);
                                      const optionId = option._id || option.id;
                                      const isChecked = filterValues.some(fv => fv.filterOptionId === optionId);
                                      const uniqueKey = `${categoryFilter.filter._id}-${optionId}-${optionIndex}`;
                                      
                                      return (
                                        <label key={uniqueKey} className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                          isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                handleFilterValueChange(categoryFilter.filter._id, optionId);
                                              } else {
                                                handleFilterValueRemove(categoryFilter.filter._id, optionId);
                                              }
                                            }}
                                            className="sr-only"
                                          />
                                          <div className="flex items-center gap-3 w-full">
                                            {/* Color Swatch */}
                                            <div 
                                              className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
                                              style={{ 
                                                backgroundColor: option.colorCode || option.value.toLowerCase(),
                                                borderColor: isChecked ? '#3B82F6' : '#D1D5DB'
                                              }}
                                            >
                                              {isChecked && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <span className={`text-sm font-medium ${
                                                isChecked ? 'text-blue-900' : 'text-gray-700'
                                              }`}>
                                                {option.displayValue}
                                              </span>
                                              {isChecked && (
                                                <div className="text-xs text-blue-600 mt-1">✓ Selected</div>
                                              )}
                                            </div>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                /* Regular Multiple Selection for Non-Color Filters */
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {(categoryFilter.filter.options || []).filter(option => option && (option._id || option.id)).map((option, optionIndex) => {
                                    const filterValues = getMultipleFilterValues(categoryFilter.filter._id);
                                    const optionId = option._id || option.id;
                                    const isChecked = filterValues.some(fv => fv.filterOptionId === optionId);
                                    const uniqueKey = `${categoryFilter.filter._id}-${optionId}-${optionIndex}`;
                                  
                                    return (
                                      <label key={uniqueKey} className="flex items-center p-2 rounded bg-gray-50 border border-gray-200 hover:bg-gray-100">
                                        <input
                                          type="checkbox"
                                          id={uniqueKey}
                                          checked={isChecked}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            if (e.target.checked) {
                                              handleFilterValueChange(categoryFilter.filter._id, optionId);
                                            } else {
                                              handleFilterValueRemove(categoryFilter.filter._id, optionId);
                                            }
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">
                                          {option.displayValue}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {errors[`filter_${categoryFilter.filter._id}`] && (
                            <p className="text-red-500 text-sm">{errors[`filter_${categoryFilter.filter._id}`]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <FilterIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                        <h4 className="text-lg font-medium text-yellow-800 mb-2">🔍 Product Filters</h4>
                        <p className="text-sm text-yellow-700 mb-4">
                          {formData.subCategory ? (
                            subSubCategories.length > 0 ? (
                              "Please select a specific sub-sub-category above to see available filters"
                            ) : (
                              categories.find(cat => (cat.id || cat._id) === formData.subCategory)?.level === 3 ? (
                                "No filters are assigned to this category yet. Please contact admin to assign filters."
                              ) : (
                                "Filters are only available for the most specific category level (sub-sub-categories). Please select a category that has sub-sub-categories."
                              )
                            )
                          ) : (
                            "Select a category above to see available product filters"
                          )}
                        </p>
                        <div className="text-xs text-yellow-600">
                          💡 Filters help customers find products by size, color, brand, price range, etc.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Settings */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Settings</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Active Product</span>
                        <p className="text-xs text-gray-500">Product will be visible to customers</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Featured Product</span>
                        <p className="text-xs text-gray-500">Product will appear in featured sections</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isTrending}
                        onChange={(e) => handleInputChange('isTrending', e.target.checked)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Trending Product</span>
                        <p className="text-xs text-gray-500">Product will appear in trending sections</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 mt-8 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                onClick={handleSubmit}
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </button>
              {errors.submit && (
                <p className="text-red-500 text-sm">{errors.submit}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;