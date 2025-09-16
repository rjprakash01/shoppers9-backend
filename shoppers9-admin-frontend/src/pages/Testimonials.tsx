import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Eye, 
  EyeOff, 
  CheckCircle,
  Search,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';

interface Testimonial {
  _id: string;
  customerName: string;
  customerEmail?: string;
  customerLocation?: string;
  customerTitle?: string;
  title: string;
  content: string;
  rating: number;
  productName?: string;
  orderNumber?: string;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  category: 'product' | 'service' | 'delivery' | 'support' | 'general';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface TestimonialStats {
  total: number;
  active: number;
  featured: number;
  verified: number;
  averageRating: number;
}

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<TestimonialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    title: '',
    content: '',
    rating: 5,
    isActive: true,
    isFeatured: false
  });

  // Fetch testimonials
  const fetchTestimonials = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(filterStatus !== 'all' && { 
          ...(filterStatus === 'active' && { isActive: 'true' }),
          ...(filterStatus === 'inactive' && { isActive: 'false' }),
          ...(filterStatus === 'featured' && { isFeatured: 'true' }),
          ...(filterStatus === 'verified' && { isVerified: 'true' })
        })
      });
      
      const response = await api.get(`/admin/testimonials?${params}`);
      setTestimonials(response.data.data.testimonials);
      setTotalPages(response.data.data.pagination.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      alert('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/testimonials/stats');
      setStats(response.data.data.overview);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchTestimonials();
    fetchStats();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || filterCategory !== 'all' || filterStatus !== 'all') {
        fetchTestimonials(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filterCategory, filterStatus]);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create testimonial
  const handleCreate = async () => {
    try {
      setSaving(true);
      const submitData = {
        ...formData,
        category: 'general',
        tags: []
      };
      
      await api.post('/admin/testimonials', submitData);
      alert('Testimonial created successfully!');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchTestimonials();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating testimonial:', error);
      alert(error.response?.data?.message || 'Failed to create testimonial');
    } finally {
      setSaving(false);
    }
  };

  // Edit testimonial
  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      customerName: testimonial.customerName,
      title: testimonial.title,
      content: testimonial.content,
      rating: testimonial.rating,
      isActive: testimonial.isActive,
      isFeatured: testimonial.isFeatured
    });
    setIsEditDialogOpen(true);
  };

  // Update testimonial
  const handleUpdate = async () => {
    if (!editingTestimonial) return;
    
    try {
      setSaving(true);
      const submitData = {
        ...formData,
        category: 'general',
        tags: []
      };
      
      await api.put(`/admin/testimonials/${editingTestimonial._id}`, submitData);
      alert('Testimonial updated successfully!');
      setIsEditDialogOpen(false);
      setEditingTestimonial(null);
      resetForm();
      fetchTestimonials();
      fetchStats();
    } catch (error: any) {
      console.error('Error updating testimonial:', error);
      alert(error.response?.data?.message || 'Failed to update testimonial');
    } finally {
      setSaving(false);
    }
  };

  // Delete testimonial
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }
    
    try {
      await api.delete(`/admin/testimonials/${id}`);
      alert('Testimonial deleted successfully!');
      fetchTestimonials();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting testimonial:', error);
      alert(error.response?.data?.message || 'Failed to delete testimonial');
    }
  };

  // Toggle feature status
  const handleToggleFeature = async (id: string) => {
    try {
      await api.patch(`/admin/testimonials/${id}/toggle-feature`);
      alert('Testimonial feature status updated!');
      fetchTestimonials();
      fetchStats();
    } catch (error: any) {
      console.error('Error toggling feature:', error);
      alert(error.response?.data?.message || 'Failed to update feature status');
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string) => {
    try {
      await api.patch(`/admin/testimonials/${id}/toggle-active`);
      alert('Testimonial status updated!');
      fetchTestimonials();
      fetchStats();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Verify testimonial
  const handleVerify = async (id: string) => {
    try {
      await api.patch(`/admin/testimonials/${id}/verify`);
      alert('Testimonial verified successfully!');
      fetchTestimonials();
      fetchStats();
    } catch (error: any) {
      console.error('Error verifying testimonial:', error);
      alert(error.response?.data?.message || 'Failed to verify testimonial');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      customerName: '',
      title: '',
      content: '',
      rating: 5,
      isActive: true,
      isFeatured: false
    });
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors = {
      product: 'bg-blue-100 text-blue-800',
      service: 'bg-green-100 text-green-800',
      delivery: 'bg-purple-100 text-purple-800',
      support: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  if (loading && testimonials.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading testimonials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Testimonials</h1>
        </div>
        
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{stats.featured}</div>
            <div className="text-sm text-gray-600">Featured</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-purple-600">{stats.verified}</div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="delivery">Delivery</option>
            <option value="support">Support</option>
            <option value="general">General</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="grid gap-4">
        {testimonials.map((testimonial) => (
          <div key={testimonial._id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold">{testimonial.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(testimonial.category)}`}>
                    {testimonial.category}
                  </span>
                  {testimonial.isFeatured && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Featured</span>
                  )}
                  {testimonial.isVerified && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Verified</span>
                  )}
                  {!testimonial.isActive && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">{testimonial.customerName}</span>
                  {testimonial.customerLocation && (
                    <span className="text-sm text-gray-500">• {testimonial.customerLocation}</span>
                  )}
                  <div className="flex items-center space-x-1">
                    {renderStars(testimonial.rating)}
                    <span className="text-sm text-gray-600">({testimonial.rating})</span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-2">{testimonial.content}</p>
                
                {testimonial.productName && (
                  <p className="text-sm text-gray-500">Product: {testimonial.productName}</p>
                )}
                
                {testimonial.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {testimonial.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded"
                  onClick={() => handleEdit(testimonial)}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                
                <button
                  className="p-2 text-gray-600 hover:text-green-600 border border-gray-300 rounded"
                  onClick={() => handleToggleActive(testimonial._id)}
                  title={testimonial.isActive ? 'Deactivate' : 'Activate'}
                >
                  {testimonial.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                
                <button
                  className="p-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded"
                  onClick={() => handleDelete(testimonial._id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            onClick={() => fetchTestimonials(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            onClick={() => fetchTestimonials(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create New Testimonial</h2>
                <button
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                   <input
                     value={formData.customerName}
                     onChange={(e) => handleInputChange('customerName', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Title *</label>
                   <input
                     value={formData.title}
                     onChange={(e) => handleInputChange('title', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Content *</label>
                   <textarea
                     value={formData.content}
                     onChange={(e) => handleInputChange('content', e.target.value)}
                     rows={4}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
                     <select
                       value={formData.rating.toString()}
                       onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="1">1 Star</option>
                       <option value="2">2 Stars</option>
                       <option value="3">3 Stars</option>
                       <option value="4">4 Stars</option>
                       <option value="5">5 Stars</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={formData.isActive}
                         onChange={(e) => handleInputChange('isActive', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-medium text-gray-700">Active</span>
                     </label>
                   </div>
                   
                   <div>
                     <label className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={formData.isFeatured}
                         onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-medium text-gray-700">Featured</span>
                     </label>
                   </div>
                 </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                     className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                     onClick={handleCreate}
                     disabled={saving || !formData.customerName || !formData.title || !formData.content}
                   >
                     {saving ? (
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     ) : null}
                     Create Testimonial
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Edit Dialog */}
       {isEditDialogOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold">Edit Testimonial</h2>
                 <button
                   onClick={() => {
                     setIsEditDialogOpen(false);
                     setEditingTestimonial(null);
                     resetForm();
                   }}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   ×
                 </button>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                   <input
                     value={formData.customerName}
                     onChange={(e) => handleInputChange('customerName', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Title *</label>
                   <input
                     value={formData.title}
                     onChange={(e) => handleInputChange('title', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Content *</label>
                   <textarea
                     value={formData.content}
                     onChange={(e) => handleInputChange('content', e.target.value)}
                     rows={4}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
                     <select
                       value={formData.rating.toString()}
                       onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="1">1 Star</option>
                       <option value="2">2 Stars</option>
                       <option value="3">3 Stars</option>
                       <option value="4">4 Stars</option>
                       <option value="5">5 Stars</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={formData.isActive}
                         onChange={(e) => handleInputChange('isActive', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-medium text-gray-700">Active</span>
                     </label>
                   </div>
                   
                   <div>
                     <label className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={formData.isFeatured}
                         onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-medium text-gray-700">Featured</span>
                     </label>
                   </div>
                 </div>
                 
                 <div className="flex justify-end space-x-2 pt-4">
                   <button
                     className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                     onClick={() => {
                       setIsEditDialogOpen(false);
                       setEditingTestimonial(null);
                       resetForm();
                     }}
                   >
                     Cancel
                   </button>
                   
                   <button
                     className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                     onClick={handleUpdate}
                     disabled={saving || !formData.customerName || !formData.title || !formData.content}
                   >
                     {saving ? (
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     ) : null}
                     Update Testimonial
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default Testimonials;