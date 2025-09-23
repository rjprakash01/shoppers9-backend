import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const TestOrders: React.FC = () => {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('TestOrders component mounted');
    addLog(`User: ${user ? user.email : 'Not logged in'}`);
    addLog(`Token: ${token ? 'Present' : 'Not present'}`);
    addLog(`LocalStorage adminToken: ${localStorage.getItem('adminToken') ? 'Present' : 'Not present'}`);
    addLog(`LocalStorage adminUser: ${localStorage.getItem('adminUser') ? 'Present' : 'Not present'}`);
  }, [user, token]);

  const testLogin = async () => {
    try {
      setLoading(true);
      addLog('Starting test login...');
      
      const result = await authService.login('admin@shoppers9.com', 'Admin@123');
      addLog(`Login result: ${JSON.stringify(result)}`);
      
      if (result.success) {
        addLog('Login successful!');
        addLog(`Token after login: ${localStorage.getItem('adminToken') ? 'Present' : 'Not present'}`);
      } else {
        addLog(`Login failed: ${result.message}`);
      }
    } catch (error: any) {
      addLog(`Login error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testOrdersAPI = async () => {
    try {
      setLoading(true);
      addLog('Testing orders API...');
      
      const token = localStorage.getItem('adminToken');
      addLog(`Using token: ${token ? token.substring(0, 20) + '...' : 'No token'}`);
      
      const result = await authService.getAllOrders(1, 10, '');
      addLog(`Orders API result: ${JSON.stringify(result, null, 2)}`);
      
      if (result.orders) {
        setOrders(result.orders);
        addLog(`Found ${result.orders.length} orders`);
      }
    } catch (error: any) {
      addLog(`Orders API error: ${error.message}`);
      addLog(`Error details: ${JSON.stringify(error.response?.data || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Orders API Test</h1>
      
      <div className="mb-4 space-x-2">
        <button 
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Login
        </button>
        
        <button 
          onClick={testOrdersAPI}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Orders API
        </button>
        
        <button 
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
          <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Orders ({orders.length})</h2>
          <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto">
            {orders.map((order, index) => (
              <div key={index} className="mb-4 p-2 bg-white rounded">
                <div className="text-sm">
                  <strong>Order:</strong> {order.orderNumber}<br/>
                  <strong>Status:</strong> {order.orderStatus}<br/>
                  <strong>Total:</strong> ${order.totalAmount}<br/>
                  <strong>Items:</strong> {order.items?.length || 0}<br/>
                  <strong>Customer:</strong> {order.customer?.firstName} {order.customer?.lastName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestOrders;