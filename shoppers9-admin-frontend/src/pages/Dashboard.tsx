import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoleDashboard from '../components/RoleDashboard';
import { Shield } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
        </div>
      </div>
      
      <RoleDashboard />
    </div>
  );
};

export default Dashboard;