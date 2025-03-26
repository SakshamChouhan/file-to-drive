import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from '@/components/LoginModal';

const Login: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/');
    }
  }, [isLoading, isAuthenticated, setLocation]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <LoginModal isVisible={!isLoading && !isAuthenticated} />
    </div>
  );
};

export default Login;
