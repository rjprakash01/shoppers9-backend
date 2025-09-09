import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Plus, Trash2, Check, X, Camera, Settings, Shield, CreditCard, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService, type Address } from '../services/auth';

interface EditableUser {
  name: string;
  email: string;
}

interface AddressForm {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  isDefault: boolean;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  const [profileForm, setProfileForm] = useState<EditableUser>({
    name: user?.name || '',
    email: user?.email || ''
  });
  
  const [addressForm, setAddressForm] = useState<AddressForm>({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false
  });
  
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      });
      // Only update addresses if we're not currently loading (to prevent state conflicts during operations)
      if (!isLoading) {
        setAddresses(user.addresses || []);
      }
    }
  }, [user, isLoading]);
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const updatedUser = await authService.updateProfile(profileForm);
      updateUser(updatedUser);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const validatePhoneNumber = (phone: string): boolean => {
    // Allow test phone number or valid Indian mobile numbers starting with 6-9
    return phone === '1234567890' || /^[6-9]\d{9}$/.test(phone);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!validatePhoneNumber(addressForm.phone)) {
      alert('Please enter a valid 10-digit Indian mobile number starting with 6-9, or use 1234567890 for testing');
      return;
    }
    
    setIsLoading(true);

    try {
      const newAddress = await authService.addAddress(addressForm);
      setAddresses(prev => [...prev, newAddress]);
      setAddressForm({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: false
      });
      setIsAddingAddress(false);
    } catch (error: any) {
      console.error('Failed to add address:', error);
      alert(error.response?.data?.message || 'Failed to add address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateAddress = async (addressId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!validatePhoneNumber(addressForm.phone)) {
      alert('Please enter a valid 10-digit Indian mobile number starting with 6-9, or use 1234567890 for testing');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const updatedAddress = await authService.updateAddress(addressId, addressForm);
      setAddresses(prev => prev.map(addr => 
        addr.id === addressId ? updatedAddress : addr
      ));
      setEditingAddressId(null);
      setAddressForm({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: false
      });
    } catch (error: any) {
      console.error('Failed to update address:', error);
      alert(error.response?.data?.message || 'Failed to update address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAddress = async (addressId: string) => {
    // Validate addressId
    if (!addressId) {
      console.error('Address ID is undefined or empty');
      alert('Error: Cannot delete address. Invalid address ID.');
      return;
    }
    
    // Prevent deletion if already loading
    if (isLoading) {
      console.log('Delete operation already in progress');
      return;
    }
    
    console.log('Attempting to delete address with ID:', addressId);
    
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this address?');
    if (!confirmed) {
      console.log('User cancelled address deletion');
      return;
    }
    
    console.log('User confirmed deletion, proceeding...');
    setIsLoading(true);
    
    try {
      // Call API to delete address
      console.log('Calling API to delete address:', addressId);
      await authService.deleteAddress(addressId);
      console.log('API call successful, updating local state');
      
      // Update local state only after successful API call
      setAddresses(prev => {
        const filtered = prev.filter(addr => addr.id !== addressId);
        console.log('Updated addresses count:', filtered.length);
        return filtered;
      });
      
      // Refresh user data to keep context in sync
      try {
        const updatedUser = await authService.fetchCurrentUser();
        updateUser(updatedUser);
        console.log('User context updated successfully');
      } catch (refreshError) {
        console.warn('Failed to refresh user data after address deletion:', refreshError);
        // If refresh fails, we still have the local state updated
      }
    } catch (error: any) {
      console.error('Failed to delete address:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete address. Please try again.';
      alert(errorMessage);
      
      // If deletion failed, refresh the addresses from user context to restore state
      if (user?.addresses) {
        console.log('Restoring addresses from user context');
        setAddresses(user.addresses);
      }
    } finally {
      setIsLoading(false);
      console.log('Delete operation completed');
    }
  };
  
  const startEditingAddress = (address: Address) => {
    setAddressForm({
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      isDefault: address.isDefault
    });
    setEditingAddressId(address.id);
  };
  
  const cancelEditing = () => {
    setEditingAddressId(null);
    setIsAddingAddress(false);
    setIsEditingProfile(false);
    setAddressForm({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: false
    });
    setProfileForm({
      name: user?.name || '',
      email: user?.email || ''
    });
  };
  
  const [activeTab, setActiveTab] = useState('profile');

  const menuItems = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full border border-brand-gold/20">
          <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-brand-indigo" />
          </div>
          <h2 className="text-2xl font-bold font-playfair text-brand-indigo mb-2">Access Required</h2>
          <p className="text-brand-indigo/70 font-poppins mb-6">Please log in to view your profile and manage your account.</p>
          <button className="w-full bg-brand-gold text-brand-indigo py-3 px-6 rounded-xl font-semibold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold transition-all duration-300">
            Sign In
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5">
      {/* Header */}
      <div className="bg-brand-indigo shadow-sm border-b border-brand-gold/20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold font-playfair text-brand-gold">
              My Account
            </h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-brand-gold hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-brand-gold/20">
              {/* Profile Header */}
              <div className="bg-brand-indigo px-6 py-8 text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="h-10 w-10 text-brand-indigo" />
                  </div>
                  <button className="absolute bottom-3 right-0 bg-brand-gold rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow">
                    <Camera className="h-4 w-4 text-brand-indigo" />
                  </button>
                </div>
                <h3 className="text-xl font-bold font-playfair text-brand-gold">{user.name || 'User'}</h3>
                <p className="text-brand-slate text-sm font-poppins">{user.email}</p>
              </div>

              {/* Navigation Menu */}
              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-brand-gold text-brand-indigo shadow-lg'
                          : 'text-brand-indigo hover:bg-brand-gold/10'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium font-poppins">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-8 lg:mt-0 lg:col-span-9">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-brand-gold/20">
                <div className="bg-brand-indigo px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold font-playfair text-brand-gold">Profile Information</h2>
                    {!isEditingProfile && (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="flex items-center bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm font-poppins"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
          
          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 h-5 w-5 text-purple-400" />
                    <input
                      type="text"
                      value={profileForm?.name || ''}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 h-5 w-5 text-purple-400" />
                    <input
                      type="email"
                      value={profileForm?.email || ''}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex items-center justify-center bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 p-2 rounded-lg mr-4">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Full Name</p>
                    <p className="text-lg font-semibold text-gray-900">{user.name || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Email Address</p>
                    <p className="text-lg font-semibold text-gray-900">{user.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 md:col-span-2">
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-2 rounded-lg mr-4">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Mobile Number</p>
                    <p className="text-lg font-semibold text-gray-900">+91 {user.phone}</p>
                  </div>
                </div>
              </div>
                </div>
              )}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Saved Addresses</h2>
                    {!isAddingAddress && (
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
          
          {/* Add Address Form */}
          {isAddingAddress && (
            <form onSubmit={handleAddAddress} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Address</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={addressForm?.name || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={addressForm?.phone || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length <= 10) {
                        setAddressForm(prev => ({ ...prev, phone: value }));
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter 10-digit phone number (e.g., 9876543210)"
                    maxLength={10}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a valid 10-digit Indian mobile number starting with 6-9, or use 1234567890 for testing
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={addressForm?.addressLine1 || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="House/Flat/Block No., Building Name"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={addressForm?.addressLine2 || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Street Name, Area, Colony (Optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={addressForm?.city || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter city"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={addressForm?.state || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter state"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    value={addressForm?.pincode || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter PIN code"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={addressForm?.landmark || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nearby landmark (Optional)"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Set as default address</span>
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isLoading ? 'Adding...' : 'Add Address'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex items-center bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {/* Address List */}
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No addresses saved yet</p>
                <p className="text-sm text-gray-400">Add an address to get started</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                  {editingAddressId === address.id ? (
                    <form onSubmit={(e) => handleUpdateAddress(address.id, e)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={addressForm?.name || ''}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={addressForm?.phone || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                              if (value.length <= 10) {
                                setAddressForm(prev => ({ ...prev, phone: value }));
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter 10-digit phone number (e.g., 9876543210)"
                            maxLength={10}
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter a valid 10-digit Indian mobile number starting with 6-9, or use 1234567890 for testing
                          </p>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            value={addressForm?.addressLine1 || ''}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={addressForm?.addressLine2 || ''}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={addressForm?.city || ''}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            value={addressForm?.state || ''}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            PIN Code *
                          </label>
                          <input
                            type="text"
                            value={addressForm?.pincode || ''}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Landmark
                          </label>
                          <input
                            type="text"
                            value={addressForm?.landmark || ''}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={addressForm.isDefault}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Set as default address</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 mt-4">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {isLoading ? 'Updating...' : 'Update'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="flex items-center bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                          <div>
                            <p className="text-gray-900 font-medium">{address.name}</p>
                            <p className="text-gray-600 text-sm">{address.phone}</p>
                            <p className="text-gray-900 mt-1">{address.addressLine1}</p>
                            {address.addressLine2 && (
                              <p className="text-gray-900">{address.addressLine2}</p>
                            )}
                            <p className="text-gray-600">
                              {address.city}, {address.state} {address.pincode}
                            </p>
                            {address.landmark && (
                              <p className="text-gray-600 text-sm">Landmark: {address.landmark}</p>
                            )}
                            {address.isDefault && (
                              <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full mt-2">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditingAddress(address)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for address:', address);
                              console.log('Address ID:', address.id);
                              console.log('Address _id:', address._id);
                              handleDeleteAddress(address.id || address._id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Security Settings</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-red-100 p-2 rounded-lg mr-4">
                          <Shield className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                          <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                        </div>
                      </div>
                      <button className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                        Change Password
                      </button>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-green-100 p-2 rounded-lg mr-4">
                            <Bell className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
                            <p className="text-sm text-gray-600">Receive order updates and promotions via email</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-lg mr-4">
                            <Bell className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">SMS Notifications</h3>
                            <p className="text-sm text-gray-600">Get order updates via SMS</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-yellow-100 p-2 rounded-lg mr-4">
                            <Bell className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Marketing Communications</h3>
                            <p className="text-sm text-gray-600">Receive promotional offers and new product updates</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
         </div>
       </div>
     </div>
   );
};

export default Profile;