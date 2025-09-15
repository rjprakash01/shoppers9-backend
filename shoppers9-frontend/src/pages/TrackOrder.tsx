import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  ArrowLeft,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import { trackingService } from '../services/trackingService';

interface TrackingEvent {
  _id?: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
  estimatedDelivery?: string;
}

interface TrackingInfo {
  shipmentId: string;
  trackingNumber: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingEvents: TrackingEvent[];
  providerInfo: {
    name: string;
    trackingUrl?: string;
  };
}

const TrackOrder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('tracking') || '');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const tracking = searchParams.get('tracking');
    if (tracking) {
      setTrackingNumber(tracking);
      handleTrackOrder(tracking);
    }
  }, [searchParams]);

  const handleTrackOrder = async (tracking?: string) => {
    const numberToTrack = tracking || trackingNumber;
    
    if (!numberToTrack.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      
      const info = await trackingService.getTrackingInfo(numberToTrack.trim());
      setTrackingInfo(info);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch tracking information');
      setTrackingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_transit':
      case 'picked_up':
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'failed_delivery':
      case 'returned':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'in_transit':
      case 'picked_up':
      case 'out_for_delivery':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed_delivery':
      case 'returned':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-gray-600 mt-2">
            Enter your tracking number to get real-time updates on your shipment
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="tracking" className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
                  placeholder="Enter your tracking number (e.g., BLUEDART123456)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:self-end">
              <button
                onClick={() => handleTrackOrder()}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {searched && !loading && !trackingInfo && !error && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracking Information Found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any information for tracking number: <strong>{trackingNumber}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Please check your tracking number and try again, or contact customer support if you need assistance.
            </p>
          </div>
        )}

        {/* Tracking Information */}
        {trackingInfo && (
          <div className="space-y-6">
            {/* Shipment Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Shipment {trackingInfo.shipmentId}
                  </h2>
                  <p className="text-gray-600">
                    Tracking Number: <span className="font-medium">{trackingInfo.trackingNumber}</span>
                  </p>
                </div>
                <div className="mt-4 lg:mt-0">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(trackingInfo.status)
                  }`}>
                    {getStatusIcon(trackingInfo.status)}
                    <span className="ml-2">{formatStatus(trackingInfo.status)}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Current Location</p>
                    <p className="font-medium text-gray-900">
                      {trackingInfo.currentLocation || 'In Transit'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-medium text-gray-900">
                      {trackingInfo.estimatedDelivery 
                        ? formatDate(trackingInfo.estimatedDelivery).date
                        : 'TBD'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Carrier</p>
                    <p className="font-medium text-gray-900">{trackingInfo.providerInfo.name}</p>
                  </div>
                </div>
              </div>

              {trackingInfo.actualDelivery && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">
                      Delivered on {formatDate(trackingInfo.actualDelivery).date} at {formatDate(trackingInfo.actualDelivery).time}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Tracking History</h3>
              
              <div className="space-y-6">
                {trackingInfo.trackingEvents.map((event, index) => {
                  const isLatest = index === 0;
                  const formatted = formatDate(event.timestamp);
                  
                  return (
                    <div key={event._id || index} className="relative">
                      {/* Timeline line */}
                      {index < trackingInfo.trackingEvents.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Status icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          isLatest ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getStatusIcon(event.status)}
                        </div>
                        
                        {/* Event details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h4 className={`text-sm font-medium ${
                                isLatest ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {formatStatus(event.status)}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              {event.location && (
                                <p className="text-sm text-gray-500 mt-1 flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 sm:mt-0 text-right">
                              <p className="text-sm font-medium text-gray-900">{formatted.date}</p>
                              <p className="text-sm text-gray-500">{formatted.time}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Provider Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Provider</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{trackingInfo.providerInfo.name}</p>
                  <p className="text-sm text-gray-600">Logistics Partner</p>
                </div>
                
                {trackingInfo.providerInfo.trackingUrl && (
                  <a
                    href={`${trackingInfo.providerInfo.trackingUrl}?tracking=${trackingInfo.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Track on Provider Site
                  </a>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Need Help?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Customer Support</p>
                    <p className="text-sm text-blue-700">1800-123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Email Support</p>
                    <p className="text-sm text-blue-700">support@shoppers9.com</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-blue-700 mt-4">
                If you have any questions about your shipment or need assistance, 
                please don't hesitate to contact our customer support team.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;