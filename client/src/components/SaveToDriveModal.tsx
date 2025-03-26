import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CloudUpload, Folder, FolderPlus, Loader2, X } from 'lucide-react';
import { Document } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Category {
  id: string;
  name: string;
}

interface SaveToDriveModalProps {
  isOpen: boolean;
  document?: Document;
  onClose: () => void;
  onSave: (documentTitle: string, category: string, permission: string) => Promise<void>;
}

const SaveToDriveModal: React.FC<SaveToDriveModalProps> = ({
  isOpen,
  document,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(document?.title || 'Untitled Letter');
  const [category, setCategory] = useState<string>("main"); // Changed from empty string to "main"
  const [permission, setPermission] = useState('private');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Query to fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/documents/drive/categories'],
    queryFn: () => apiRequest('/api/documents/drive/categories'),
    enabled: isOpen // Only fetch when modal is open
  });
  
  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (categoryName: string) => 
      apiRequest('/api/documents/drive/categories', {
        method: 'POST',
        body: JSON.stringify({ categoryName })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/drive/categories'] });
    }
  });
  
  // Update title when document changes
  useEffect(() => {
    if (document) {
      setTitle(document.title || 'Untitled Letter');
    }
  }, [document]);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsNewCategory(false);
      setNewCategoryName("");
      
      // Default to first category if available
      if (categories && categories.length > 0 && !category) {
        setCategory(categories[0].name);
      }
    }
  }, [isOpen, categories, category]);
  
  const handleSelectChange = (value: string) => {
    if (value === "new") {
      setIsNewCategory(true);
      setNewCategoryName("");
    } else {
      setIsNewCategory(false);
      setCategory(value);
    }
  };
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const result = await createCategoryMutation.mutateAsync(newCategoryName.trim());
      setCategory(newCategoryName.trim());
      setIsNewCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };
  
  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    
    if (isNewCategory && newCategoryName.trim()) {
      // Create category first
      try {
        setIsSaving(true);
        const result = await createCategoryMutation.mutateAsync(newCategoryName.trim());
        await onSave(title, newCategoryName.trim(), permission);
        setIsSaving(false);
        onClose();
      } catch (error) {
        console.error('Error saving with new category:', error);
        setIsSaving(false);
      }
    } else {
      // Save to existing category
      try {
        setIsSaving(true);
        await onSave(title, category, permission);
        setIsSaving(false);
        onClose();
      } catch (error) {
        console.error('Error saving to Drive:', error);
        setIsSaving(false);
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
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
          
          {isNewCategory ? (
            <div className="space-y-2">
              <Label htmlFor="newCategory">New Category</Label>
              <div className="flex gap-2">
                <Input
                  id="newCategory"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="sm"
                  onClick={() => setIsNewCategory(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  size="sm"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FolderPlus className="h-4 w-4 mr-1" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="driveFolder">Save to folder</Label>
              <Select value={category} onValueChange={handleSelectChange}>
                <SelectTrigger id="driveFolder">
                  {isCategoriesLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    <SelectValue placeholder="Select a category" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {/* Main LetterDrive folder */}
                  <SelectItem value="main"> {/* Changed from empty string to "main" */}
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      Main Folder
                    </div>
                  </SelectItem>
                  
                  {/* Categories */}
                  {categories?.filter(cat => cat.id && cat.name).map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center">
                        <Folder className="h-4 w-4 mr-2" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Create new category option */}
                  <SelectItem value="new">
                    <div className="flex items-center text-primary">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Create new category...
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
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
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-[#0F9D58] hover:bg-green-700" 
            disabled={isSaving || (isNewCategory && !newCategoryName.trim()) || !title.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CloudUpload className="h-4 w-4 mr-2" />
                Save to Drive
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveToDriveModal;