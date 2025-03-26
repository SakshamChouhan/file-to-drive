import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SaveIcon, X } from 'lucide-react';
import { Document } from '@shared/schema';

interface SaveToDriveModalProps {
  isOpen: boolean;
  document?: Document;
  onClose: () => void;
  onSave: (documentTitle: string, folder: string, permission: string) => Promise<void>;
}

const SaveToDriveModal: React.FC<SaveToDriveModalProps> = ({
  isOpen,
  document,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(document?.title || 'Untitled Letter');
  const [folder, setFolder] = useState('letters');
  const [permission, setPermission] = useState('private');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(title, folder, permission);
      onClose();
    } catch (error) {
      console.error('Error saving to Drive:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Save to Google Drive</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="documentTitle">Document title</Label>
            <Input
              id="documentTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="driveFolder">Save to folder</Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger id="driveFolder">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letters">Letters</SelectItem>
                <SelectItem value="work">Work Documents</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessPermission">Access permission</Label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger id="accessPermission">
                <SelectValue placeholder="Select permission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="anyone">Anyone with the link</SelectItem>
                <SelectItem value="domain">Anyone in your organization</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-[#4285F4] hover:bg-blue-600" 
            disabled={isSaving || !title.trim()}
          >
            <SaveIcon className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveToDriveModal;
