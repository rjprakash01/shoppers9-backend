import React, { useState } from 'react';
import AuthToggle from '../components/AuthToggle';

const Register: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  
  return <AuthToggle mode={mode} onModeChange={setMode} />;
};

export default Register;