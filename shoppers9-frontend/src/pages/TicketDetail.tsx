import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Clock, CheckCircle, XCircle, AlertCircle, MessageCircle, User, Headphones } from 'lucide-react';
import { supportService, SupportStatus } from '../services/support';
import type { SupportTicket, AddMessageRequest } from '../services/support';
import { useAuth } from '../contexts/AuthContext';

const TicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'close' | 'reopen' | null>(null);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!ticketId) {
        throw new Error('Ticket ID is required');
      }
      
      const ticketData = await supportService.getTicket(ticketId);
      setTicket(ticketData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !ticketId) {
      return;
    }

    try {
      setSendingMessage(true);
      setMessageError(null);
      
      const messageData: AddMessageRequest = {
        message: newMessage.trim()
      };

      const updatedTicket = await supportService.addMessage(ticketId, messageData);
      setTicket(updatedTicket);
      setNewMessage('');
      
    } catch (error: any) {
      setMessageError(error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticketId || !ticket) return;
    
    try {
      setActionLoading('close');
      const updatedTicket = await supportService.closeTicket(ticketId);
      setTicket(updatedTicket);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenTicket = async () => {
    if (!ticketId || !ticket) return;
    
    try {
      setActionLoading('reopen');
      const updatedTicket = await supportService.reopenTicket(ticketId);
      setTicket(updatedTicket);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: SupportStatus) => {
    switch (status) {
      case SupportStatus.OPEN:
        return <AlertCircle className="w-5 h-5" />;
      case SupportStatus.IN_PROGRESS:
        return <Clock className="w-5 h-5" />;
      case SupportStatus.WAITING_FOR_CUSTOMER:
        return <MessageCircle className="w-5 h-5" />;
      case SupportStatus.RESOLVED:
        return <CheckCircle className="w-5 h-5" />;
      case SupportStatus.CLOSED:
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: SupportStatus) => {
    switch (status) {
      case SupportStatus.OPEN:
        return 'text-blue-600 bg-blue-100';
      case SupportStatus.IN_PROGRESS:
        return 'text-yellow-600 bg-yellow-100';
      case SupportStatus.WAITING_FOR_CUSTOMER:
        return 'text-orange-600 bg-orange-100';
      case SupportStatus.RESOLVED:
        return 'text-green-600 bg-green-100';
      case SupportStatus.CLOSED:
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const canSendMessage = ticket && ticket.status !== SupportStatus.CLOSED;
  const canCloseTicket = ticket && ticket.status !== SupportStatus.CLOSED;
  const canReopenTicket = ticket && ticket.status === SupportStatus.CLOSED;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view support tickets.</p>
          <Link 
            to="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading ticket...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Ticket</h2>
          <p className="text-gray-600 mb-6">{error || 'Ticket not found'}</p>
          <div className="space-x-4">
            <button
              onClick={loadTicket}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/support"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  to="/support"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {ticket.subject}
                  </h1>
                  <p className="text-gray-600 mt-1">Ticket #{ticket.ticketId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span className="ml-2">{supportService.formatStatusLabel(ticket.status)}</span>
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                  {supportService.formatPriorityLabel(ticket.priority)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Ticket Details */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Ticket Details</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-medium text-gray-900">Conversation</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {ticket.messages.map((message, index) => (
                    <div key={index} className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.senderType === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          {message.senderType === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Headphones className="w-4 h-4" />
                          )}
                          <span className="text-xs font-medium">
                            {message.senderType === 'user' ? 'You' : 'Support Agent'}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-2 ${
                          message.senderType === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {canSendMessage && (
                  <div className="mt-6 border-t pt-6">
                    {messageError && (
                      <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-red-700 text-sm">{messageError}</span>
                        </div>
                      </div>
                    )}
                    
                    <form onSubmit={handleSendMessage} className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          maxLength={2000}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {newMessage.length}/2000 characters
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 h-fit"
                      >
                        {sendingMessage ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}

                {ticket.status === SupportStatus.CLOSED && (
                  <div className="mt-6 border-t pt-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">This ticket is closed. You cannot send new messages.</p>
                      {canReopenTicket && (
                        <button
                          onClick={handleReopenTicket}
                          disabled={actionLoading === 'reopen'}
                          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === 'reopen' ? 'Reopening...' : 'Reopen Ticket'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 font-medium">{supportService.formatCategoryLabel(ticket.category)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Priority:</span>
                  <span className="ml-2 font-medium">{supportService.formatPriorityLabel(ticket.priority)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="ml-2">{new Date(ticket.updatedAt).toLocaleString()}</span>
                </div>
                {ticket.orderNumber && (
                  <div>
                    <span className="text-gray-500">Order Number:</span>
                    <span className="ml-2 font-medium">{ticket.orderNumber}</span>
                  </div>
                )}
                {ticket.assignedTo && (
                  <div>
                    <span className="text-gray-500">Assigned to:</span>
                    <span className="ml-2 font-medium">{ticket.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {canCloseTicket && (
                  <button
                    onClick={handleCloseTicket}
                    disabled={actionLoading === 'close'}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'close' ? 'Closing...' : 'Close Ticket'}
                  </button>
                )}
                
                <Link
                  to="/support"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                >
                  Back to All Tickets
                </Link>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Need immediate help?</h4>
              <p className="text-sm text-blue-800 mb-3">
                For urgent issues, you can also contact us directly:
              </p>
              <div className="text-sm text-blue-800 space-y-1">
                <p>📞 Phone: +1 (555) 123-4567</p>
                <p>📧 Email: support@shoppers9.com</p>
                <p>💬 Live Chat: Available 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;