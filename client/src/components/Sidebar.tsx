import React from 'react';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { Document } from '@shared/schema';
import { DriveDocument } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Plus, FileText, Cloud } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SidebarProps {
  currentDocId?: number;
  onNewDocument: () => Promise<void>;
  onSelectDocument: (doc: Document) => void;
  className?: string;
  isVisible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentDocId, 
  onNewDocument, 
  onSelectDocument, 
  className = '',
  isVisible
}) => {
  const { documents, driveDocuments, isLoading, deleteDocument } = useDocuments();

  if (!isVisible) return null;
  
  return (
    <aside className={`w-72 bg-white border-r border-neutral-200 h-full overflow-y-auto ${className}`}>
      {/* Create New Button */}
      <div className="p-4">
        <Button 
          onClick={onNewDocument} 
          className="w-full bg-[#4285F4] text-white rounded-md py-6 px-4 flex items-center justify-center hover:bg-blue-600 transition"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Letter
        </Button>
      </div>
      
      {/* Document List */}
      <div className="px-2">
        <h2 className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">My Letters</h2>
        
        <div className="space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No letters found</div>
          ) : (
            documents.map((doc) => (
              <div 
                key={doc.id}
                className={`flex items-center p-2 rounded-md cursor-pointer ${
                  currentDocId === doc.id ? 'bg-blue-50 border-l-4 border-[#4285F4]' : 'hover:bg-gray-100'
                }`}
                onClick={() => onSelectDocument(doc)}
              >
                <FileText className="text-gray-400 mr-3 h-5 w-5" />
                <div className="flex-grow overflow-hidden">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {doc.lastSaved
                      ? `Edited ${formatDistanceToNow(new Date(doc.lastSaved), { addSuffix: true })}`
                      : 'Just created'}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this document?')) {
                        deleteDocument.mutate(doc.id);
                      }
                    }}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
        
        {/* Saved to Drive Section */}
        <h2 className="px-3 py-2 mt-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Saved to Drive</h2>
        
        <div className="space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : !driveDocuments || driveDocuments.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No documents saved to Drive</div>
          ) : (
            driveDocuments.map((doc: DriveDocument) => (
              <div 
                key={doc.id}
                className="flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100"
                onClick={() => window.open(doc.webViewLink, '_blank')}
              >
                <Cloud className="text-[#0F9D58] mr-3 h-5 w-5" />
                <div className="flex-grow overflow-hidden">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {doc.modifiedTime
                      ? `Saved ${formatDistanceToNow(new Date(doc.modifiedTime), { addSuffix: true })}`
                      : ''}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(doc.webViewLink, '_blank');
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
