import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  details?: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number; // in milliseconds
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  details,
  type = 'success', 
  onDismiss,
  duration = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for animation to complete
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-[#0F9D58]" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-[#DB4437]" />;
      case 'info':
        return <Info className="h-6 w-6 text-[#4285F4]" />;
    }
  };
  
  return (
    <div 
      className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center max-w-md z-50 transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
    >
      <div className="mr-3">
        {getIcon()}
      </div>
      <div className="flex-grow">
        <p className="font-medium">{message}</p>
        {details && <p className="text-sm text-gray-500">{details}</p>}
      </div>
      <button 
        className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        onClick={() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;
