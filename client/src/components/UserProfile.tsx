import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  
  if (!user) {
    return null;
  }
  
  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className={`relative ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center focus:outline-none" aria-label="User menu">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.profilePicture} alt={user.displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <ChevronDown className="text-gray-500 ml-1 h-4 w-4" />
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-4 py-2 border-b border-neutral-200">
            <p className="text-sm font-semibold">{user.displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfile;
