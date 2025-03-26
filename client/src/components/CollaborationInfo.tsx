import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Activity, Users } from 'lucide-react';

interface Collaborator {
  id: number;
  displayName: string;
  profilePicture?: string;
  lastActive: Date;
}

interface CollaborationInfoProps {
  documentId: string;
  collaborators: Collaborator[];
}

export function CollaborationInfo({ documentId, collaborators }: CollaborationInfoProps) {
  const [activeUsers, setActiveUsers] = useState<Collaborator[]>(collaborators || []);
  
  // Remove users who haven't been active in the last 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      setActiveUsers(prevUsers => 
        prevUsers.filter(user => {
          const timeDiff = now.getTime() - new Date(user.lastActive).getTime();
          const minutesDiff = timeDiff / (1000 * 60);
          return minutesDiff < 5;
        })
      );
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // No collaborators, don't show anything
  if (activeUsers.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-2 p-2 bg-primary/5 rounded-md">
      <div className="flex items-center text-sm">
        <Activity size={16} className="mr-1 text-green-500" />
        <span className="mr-2 font-medium text-primary/80">Collaborating with:</span>
      </div>
      
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map(user => (
          <TooltipProvider key={user.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background">
                  {user.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.displayName} />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-xs text-primary">
                      {user.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.displayName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        
        {activeUsers.length > 3 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="bg-primary/20 text-xs">
                    +{activeUsers.length - 3}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {activeUsers.slice(3).map(user => (
                    <p key={user.id}>{user.displayName}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Badge variant="outline" className="ml-2">
        <Users size={12} className="mr-1" />
        {activeUsers.length}
      </Badge>
    </div>
  );
}