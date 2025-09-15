import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Package,
  Send,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { adminSupportService, SupportPriority, SupportStatus, SupportCategory } from '../services/supportService';
import type { SupportTicket } from '../services/supportService';

const SupportDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const ticketData = await adminSupportService.getTicket(ticketId!);
      setTicket(ticketData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;

    try {
      setSendingMessage(true);
      const updatedTicket = await adminSupportService.addAgentMessage(ticket.ticketId, {
        message: newMessage.trim()
      });
      setTicket(updatedTicket);
      setNewMessage('');
    } catch (error: any) {
      alert('Failed to send message: ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusUpdate = async (newStatus: SupportStatus) => {
    if (!ticket) return;

    try {
      setUpdatingStatus(true);
      const updatedTicket = await adminSupportService.updateTicket(ticket.ticketId, {
        status: newStatus
      });
      setTicket(updatedTicket);
    } catch (error: any) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityUpdate = async (newPriority: SupportPriority) => {
    if (!ticket) return;

    try {
      setUpdatingPriority(true);
      const updatedTicket = await adminSupportService.updateTicket(ticket.ticketId, {
        priority: newPriority
      });
      setTicket(updatedTicket);
    } catch (error: any) {
      alert('Failed to update priority: ' + error.message);
    } finally {
      setUpdatingPriority(false);
    }
  };

  const getStatusIcon = (status: SupportStatus) => {
    switch (status) {
      case SupportStatus.OPEN:
        return <AlertCircle className="w-4 h-4" />;
      case SupportStatus.IN_PROGRESS:
        return <Clock className="w-4 h-4" />;
      case SupportStatus.WAITING_FOR_CUSTOMER:
        return <MessageCircle className="w-4 h-4" />;
      case SupportStatus.RESOLVED:
        return <CheckCircle className="w-4 h-4" />;
      case SupportStatus.CLOSED:
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: SupportPriority) => {
    switch (priority) {
      case SupportPriority.URGENT:
      case SupportPriority.HIGH:
        return <TrendingUp className="w-4 h-4" />;
      case SupportPriority.MEDIUM:
      case SupportPriority.LOW:
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <TrendingDown className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading ticket details...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ticket</h3>
          <p className="text-gray-600 mb-4">{error || 'Ticket not found'}</p>
          <Link
            to="/support"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/support')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Support
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.ticketId}</h1>
              <p className="text-gray-600">{ticket.subject}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Ticket Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <p className="text-gray-900">{ticket.subject}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{adminSupportService.formatCategoryLabel(ticket.category)}</p>
                </div>
                {ticket.orderNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                    <p className="text-gray-900 flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      {ticket.orderNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Messages ({ticket.messages.length})</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {ticket.messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.senderType === 'agent'
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'bg-gray-50 border-l-4 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">
                        {message.senderType === 'agent' ? 'Support Agent' : 'Customer'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                </div>
              ))}
            </div>

            {/* Add Message Form */}
            <form onSubmit={handleSendMessage} className="mt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Agent Response
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{sendingMessage ? 'Sending...' : 'Send Response'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-3">
              {ticket.user && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{ticket.user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{ticket.user.phone}</p>
                  </div>
                  {ticket.user.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{ticket.user.email}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ticket Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Status & Priority</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusUpdate(e.target.value as SupportStatus)}
                  disabled={updatingStatus}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {adminSupportService.getStatusOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityUpdate(e.target.value as SupportPriority)}
                  disabled={updatingPriority}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {adminSupportService.getPriorityOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Ticket Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <div className="text-right">
                  <div className="text-sm text-gray-900">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <div className="text-right">
                  <div className="text-sm text-gray-900">{new Date(ticket.updatedAt).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{new Date(ticket.updatedAt).toLocaleTimeString()}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adminSupportService.getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1">{adminSupportService.formatStatusLabel(ticket.status)}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priority</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adminSupportService.getPriorityColor(ticket.priority)}`}>
                  {getPriorityIcon(ticket.priority)}
                  <span className="ml-1">{adminSupportService.formatPriorityLabel(ticket.priority)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDetail;