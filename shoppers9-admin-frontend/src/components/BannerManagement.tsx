import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Calendar,
  Link as LinkIcon,
  Type,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { adminBannerService, type Banner } from '../services/bannerService';
import { authService } from '../services/authService';

interface BannerFormData {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link: string;
  buttonText: string;
  isActive: boolean;
  order: number;
  startDate: string;
  endDate: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  displayName?: string;
  level: number;
  isActive: boolean;
  children?: Category[];
}

const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    link: '',
    buttonText: '',
    isActive: true,
    order: 0,
    startDate: '',
    endDate: '',
    displayType: 'hero-banner',
    categoryId: ''
  });

  useEffect(() => {
    loadBanners();
    loadCategories();
  }, [currentPage, itemsPerPage]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await authService.getCategoryTree();
      
      // Flatten the category tree with proper indentation
      const flattenCategories = (cats: any[], level = 1, prefix = ''): Category[] => {
        let result: Category[] = [];
        for (const cat of cats) {
          const indent = '  '.repeat(level - 1);
          const displayName = `${indent}${cat.name} (Level ${level})`;
          
          result.push({
            id: cat.id || cat._id,
            name: cat.name,
            displayName: displayName,
            level: cat.level || level,
            isActive: cat.isActive
          });
          
          if (cat.children && cat.children.length > 0) {
            result = result.concat(flattenCategories(cat.children, level + 1, prefix));
          }
        }
        return result;
      };
      
      const categoryData = response.data;
      let rawCategories: any[] = [];
      if (categoryData && categoryData.success && categoryData.data && Array.isArray(categoryData.data.categories)) {
        rawCategories = categoryData.data.categories;
      } else if (categoryData && categoryData.success && Array.isArray(categoryData.data)) {
        rawCategories = categoryData.data;
      } else if (Array.isArray(categoryData)) {
        rawCategories = categoryData;
      }
      
      const flatCategories = flattenCategories(rawCategories);
      setCategories(flatCategories.filter(cat => cat.isActive));
    } catch (err: any) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadBanners = async () => {
    try {
      setIsLoading(true);
      const response = await adminBannerService.getAllBanners(currentPage, itemsPerPage);
      setBanners(response.data.banners);
      setTotalPages(response.data.pagination.pages);
      setTotalItems(response.data.pagination.total);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, SVG, WebP)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Please log in to upload images');
        return;
      }
      
      const imageUrl = await adminBannerService.uploadBannerImage(file);
      setFormData(prev => ({ ...prev, image: imageUrl }));
      setError(null);
    } catch (err: any) {

      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 413) {
        setError('File too large. Please choose a smaller image.');
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to upload image');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image) {
      setError('Title and image are required');
      return;
    }

    // Validate categoryId is required
    if (!formData.categoryId) {
      setError('Category is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const bannerData: any = {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        image: formData.image,
        link: formData.link,
        buttonText: formData.buttonText,
        isActive: formData.isActive,
        order: formData.order,
        categoryId: formData.categoryId, // Always include categoryId as it's required
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
      };

      // Only include categoryType if displayType is 'hero-banner'
      if (formData.displayType === 'hero-banner' && formData.categoryType) {
        bannerData.categoryType = formData.categoryType;
      }

      if (editingBanner) {
        await adminBannerService.updateBanner(editingBanner.id, bannerData);
      } else {
        await adminBannerService.createBanner(bannerData);
      }

      await loadBanners();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      image: banner.image,
      link: banner.link || '',
      buttonText: banner.buttonText || '',
      isActive: banner.isActive,
      order: banner.order,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      categoryId: (banner as any).categoryId || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await adminBannerService.deleteBanner(bannerId);
      await loadBanners();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  const handleToggleStatus = async (bannerId: string, currentStatus: boolean) => {
    try {
      await adminBannerService.updateBannerStatus(bannerId, !currentStatus);
      await loadBanners();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update banner status');
    }
  };

  const handleReorder = async (bannerId: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === bannerId);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'up') {
      newIndex = currentIndex - 1;
      if (newIndex < 0) return; // Can't move up from first position
    } else {
      newIndex = currentIndex + 1;
      if (newIndex >= banners.length) return; // Can't move down from last position
    }

    // Create new order by swapping positions
    const reorderedBanners = [...banners];
    const [movedBanner] = reorderedBanners.splice(currentIndex, 1);
    reorderedBanners.splice(newIndex, 0, movedBanner);

    // Create bannerIds array in the new order
    const bannerIds = reorderedBanners.map(banner => banner.id);

    try {
      await adminBannerService.reorderBanners(bannerIds);
      await loadBanners();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder banner');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      link: '',
      buttonText: '',
      isActive: true,
      order: 1,
      startDate: '',
      endDate: '',
      categoryId: ''
    });
    setEditingBanner(null);
    setShowForm(false);
    setError(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600 mt-1">
            Manage hero banners with category selection for the home page
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Banner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Banner Position */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Position
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        formData.order === 1 ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {formData.order === 1 ? 'Large Hero Banner' : 'Grid Banner'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formData.order === 1 
                        ? 'This banner will appear as the large hero banner on the left side' 
                        : 'This banner will appear in the grid section on the right side'
                      }
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Type className="w-4 h-4 inline mr-2" />
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter banner title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter banner description"
                    rows={3}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    Banner Image *
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="banner-image-upload"
                      />
                      <label
                        htmlFor="banner-image-upload"
                        className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md border border-gray-300 flex items-center space-x-2 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploadingImage ? 'Uploading...' : 'Choose Image'}</span>
                      </label>
                      {uploadingImage && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                    {formData.image && (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Banner preview"
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Selection */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Category *
                   </label>
                   {loadingCategories ? (
                     <div className="flex items-center space-x-2">
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                       <span className="text-sm text-gray-500">Loading categories...</span>
                     </div>
                   ) : (
                     <>
                       <select
                         value={formData.categoryId}
                         onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                         required
                       >
                         <option value="">Select a category</option>
                         {categories.map(category => (
                           <option key={category.id} value={category.id} className={`${
                             category.level === 1 ? 'font-bold text-blue-800' :
                             category.level === 2 ? 'font-semibold text-green-700' :
                             'text-purple-600'
                           }`}>
                             {category.displayName || category.name}
                           </option>
                         ))}
                       </select>
                       <p className="text-sm text-gray-500 mt-1">
                         Select the category this banner will link to. Categories are shown with their hierarchy levels.
                       </p>
                     </>
                   )}
                 </div>

                 {/* Link and Button Text */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       <LinkIcon className="w-4 h-4 inline mr-2" />
                       Link URL
                     </label>
                     <input
                       type="url"
                       value={formData.link}
                       onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="https://example.com"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       <Type className="w-4 h-4 inline mr-2" />
                       Button Text
                     </label>
                     <input
                       type="text"
                       value={formData.buttonText}
                       onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Shop Now"
                     />
                   </div>
                 </div>

                {/* Order and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banner Order *
                    </label>
                    <select
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value={1}>1 - Large Hero Banner (Left Side)</option>
                      <option value={2}>2 - Grid Banner (Top Left)</option>
                      <option value={3}>3 - Grid Banner (Top Right)</option>
                      <option value={4}>4 - Grid Banner (Bottom Left)</option>
                      <option value={5}>5 - Grid Banner (Bottom Right)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Order 1 = Large hero banner, Orders 2-5 = Grid banners
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                          formData.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {formData.isActive ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                        <span>{formData.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={formData.startDate}
                    />
                  </div>
                </div>





                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || uploadingImage}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving...' : editingBanner ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Banner List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Banners</h2>
        </div>
        
        {banners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>No banners found. Create your first banner to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="w-16 h-10 object-cover rounded border"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                          {banner.subtitle && (
                            <div className="text-sm text-gray-500">{banner.subtitle}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {banner.description && (
                          <div className="mb-1">{banner.description}</div>
                        )}
                        {banner.link && (
                          <div className="text-blue-600 hover:text-blue-800">
                            <LinkIcon className="w-3 h-3 inline mr-1" />
                            {banner.buttonText || 'Link'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        banner.order === 1 ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {banner.order === 1 ? 'Large Hero Banner' : `Grid Banner ${banner.order}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {banner.categoryId ? (
                          <span className="text-blue-600">Category: {categories.find(c => c.id === banner.categoryId)?.name || banner.categoryId}</span>
                        ) : (
                          <span className="text-gray-500">No category</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Position: {banner.order === 1 ? 'Left Hero' : `Grid ${banner.order}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                          onClick={() => handleToggleStatus(banner.id, banner.isActive)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            banner.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                        {banner.isActive ? (
                          <Eye className="w-3 h-3 mr-1" />
                        ) : (
                          <EyeOff className="w-3 h-3 mr-1" />
                        )}
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">{banner.order}</span>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleReorder(banner.id, 'up')}
                            className="text-gray-400 hover:text-gray-600"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleReorder(banner.id, 'down')}
                            className="text-gray-400 hover:text-gray-600"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit banner"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            {/* Items per page selector */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </div>
            </div>
            
            {/* Pagination controls */}
            <div className="flex items-center justify-center space-x-1">
              {/* Previous button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm">Previous</span>
              </button>
              
              {/* Page numbers */}
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                // Adjust start page if we're near the end
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                // First page
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => setCurrentPage(1)}
                      className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" className="px-2 py-2 text-gray-500 text-sm">
                        ...
                      </span>
                    );
                  }
                }
                
                // Visible page range
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`px-3 py-2 rounded-md border text-sm ${
                        i === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                
                // Last page
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" className="px-2 py-2 text-gray-500 text-sm">
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pages;
              })()}
              
              {/* Next button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
              >
                <span className="text-sm">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManagement;