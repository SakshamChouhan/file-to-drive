import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder as FolderIcon, Trash2 } from 'lucide-react';
import { Document } from '@shared/schema';
import { DriveDocument } from '@/lib/api';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useDocuments } from '@/hooks/useDocuments';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FolderProps {
  name: string;
  documents: (Document | DriveDocument)[];
  currentDocId?: number;
  onSelectDocument: (doc: Document | DriveDocument) => void;
  showDeleteButton?: boolean;
}

const Folder: React.FC<FolderProps> = ({
  name,
  documents,
  currentDocId,
  onSelectDocument,
  showDeleteButton = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const { deleteDocument } = useDocuments();

  const handleDelete = async (doc: Document) => {
    try {
      await deleteDocument.mutateAsync(doc.id);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
      // You might want to show an error toast here
    }
  };

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        className="w-full justify-start px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center space-x-2">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <FolderIcon className="h-4 w-4" />
          <span>{name}</span>
          <span className="text-gray-500 text-sm">({documents.length})</span>
        </span>
      </Button>
      {isOpen && (
        <div className="ml-6 space-y-1">
          {documents.map((doc) => {
            const isGoogleDoc = 'webViewLink' in doc;
            const title = isGoogleDoc ? doc.name : (doc.title || 'Untitled Letter');
            const lastModified = isGoogleDoc ? doc.modifiedTime : doc.lastSaved;

            return (
              <Button
                key={doc.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start px-2 hover:bg-gray-100 dark:hover:bg-gray-800 group",
                  currentDocId === doc.id && "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                )}
                onClick={() => onSelectDocument(doc)}
              >
                <span className="flex items-center space-x-2 w-full">
                  <span className="material-icons text-sm">
                    {isGoogleDoc ? 'cloud_done' : 'description'}
                  </span>
                  <span className="flex-grow truncate text-left">{title}</span>
                  {lastModified && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(lastModified), { addSuffix: true })}
                    </span>
                  )}
                  {showDeleteButton && !isGoogleDoc && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-7 w-7 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentToDelete(doc as Document);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                    </Button>
                  )}
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.title || 'Untitled Letter'}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => documentToDelete && handleDelete(documentToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface FoldersProps {
  documents: Document[];
  driveDocuments: DriveDocument[];
  currentDocId?: number;
  onSelectDocument: (doc: Document | DriveDocument) => void;
}

const Folders: React.FC<FoldersProps> = ({
  documents,
  driveDocuments,
  currentDocId,
  onSelectDocument,
}) => {
  return (
    <div className="space-y-2 py-2">
      <Folder
        name="My Letters"
        documents={documents}
        currentDocId={currentDocId}
        onSelectDocument={onSelectDocument}
        showDeleteButton={true}
      />
      <Folder
        name="Saved to Drive"
        documents={driveDocuments}
        currentDocId={currentDocId}
        onSelectDocument={onSelectDocument}
      />
    </div>
  );
};

export default Folders;
