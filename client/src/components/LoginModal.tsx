import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

interface LoginModalProps {
  isVisible: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <span className="material-icons text-[#4285F4] text-4xl">description</span>
            <h2 className="text-2xl font-bold mt-2">Welcome to LetterDrive</h2>
            <p className="text-gray-600 mt-1">Create and save letters directly to your Google Drive</p>
          </div>
          
          <div className="border-t border-b border-gray-200 py-6 my-6">
            <p className="text-sm text-gray-600 mb-4 text-center">Sign in to access your letters and drafts</p>
            
            <Button 
              onClick={handleGoogleLogin} 
              variant="outline" 
              className="w-full flex items-center justify-center py-6"
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              <span className="font-medium">Sign in with Google</span>
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our <a href="#" className="text-[#4285F4] hover:underline">Terms of Service</a> and <a href="#" className="text-[#4285F4] hover:underline">Privacy Policy</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginModal;
