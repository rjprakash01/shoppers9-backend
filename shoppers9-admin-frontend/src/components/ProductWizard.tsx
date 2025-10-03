import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import ProductSpecificationsForm from './ProductSpecificationsForm';
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
  Filter as FilterIcon,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';

// Import interfaces from ProductForm
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
  sku: string;
  images: string[];
}

interface ProductColor {
  name: string;
  code: string;
  images: string[];
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
  specifications?: any;
}

interface ProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: Partial<ProductFormData>;
  isEditing?: boolean;
}

const ProductWizard: React.FC<ProductWizardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
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
    submissionNotes: '',
    specifications: {}
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<Category[]>([]);
  const [availableFilters, setAvailableFilters] = useState<CategoryFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUploadError, setImageUploadError] = useState<string>('');

  const steps = [
    { id: 1, title: 'Category', description: 'Select product category' },
    { id: 2, title: 'Basic Info', description: 'Product details' },
    { id: 3, title: 'Pricing & Variants', description: 'Price, inventory, colors & sizes' },
    { id: 4, title: 'Specifications', description: 'Product specifications' },
    { id: 5, title: 'Settings', description: 'Final settings & create' }
  ];

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
          submissionNotes: initialData.submissionNotes || '',
          specifications: initialData.specifications || {}
        });
      }
    } else {
      resetForm();
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setCurrentStep(1);
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
      submissionNotes: '',
      specifications: {}
    });
    setUploadedFiles({});
    setErrors({});
  };

  const fetchCategories = async () => {
    try {
      const response = await authService.getAllCategories(1, 1000); // Get all categories
      if (response.categories) {
        setCategories(response.categories);
        const mainCats = response.categories.filter((cat: Category) => cat.level === 1);
        setMainCategories(mainCats);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      subCategory: '',
      subSubCategory: ''
    }));
    
    const selectedCategory = categories.find(cat => (cat.id || cat._id) === categoryId);
    if (selectedCategory) {
      const subCats = categories.filter(cat => 
        cat.level === 2 && 
        (typeof cat.parentCategory === 'string' 
          ? cat.parentCategory === categoryId 
          : cat.parentCategory?.id === categoryId || cat.parentCategory?._id === categoryId)
      );
      setSubCategories(subCats);
      setSubSubCategories([]);
    }
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    setFormData(prev => ({
      ...prev,
      subCategory: subCategoryId,
      subSubCategory: ''
    }));
    
    const subSubCats = categories.filter(cat => 
      cat.level === 3 && 
      (typeof cat.parentCategory === 'string' 
        ? cat.parentCategory === subCategoryId 
        : cat.parentCategory?.id === subCategoryId || cat.parentCategory?._id === subCategoryId)
    );
    setSubSubCategories(subSubCats);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
        break;
      case 3:
        if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
        if (formData.originalPrice <= 0) newErrors.originalPrice = 'Original price must be greater than 0';
        if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
        break;
      case 4:
        // Specifications are optional
        break;
      case 5:
        // Final validation - check all required fields
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
        if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
        if (formData.originalPrice <= 0) newErrors.originalPrice = 'Original price must be greater than 0';
        if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
        
        // Ensure we have at least one variant with valid data
        if (!formData.variants || formData.variants.length === 0) {
          // Create a default variant if none exists
          const defaultVariant = {
            color: 'Default',
            size: 'One Size',
            price: formData.price,
            originalPrice: formData.originalPrice,
            stock: formData.stock,
            sku: `${formData.name.replace(/\s+/g, '-').toLowerCase()}-default-${Date.now()}`,
            images: []
          };
          setFormData(prev => ({ ...prev, variants: [defaultVariant] }));
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    
    setIsLoading(true);
    try {
      const submitData = new FormData();
      
      // Add all form data except images and availableColors/availableSizes
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'availableColors' || key === 'availableSizes' || key === 'images') {
          return; // Skip these as they're handled separately
        }
        
        if (key === 'variants' || key === 'filterValues' || key === 'displayFilters' || 
            key === 'features' || key === 'tags' || key === 'specifications') {
          submitData.append(key, JSON.stringify(value));
        } else {
          submitData.append(key, String(value));
        }
      });
      
      // Add actual image files
      Object.entries(uploadedFiles).forEach(([colorIndex, files]) => {
        files.forEach((file, fileIndex) => {
          submitData.append('images', file, `color-${colorIndex}-${fileIndex}-${file.name}`);
        });
      });
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to create product. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const updateTag = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

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

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.filter((_, i) => i !== index),
      variants: prev.variants.filter(variant => variant.color !== prev.availableColors[index]?.name)
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

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      availableSizes: [...prev.availableSizes, {
        name: ''
      }]
    }));
  };

  const removeSizeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availableSizes: prev.availableSizes.filter((_, i) => i !== index),
      variants: prev.variants.filter(variant => variant.size !== prev.availableSizes[index]?.name)
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
      sku: '',
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
          
          // If color is being updated, automatically assign colorCode from that color
          if (field === 'color') {
            const selectedColor = prev.availableColors.find(color => color.name === value);
            if (selectedColor) {
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

  // Store actual file objects for upload
  const [uploadedFiles, setUploadedFiles] = useState<{ [colorIndex: number]: File[] }>({});

  // Color image management functions
  const handleColorImageUpload = async (colorIndex: number, files: FileList) => {
    setImageUploadError('');
    
    const maxFiles = 6;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    const currentImages = formData.availableColors[colorIndex]?.images || [];
    const currentFiles = uploadedFiles[colorIndex] || [];
    
    if (currentImages.length + files.length > maxFiles) {
      setImageUploadError(`Maximum ${maxFiles} images allowed per color`);
      return;
    }
    
    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setImageUploadError('Only JPEG, PNG, and WebP images are allowed');
        return false;
      }
      if (file.size > maxSize) {
        setImageUploadError('Each image must be less than 5MB');
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    try {
      const imageUrls: string[] = [];
      
      for (const file of validFiles) {
        const reader = new FileReader();
        const imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        imageUrls.push(imageUrl);
      }
      
      // Store actual files for upload
      setUploadedFiles(prev => ({
        ...prev,
        [colorIndex]: [...currentFiles, ...validFiles]
      }));
      
      // Store preview URLs for display
      setFormData(prev => ({
        ...prev,
        availableColors: prev.availableColors.map((color, index) => 
          index === colorIndex 
            ? { ...color, images: [...color.images, ...imageUrls] }
            : color
        )
      }));
    } catch (error) {
      setImageUploadError('Failed to upload images. Please try again.');
    }
  };
  
  const removeColorImage = (colorIndex: number, imageIndex: number) => {
    // Remove from uploaded files
    setUploadedFiles(prev => {
      const currentFiles = prev[colorIndex] || [];
      return {
        ...prev,
        [colorIndex]: currentFiles.filter((_, i) => i !== imageIndex)
      };
    });
    
    // Remove from preview images
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.map((color, index) => 
        index === colorIndex 
          ? { ...color, images: color.images.filter((_, i) => i !== imageIndex) }
          : color
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Header with Steps */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <div className="ml-2 text-sm">
                  <div className={`font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-gray-500 text-xs">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
          {/* Step 1: Category Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Product Category</h3>
                
                {/* Main Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select main category</option>
                    {mainCategories.map((category) => (
                      <option key={category.id || category._id} value={category.id || category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                {/* Sub Category */}
                {subCategories.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub Category
                    </label>
                    <select
                      value={formData.subCategory}
                      onChange={(e) => handleSubCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select sub category</option>
                      {subCategories.map((category) => (
                        <option key={category.id || category._id} value={category.id || category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sub Sub Category */}
                {subSubCategories.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub Sub Category
                    </label>
                    <select
                      value={formData.subSubCategory || ''}
                      onChange={(e) => handleInputChange('subSubCategory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select sub sub category</option>
                      {subSubCategories.map((category) => (
                        <option key={category.id || category._id} value={category.id || category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Basic Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Product Information</h3>
              
              {/* Product Name */}
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
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter product description"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Brand */}
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
                {errors.brand && (
                  <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
                )}
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Features
                </label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter feature"
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Feature
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Tags
                </label>
                <div className="space-y-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => updateTag(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter tag"
                      />
                      {formData.tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="p-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTag}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing & Variants */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing, Inventory & Variants</h3>
              
              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
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
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price *
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
                  {errors.originalPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>
                  )}
                </div>
              </div>

              {/* Stock */}
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
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                )}
              </div>

              {/* Available Colors Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Available Colors
                  </h4>
                  <button
                    type="button"
                    onClick={addColor}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Color
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Define available colors for this product.
                </p>

                {formData.availableColors.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">No colors added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.availableColors.map((color, cIndex) => (
                      <div key={cIndex} className="border border-gray-200 rounded p-3 bg-gray-50">
                        <div className="grid grid-cols-4 gap-2 items-end mb-2">
                           <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">
                               Color Name *
                             </label>
                             <input
                               type="text"
                               value={color.name}
                               onChange={(e) => updateColor(cIndex, 'name', e.target.value)}
                               className="w-full px-2 py-1 border rounded text-xs border-gray-300"
                               placeholder="e.g., Red, Blue"
                             />
                           </div>
                           
                           <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">
                               Predefined Colors
                             </label>
                             <select
                               value=""
                               onChange={(e) => {
                                 const selectedColor = e.target.value;
                                 if (selectedColor) {
                                   const predefinedColors = {
                                     'Red': '#FF0000',
                                     'Blue': '#0000FF',
                                     'Green': '#008000',
                                     'Yellow': '#FFFF00',
                                     'Orange': '#FFA500',
                                     'Purple': '#800080',
                                     'Pink': '#FFC0CB',
                                     'Brown': '#A52A2A',
                                     'Black': '#000000',
                                     'White': '#FFFFFF',
                                     'Gray': '#808080',
                                     'Navy': '#000080',
                                     'Maroon': '#800000',
                                     'Olive': '#808000',
                                     'Lime': '#00FF00',
                                     'Aqua': '#00FFFF',
                                     'Teal': '#008080',
                                     'Silver': '#C0C0C0',
                                     'Fuchsia': '#FF00FF',
                                     'Coral': '#FF7F50',
                                     'Salmon': '#FA8072',
                                     'Gold': '#FFD700',
                                     'Khaki': '#F0E68C',
                                     'Violet': '#EE82EE',
                                     'Indigo': '#4B0082',
                                     'Turquoise': '#40E0D0',
                                     'Crimson': '#DC143C',
                                     'Chocolate': '#D2691E',
                                     'Beige': '#F5F5DC',
                                     'Ivory': '#FFFFF0'
                                   };
                                   updateColor(cIndex, 'name', selectedColor);
                                   updateColor(cIndex, 'code', predefinedColors[selectedColor]);
                                 }
                               }}
                               className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                               style={{
                                 backgroundImage: 'none',
                                 appearance: 'none',
                                 WebkitAppearance: 'none',
                                 MozAppearance: 'none'
                               }}
                             >
                               <option value="" style={{ background: 'white' }}>🎨 Select Color</option>
                               <option value="Red" style={{ background: 'linear-gradient(to right, #FF0000 20px, white 20px)', paddingLeft: '25px' }}>🔴 Red</option>
                               <option value="Blue" style={{ background: 'linear-gradient(to right, #0000FF 20px, white 20px)', paddingLeft: '25px' }}>🔵 Blue</option>
                               <option value="Green" style={{ background: 'linear-gradient(to right, #008000 20px, white 20px)', paddingLeft: '25px' }}>🟢 Green</option>
                               <option value="Yellow" style={{ background: 'linear-gradient(to right, #FFFF00 20px, white 20px)', paddingLeft: '25px' }}>🟡 Yellow</option>
                               <option value="Orange" style={{ background: 'linear-gradient(to right, #FFA500 20px, white 20px)', paddingLeft: '25px' }}>🟠 Orange</option>
                               <option value="Purple" style={{ background: 'linear-gradient(to right, #800080 20px, white 20px)', paddingLeft: '25px' }}>🟣 Purple</option>
                               <option value="Pink" style={{ background: 'linear-gradient(to right, #FFC0CB 20px, white 20px)', paddingLeft: '25px' }}>🩷 Pink</option>
                               <option value="Brown" style={{ background: 'linear-gradient(to right, #A52A2A 20px, white 20px)', paddingLeft: '25px' }}>🤎 Brown</option>
                               <option value="Black" style={{ background: 'linear-gradient(to right, #000000 20px, white 20px)', paddingLeft: '25px' }}>⚫ Black</option>
                               <option value="White" style={{ background: 'linear-gradient(to right, #FFFFFF 20px, white 20px)', border: '1px solid #ccc', paddingLeft: '25px' }}>⚪ White</option>
                               <option value="Gray" style={{ background: 'linear-gradient(to right, #808080 20px, white 20px)', paddingLeft: '25px' }}>🔘 Gray</option>
                               <option value="Navy" style={{ background: 'linear-gradient(to right, #000080 20px, white 20px)', paddingLeft: '25px' }}>🔷 Navy</option>
                               <option value="Maroon" style={{ background: 'linear-gradient(to right, #800000 20px, white 20px)', paddingLeft: '25px' }}>🔴 Maroon</option>
                               <option value="Olive" style={{ background: 'linear-gradient(to right, #808000 20px, white 20px)', paddingLeft: '25px' }}>🫒 Olive</option>
                               <option value="Lime" style={{ background: 'linear-gradient(to right, #00FF00 20px, white 20px)', paddingLeft: '25px' }}>🟢 Lime</option>
                               <option value="Aqua" style={{ background: 'linear-gradient(to right, #00FFFF 20px, white 20px)', paddingLeft: '25px' }}>🔵 Aqua</option>
                               <option value="Teal" style={{ background: 'linear-gradient(to right, #008080 20px, white 20px)', paddingLeft: '25px' }}>🔷 Teal</option>
                               <option value="Silver" style={{ background: 'linear-gradient(to right, #C0C0C0 20px, white 20px)', paddingLeft: '25px' }}>🔘 Silver</option>
                               <option value="Fuchsia" style={{ background: 'linear-gradient(to right, #FF00FF 20px, white 20px)', paddingLeft: '25px' }}>🟣 Fuchsia</option>
                               <option value="Coral" style={{ background: 'linear-gradient(to right, #FF7F50 20px, white 20px)', paddingLeft: '25px' }}>🪸 Coral</option>
                               <option value="Salmon" style={{ background: 'linear-gradient(to right, #FA8072 20px, white 20px)', paddingLeft: '25px' }}>🐟 Salmon</option>
                               <option value="Gold" style={{ background: 'linear-gradient(to right, #FFD700 20px, white 20px)', paddingLeft: '25px' }}>🟡 Gold</option>
                               <option value="Khaki" style={{ background: 'linear-gradient(to right, #F0E68C 20px, white 20px)', paddingLeft: '25px' }}>🟨 Khaki</option>
                               <option value="Violet" style={{ background: 'linear-gradient(to right, #EE82EE 20px, white 20px)', paddingLeft: '25px' }}>🟣 Violet</option>
                               <option value="Indigo" style={{ background: 'linear-gradient(to right, #4B0082 20px, white 20px)', paddingLeft: '25px' }}>🟣 Indigo</option>
                               <option value="Turquoise" style={{ background: 'linear-gradient(to right, #40E0D0 20px, white 20px)', paddingLeft: '25px' }}>🔷 Turquoise</option>
                               <option value="Crimson" style={{ background: 'linear-gradient(to right, #DC143C 20px, white 20px)', paddingLeft: '25px' }}>🔴 Crimson</option>
                               <option value="Chocolate" style={{ background: 'linear-gradient(to right, #D2691E 20px, white 20px)', paddingLeft: '25px' }}>🤎 Chocolate</option>
                               <option value="Beige" style={{ background: 'linear-gradient(to right, #F5F5DC 20px, white 20px)', paddingLeft: '25px' }}>🟨 Beige</option>
                               <option value="Ivory" style={{ background: 'linear-gradient(to right, #FFFFF0 20px, white 20px)', paddingLeft: '25px' }}>🟨 Ivory</option>
                             </select>
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
                               className="w-full px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
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
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Available Sizes
                  </h4>
                  <button
                    type="button"
                    onClick={addSize}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  Define available sizes.
                </p>

                {formData.availableSizes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">No sizes added yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {formData.availableSizes.map((size, sIndex) => (
                      <div key={sIndex} className="flex items-center gap-1 p-1 bg-gray-50 rounded">
                        <input
                          type="text"
                          value={size.name}
                          onChange={(e) => updateSizeOption(sIndex, e.target.value)}
                          className="flex-1 px-1 py-1 border rounded text-xs border-gray-300"
                          placeholder="S, M, L"
                        />
                        <button
                          type="button"
                          onClick={() => removeSizeOption(sIndex)}
                          className="px-1 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Variants Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Color-Size Combinations
                  </h4>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  Create color-size combinations with pricing and stock.
                </p>

                {formData.variants.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">No combinations added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.variants.map((variant, vIndex) => (
                      <div key={vIndex} className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-medium text-gray-900">#{vIndex + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeVariant(vIndex)}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Color *
                            </label>
                            <select
                              value={variant.color}
                              onChange={(e) => updateVariant(vIndex, 'color', e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                            >
                              <option value="">Color</option>
                              {formData.availableColors.map((color, cIndex) => (
                                <option key={cIndex} value={color.name}>{color.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Size *
                            </label>
                            <select
                              value={variant.size}
                              onChange={(e) => updateVariant(vIndex, 'size', e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                            >
                              <option value="">Size</option>
                              {formData.availableSizes.map((size, sIndex) => (
                                <option key={sIndex} value={size.name}>{size.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Price *
                            </label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(vIndex, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Original *
                            </label>
                            <input
                              type="number"
                              value={variant.originalPrice}
                              onChange={(e) => updateVariant(vIndex, 'originalPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Stock *
                            </label>
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(vIndex, 'stock', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              SKU *
                            </label>
                            <input
                              type="text"
                              value={variant.sku || ''}
                              onChange={(e) => updateVariant(vIndex, 'sku', e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                              placeholder="SKU-001"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: variant.colorCode || '#000000' }}
                            title={`${variant.color} (${variant.colorCode})`}
                          ></div>
                          <span className="text-xs text-gray-600">
                            {variant.color} - {variant.size}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Specifications */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Specifications</h3>
              <ProductSpecificationsForm
                specifications={formData.specifications}
                onSpecificationsChange={(specs) => handleInputChange('specifications', specs)}
              />
            </div>
          )}

          {/* Step 5: Settings */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Active Product</span>
                    <p className="text-sm text-gray-500">Make this product visible to customers on the website</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Featured Product</span>
                    <p className="text-sm text-gray-500">Display this product in featured sections and homepage</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => handleInputChange('isTrending', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Trending Product</span>
                    <p className="text-sm text-gray-500">Show this product in trending sections and recommendations</p>
                  </div>
                </label>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Product Summary</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {formData.name || 'Not set'}</div>
                  <div><span className="font-medium">Brand:</span> {formData.brand || 'Not set'}</div>
                  <div><span className="font-medium">Price:</span> ${formData.price}</div>
                  <div><span className="font-medium">Stock:</span> {formData.stock}</div>
                  <div><span className="font-medium">Features:</span> {formData.features.filter(f => f.trim()).length}</div>
                  <div><span className="font-medium">Tags:</span> {formData.tags.filter(t => t.trim()).length}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Creating...' : isEditing ? 'Update Product' : 'Create Product'}
              </button>
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 m-6 mt-0">
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductWizard;