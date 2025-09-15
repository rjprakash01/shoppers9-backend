import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthToggle from '../components/AuthToggle';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  return <AuthToggle mode={mode} onModeChange={setMode} />;
};

export default Login;