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
  _id?: string; // Keep for backward compatibility
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
  id?: string; // Add optional id property for compatibility
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

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  subCategory: string;
  subSubCategory?: string; // Add subSubCategory field
  brand: string;
  stock: number;
  images: string[];
  features: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  filterValues: ProductFilterValue[];
}

interface ProductFormState extends ProductFormData {
  imageFiles: File[];
  imagePreviews: string[];
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
  const [formData, setFormData] = useState<ProductFormState>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: '',
    subCategory: '',
    subSubCategory: '', // Add subSubCategory field
    brand: '',
    stock: 0,
    images: [],
    features: [''],
    tags: [''],
    isActive: true,
    isFeatured: false,
    filterValues: [],
    imageFiles: [],
    imagePreviews: []
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<Category[]>([]);
  const [availableFilters, setAvailableFilters] = useState<CategoryFilter[]>([]);
  const [availableFilterOptions, setAvailableFilterOptions] = useState<Record<string, FilterOption[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (initialData) {
        // Reset category selection states first
        setSelectedMainCategory('');
        setSelectedSubCategory('');
        setSubCategories([]);
        setSubSubCategories([]);
        
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          price: initialData.price || 0,
          originalPrice: initialData.originalPrice || 0,
          category: initialData.category || '',
          subCategory: initialData.subCategory || '',
          subSubCategory: initialData.subSubCategory || '', // Add subSubCategory field
          brand: initialData.brand || '',
          stock: initialData.stock || 0,
          images: initialData.images || [],
          features: initialData.features || [''],
          tags: initialData.tags || [''],
          isActive: initialData.isActive ?? true,
          isFeatured: initialData.isFeatured ?? false,
          filterValues: initialData.filterValues || [],
          imageFiles: [],
          imagePreviews: (initialData.images || []).map(img => 
            img.startsWith('http') ? img : `http://localhost:4000${img}`
          )
        });
      }
    } else {
      resetForm();
    }
  }, [isOpen, initialData]);

  // Fetch available filters when category selection changes
  useEffect(() => {
    // Only fetch filters if categories are loaded
    if (categories.length === 0) {
      console.log('🔍 ProductForm: Categories not loaded yet, skipping filter fetch');
      return;
    }
    
    // Fetch filters for the most specific category selected
    const categoryForFilters = formData.subSubCategory || formData.subCategory || formData.category;
    if (categoryForFilters) {
      console.log('🔍 ProductForm: Fetching filters for category:', categoryForFilters);
      fetchAvailableFilters(categoryForFilters);
    } else {
      console.log('🔍 ProductForm: No category selected, clearing filters');
      setAvailableFilters([]);
    }
  }, [formData.category, formData.subCategory, formData.subSubCategory, categories]);

  // Helper function to get parent category ID
  const getParentCategoryId = (parentCategory: string | { id?: string; _id?: string; name?: string } | undefined): string | undefined => {
    if (!parentCategory) return undefined;
    if (typeof parentCategory === 'string') return parentCategory;
    return parentCategory.id || parentCategory._id;
  };

  // Helper function to filter categories by parent
  const filterCategoriesByParent = (level: number, parentId: string) => {
    return categories.filter(cat => {
      if (cat.level !== level) return false;
      const catParentId = getParentCategoryId(cat.parentCategory);
      return catParentId === parentId;
    });
  };

  // Auto-populate subcategories when a category is pre-selected
  useEffect(() => {
    if (categories.length > 0 && (formData.category || formData.subCategory || formData.subSubCategory) && !selectedMainCategory) {
      // Handle different category levels based on what's populated
      let mainCatId = '';
      let subCatId = '';
      let subSubCatId = '';
      
      // If subSubCategory is set, work backwards to find the hierarchy
      if (formData.subSubCategory) {
        const subSubCat = categories.find(cat => (cat.id || cat._id) === formData.subSubCategory);
        if (subSubCat && subSubCat.level === 3) {
          subSubCatId = formData.subSubCategory;
          const parentSubId = getParentCategoryId(subSubCat.parentCategory);
          const parentSubCat = categories.find(cat => (cat.id || cat._id) === parentSubId);
          if (parentSubCat) {
            subCatId = parentSubCat.id || parentSubCat._id || '';
            const grandParentId = getParentCategoryId(parentSubCat.parentCategory);
            const grandParentCat = categories.find(cat => (cat.id || cat._id) === grandParentId);
            if (grandParentCat) {
              mainCatId = grandParentCat.id || grandParentCat._id || '';
            }
          }
        }
      }
      // If subCategory is set but no subSubCategory
      else if (formData.subCategory) {
        const subCat = categories.find(cat => (cat.id || cat._id) === formData.subCategory);
        if (subCat && subCat.level === 2) {
          subCatId = formData.subCategory;
          const parentId = getParentCategoryId(subCat.parentCategory);
          const parentCat = categories.find(cat => (cat.id || cat._id) === parentId);
          if (parentCat) {
            mainCatId = parentCat.id || parentCat._id || '';
          }
        }
      }
      // If only main category is set
      else if (formData.category) {
        const mainCat = categories.find(cat => (cat.id || cat._id) === formData.category);
        if (mainCat && mainCat.level === 1) {
          mainCatId = formData.category;
        }
      }
      
      // Set the hierarchy
      if (mainCatId) {
        setSelectedMainCategory(mainCatId);
        const subs = filterCategoriesByParent(2, mainCatId);
        setSubCategories(subs);
        
        if (subCatId) {
          setSelectedSubCategory(subCatId);
          const subSubs = filterCategoriesByParent(3, subCatId);
          setSubSubCategories(subSubs);
        }
      }
    }
  }, [categories, formData.category, formData.subCategory, formData.subSubCategory, selectedMainCategory]);

  const fetchCategories = async () => {
    try {
      console.log('🔍 ProductForm: Fetching category tree...');
      const response = await authService.getCategoryTree();
      console.log('🔍 ProductForm: Category tree response:', response);
      
      // Flatten the hierarchical category tree into a flat array
      let allCategories: Category[] = [];
      
      const flattenCategories = (categories: Category[], level: number = 1) => {
        categories.forEach(category => {
          // Ensure the category has the correct structure
          const flatCategory: Category = {
            id: category.id || category._id || '',
            _id: category._id || category.id,
            name: category.name,
            slug: category.slug,
            level: level,
            parentCategory: category.parentCategory,
            isActive: category.isActive,
            children: category.children || []
          };
          
          allCategories.push(flatCategory);
          
          // Recursively flatten children
          if (category.children && category.children.length > 0) {
            flattenCategories(category.children, level + 1);
          }
        });
      };
      
      // Handle the response format from getCategoryTree
      if (response && response.success && Array.isArray(response.data)) {
        flattenCategories(response.data);
      } else if (response && Array.isArray(response.data)) {
        flattenCategories(response.data);
      } else if (response && Array.isArray(response)) {
        flattenCategories(response);
      } else {
        console.warn('❌ ProductForm: Unexpected categories response format:', response);
        allCategories = [];
      }
      
      console.log('🔍 ProductForm: Flattened categories:', allCategories);
      console.log('🔍 ProductForm: Categories by level:', {
        level1: allCategories.filter(cat => cat.level === 1).length,
        level2: allCategories.filter(cat => cat.level === 2).length,
        level3: allCategories.filter(cat => cat.level === 3).length
      });
      
      setCategories(allCategories);
      
      const mains = allCategories.filter((cat: Category) => cat.level === 1);
      setMainCategories(mains);
    } catch (error) {
      console.error('❌ ProductForm: Error fetching categories:', error);
      setCategories([]);
      setMainCategories([]);
    }
  };

  const fetchAvailableFilters = async (categoryId: string) => {
    try {
      console.log('🔍 ProductForm: Fetching filters for categoryId:', categoryId);
      
      // First check if the category exists and get its level
      const selectedCategory = categories.find(cat => (cat.id || cat._id) === categoryId);
      if (!selectedCategory) {
        console.warn('❌ ProductForm: Category not found:', categoryId);
        setAvailableFilters([]);
        setAvailableFilterOptions({});
        return;
      }
      
      console.log('🔍 ProductForm: Selected category:', selectedCategory.name, 'Level:', selectedCategory.level);
      
      // Allow filters for any category level that has been tagged with filters
      console.log('🔍 ProductForm: Fetching filters for category level:', selectedCategory.level);
      
      const response = await authService.get(`/api/admin/categories/${categoryId}/filters`);
      console.log('🔍 ProductForm: Raw filters response:', response);
      
      // Handle the correct response format from backend
      // Backend returns: {success: true, data: {category, filters: [...], pagination}}
      // authService.get() returns response.data, so we access response.data.filters
      let filters = [];
      if (response && response.success && response.data && Array.isArray(response.data.filters)) {
        filters = response.data.filters;
        console.log('✅ ProductForm: Using response.data.filters format');
      } else if (response && response.data && Array.isArray(response.data)) {
        filters = response.data;
        console.log('✅ ProductForm: Using response.data format (direct array)');
      } else if (response && Array.isArray(response)) {
        filters = response;
        console.log('✅ ProductForm: Using direct response format');
      } else {
        console.warn('❌ ProductForm: Unexpected filters response format:', response);
        console.warn('❌ ProductForm: Response structure:', JSON.stringify(response, null, 2));
        filters = [];
      }
      
      console.log('🔍 ProductForm: Processed filters:', filters);
      console.log('🔍 ProductForm: Number of filters found:', filters.length);
      setAvailableFilters(filters);
      
      // Fetch available filter options based on existing products
      await fetchAvailableFilterOptions(categoryId);
    } catch (error: any) {
      console.error('❌ ProductForm: Error fetching category filters:', error);
      
      // Handle any errors gracefully
      console.error('❌ ProductForm: Error details:', error.response?.data || error.message);
      setAvailableFilters([]);
      setAvailableFilterOptions({});
    }
  };

  const fetchAvailableFilterOptions = async (categoryId: string) => {
    try {
      console.log('🔍 ProductForm: Fetching available filter options for categoryId:', categoryId);
      const response = await authService.get(`/api/admin/products/category/${categoryId}/available-filter-options`);
      console.log('🔍 ProductForm: Available filter options response:', response);
      
      let filterOptions = {};
      if (response && response.success && response.data) {
        filterOptions = response.data;
        console.log('✅ ProductForm: Using response.data format for filter options');
      } else if (response && response.data && response.data.success) {
        filterOptions = response.data.data;
        console.log('✅ ProductForm: Using response.data.data format for filter options');
      } else if (response && typeof response === 'object') {
        filterOptions = response;
        console.log('✅ ProductForm: Using direct response format for filter options');
      } else {
        console.warn('❌ ProductForm: Unexpected available filter options response format:', response);
        filterOptions = {};
      }
      
      console.log('🔍 ProductForm: Processed filter options:', filterOptions);
      setAvailableFilterOptions(filterOptions);
    } catch (error: any) {
      console.error('❌ ProductForm: Error fetching available filter options:', error);
      
      // Fallback: use the filter options from the available filters
      console.log('🔍 ProductForm: Using fallback filter options from available filters');
      const fallbackOptions: any = {};
      availableFilters.forEach(categoryFilter => {
        if (categoryFilter.filter && categoryFilter.filter.options) {
          fallbackOptions[categoryFilter.filter._id] = categoryFilter.filter.options;
          console.log(`🔍 ProductForm: Added fallback options for filter ${categoryFilter.filter.name}:`, categoryFilter.filter.options.length);
        }
      });
      console.log('🔍 ProductForm: Final fallback options:', fallbackOptions);
      setAvailableFilterOptions(fallbackOptions);
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
      subSubCategory: '', // Add subSubCategory field
      brand: '',
      stock: 0,
      images: [],
      features: [''],
      tags: [''],
      isActive: true,
      isFeatured: false,
      filterValues: [],
      imageFiles: [],
      imagePreviews: []
    });
    setSelectedMainCategory('');
    setSelectedSubCategory('');
    setSubCategories([]);
    setSubSubCategories([]);
    setAvailableFilters([]);
    setAvailableFilterOptions({});
    setErrors({});
  };

  const handleMainCategoryChange = (categoryId: string) => {
    console.log('🔍 ProductForm: Main category changed to:', categoryId);
    setSelectedMainCategory(categoryId);
    setSelectedSubCategory('');
    // Clear both subCategory and subSubCategory when main category changes
    setFormData(prev => ({ ...prev, category: categoryId, subCategory: '', subSubCategory: '' }));
    
    const selectedMain = categories.find(cat => (cat.id || cat._id) === categoryId);
    console.log('🔍 ProductForm: Selected main category:', selectedMain);
    if (selectedMain) {
      const subs = filterCategoriesByParent(2, categoryId);
      setSubCategories(subs);
      setSubSubCategories([]);
      
      // Fetch filters for the selected main category
      console.log('🔍 ProductForm: Fetching filters for main category level:', selectedMain.level);
      fetchAvailableFilters(categoryId);
    }
  };

  const handleSubCategoryChange = (categoryId: string) => {
    console.log('🔍 ProductForm: Sub category changed to:', categoryId);
    setSelectedSubCategory(categoryId);
    // Clear subSubCategory when subcategory changes
    setFormData(prev => ({ ...prev, subCategory: categoryId, subSubCategory: '' }));
    
    const subSubs = filterCategoriesByParent(3, categoryId);
    setSubSubCategories(subSubs);
    
    const selectedSub = categories.find(cat => (cat.id || cat._id) === categoryId);
    console.log('🔍 ProductForm: Selected sub category:', selectedSub);
    console.log('🔍 ProductForm: Fetching filters for sub category level:', selectedSub?.level);
    
    // Fetch filters for the selected sub category
    fetchAvailableFilters(categoryId);
  };

  const handleSubSubCategoryChange = (categoryId: string) => {
    console.log('🔍 ProductForm: Sub-sub category changed to:', categoryId);
    // FIX: Set subSubCategory instead of subCategory
    setFormData(prev => ({ ...prev, subSubCategory: categoryId }));
    
    const selectedSubSub = categories.find(cat => (cat.id || cat._id) === categoryId);
    console.log('🔍 ProductForm: Selected sub-sub category:', selectedSubSub);
    console.log('🔍 ProductForm: Fetching filters for sub-sub category level:', selectedSubSub?.level);
    
    // Fetch filters for the selected sub-sub category
    fetchAvailableFilters(categoryId);
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean | string[] | ProductFilterValue[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFilterValueChange = (filterId: string, filterOptionId?: string, customValue?: string) => {
    const newFilterValues = formData.filterValues.filter(fv => fv.filterId !== filterId);
    
    if (filterOptionId || customValue) {
      newFilterValues.push({
        filterId,
        filterOptionId,
        customValue
      });
    }
    
    setFormData(prev => ({ ...prev, filterValues: newFilterValues }));
  };

  const handleMultipleFilterValueChange = (filterId: string, filterOptionId: string, isChecked: boolean) => {
    let newFilterValues = [...formData.filterValues];
    
    if (isChecked) {
      // Check if this combination already exists to prevent duplicates
      const exists = newFilterValues.some(fv => fv.filterId === filterId && fv.filterOptionId === filterOptionId);
      if (!exists) {
        newFilterValues.push({ filterId, filterOptionId });
      }
    } else {
      newFilterValues = newFilterValues.filter(fv => !(fv.filterId === filterId && fv.filterOptionId === filterOptionId));
    }
    
    setFormData(prev => ({ ...prev, filterValues: newFilterValues }));
  };

  const getFilterValue = (filterId: string) => {
    return formData.filterValues.find(fv => fv.filterId === filterId);
  };

  const getMultipleFilterValues = (filterId: string) => {
    return formData.filterValues.filter(fv => fv.filterId === filterId);
  };

  const handleArrayChange = (field: 'images' | 'features' | 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'images' | 'features' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'images' | 'features' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Log file details for debugging
    console.log('Selected files:', files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    })));

    // Validate file types on frontend
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.bmp', '.tiff', '.tif'];
    
    const invalidFiles = files.filter(file => {
      const hasValidType = allowedTypes.includes(file.type);
      const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      return !hasValidType && !hasValidExtension;
    });

    if (invalidFiles.length > 0) {
      alert(`Invalid file types detected: ${invalidFiles.map(f => f.name).join(', ')}. Only image files (JPG, JPEG, PNG, SVG, WebP, GIF, BMP, TIFF) are allowed!`);
      return;
    }

    const newImageFiles = [...formData.imageFiles, ...files].slice(0, 6);
    const newPreviews = [...formData.imagePreviews];
    
    let loadedCount = 0;
    const totalFiles = files.length;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          newPreviews.push(result);
          loadedCount++;
          
          // Only update state when all files are loaded
          if (loadedCount === totalFiles) {
            setFormData(prev => ({ 
              ...prev, 
              imageFiles: newImageFiles,
              imagePreviews: newPreviews
            }));
          }
        }
      };
      reader.onerror = () => {
        console.error('Error reading file:', file.name);
        loadedCount++;
        if (loadedCount === totalFiles) {
          setFormData(prev => ({ 
            ...prev, 
            imageFiles: newImageFiles,
            imagePreviews: newPreviews
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const newImageFiles = formData.imageFiles.filter((_, i) => i !== index);
    const newPreviews = formData.imagePreviews.filter((_, i) => i !== index);
    const newImages = formData.images.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      imageFiles: newImageFiles,
      imagePreviews: newPreviews,
      images: newImages
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.originalPrice < formData.price) newErrors.originalPrice = 'Original price must be greater than or equal to discounted price';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subCategory) newErrors.subCategory = 'Sub-category is required';
    
    // Validate subSubCategory if subSubCategories are available
    if (subSubCategories.length > 0 && !formData.subSubCategory) {
      newErrors.subSubCategory = 'Sub-sub category is required when available';
    }
    
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    
    // Validate images
    const hasImageFiles = formData.imageFiles.length > 0;
    const hasImageUrls = formData.images.filter(img => img.trim()).length > 0;
    const hasImagePreviews = formData.imagePreviews.length > 0;
    
    if (!hasImageFiles && !hasImageUrls && !hasImagePreviews) {
      newErrors.images = 'At least one product image is required';
    }

    // Validate required filters
    availableFilters.forEach(categoryFilter => {
      if (categoryFilter.isRequired) {
        const hasValue = formData.filterValues.some(fv => fv.filterId === categoryFilter.filter._id);
        if (!hasValue) {
          newErrors[`filter_${categoryFilter.filter._id}`] = `${categoryFilter.filter.displayName} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submitData = new FormData();
      
      // Add all form fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price.toString());
      submitData.append('originalPrice', formData.originalPrice.toString());
      submitData.append('category', formData.category);
      submitData.append('subCategory', formData.subCategory);
      if (formData.subSubCategory) {
        submitData.append('subSubCategory', formData.subSubCategory);
      }
      submitData.append('brand', formData.brand);
      submitData.append('stock', formData.stock.toString());
      submitData.append('isActive', formData.isActive.toString());
      submitData.append('isFeatured', formData.isFeatured.toString());
      
      // Add filter values
      submitData.append('filterValues', JSON.stringify(formData.filterValues));
      
      // Add arrays
      formData.features.forEach(feature => {
        if (feature.trim()) submitData.append('features', feature);
      });
      formData.tags.forEach(tag => {
        if (tag.trim()) submitData.append('tags', tag);
      });
      
      // Add image files
      if (formData.imageFiles.length > 0) {
        console.log('Adding image files to FormData:', formData.imageFiles.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        })));
        formData.imageFiles.forEach(file => {
          submitData.append('images', file);
        });
      } else if (formData.images.length > 0) {
        console.log('Adding image URLs to FormData:', formData.images);
        formData.images.forEach(image => {
          if (image.trim()) submitData.append('images', image);
        });
      }
      
      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            type: value.type,
            size: value.size
          });
        } else {
          console.log(`${key}:`, value);
        }
      }
      
      await onSubmit(submitData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
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
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Category Selection First */}
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
                        value={selectedMainCategory}
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
                        value={selectedSubCategory}
                        onChange={(e) => handleSubCategoryChange(e.target.value)}
                        disabled={!selectedMainCategory}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.subCategory ? 'border-red-500' : 'border-gray-300'
                        } ${!selectedMainCategory ? 'bg-gray-100' : ''}`}
                      >
                        <option value="">Please select a main category first</option>
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
                        disabled={!selectedSubCategory || subSubCategories.length === 0}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                          (!selectedSubCategory || subSubCategories.length === 0) ? 'bg-gray-100' : ''
                        }`}
                      >
                        <option value="">Use {categories.find(cat => (cat.id || cat._id) === selectedSubCategory)?.name || 'Sub Category'}</option>
                        {subSubCategories.map((category) => (
                          <option key={category.id || category._id} value={category.id || category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Optional: Choose for more specific categorization</p>
                    </div>
                  </div>
                </div>

                {/* Basic Product Info */}
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
                        value={formData?.name || ''}
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
                        value={formData?.brand || ''}
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
                      value={formData?.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter detailed product description"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
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
                        Original Price *
                      </label>
                      <input
                        type="number"
                        value={formData?.originalPrice || 0}
                        onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.originalPrice ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      {errors.originalPrice && <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selling Price *
                      </label>
                      <input
                        type="number"
                        value={formData?.price || 0}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        value={formData?.stock || 0}
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



                {/* Product Images */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Product Images *
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">JPG, JPEG, PNG, SVG, WebP (MAX. 10MB each, up to 6 images)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".jpg,.jpeg,.png,.svg,.webp,image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    
                    {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
                    
                    {/* Image Previews */}
                    {formData.imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Features</h3>
                  
                  <div className="space-y-3">
                    {formData.features.map((feature, index) => (
                      <div key={`feature-${index}`} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleArrayChange('features', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter product feature"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('features', index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('features')}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Feature
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Tags</h3>
                  
                  <div className="space-y-3">
                    {formData.tags.map((tag, index) => (
                      <div key={`tag-${index}`} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter product tag"
                        />
                        {formData.tags.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('tags', index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('tags')}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Tag
                    </button>
                  </div>
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
                        <div key={categoryFilter._id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {categoryFilter.filter.displayName}
                            {categoryFilter.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
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
                                          handleMultipleFilterValueChange(categoryFilter.filter._id, optionId || '', e.target.checked);
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

                            </div>
                          )}
                          
                          {errors[`filter_${categoryFilter.filter._id}`] && (
                            <p className="text-red-500 text-sm">{errors[`filter_${categoryFilter.filter._id}`]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
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
                        "Select a category to see available filters"
                      )}
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
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;