import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDocuments } from '@/hooks/useDocuments';
import Folders from './Folders';
import { Document } from '@shared/schema';
import { DriveDocument } from '@/lib/api';

interface SidebarProps {
  currentDocId?: number;
  onNewDocument: () => void;
  onSelectDocument: (document: Document | DriveDocument) => void;
  className?: string;
  isVisible?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentDocId,
  onNewDocument,
  onSelectDocument,
  className,
  isVisible = true
}) => {
  const { documents, driveDocuments } = useDocuments();

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn("w-64 border-r bg-white flex flex-col", className)}>
      {/* New Letter Button */}
      <div className="p-4">
        <Button
          onClick={onNewDocument}
          className="w-full bg-[#4285F4] text-white hover:bg-[#3367D6] transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Letter
        </Button>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-4">
        <Folders
          documents={documents || []}
          driveDocuments={driveDocuments || []}
          currentDocId={currentDocId}
          onSelectDocument={onSelectDocument}
        />
      </div>
    </div>
  );
};

export default Sidebar;
