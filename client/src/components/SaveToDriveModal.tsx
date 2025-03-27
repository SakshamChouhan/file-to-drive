import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CloudUpload, Folder, FolderPlus, Loader2, X } from 'lucide-react';
import { Document } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>("main");
  const [permission, setPermission] = useState('private');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [titleError, setTitleError] = useState('');

  // Initialize title when modal opens
  useEffect(() => {
    if (isOpen) {
      // Always set title from document when modal opens
      setTitle(document?.title || 'Untitled Letter');
      setTitleError('');
    }
  }, [isOpen, document]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setCategory('main');
      setPermission('private');
      setIsNewCategory(false);
      setNewCategoryName('');
      setIsSaving(false);
      setTitleError('');
    }
  }, [isOpen]);

  // Query to fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/documents/drive/categories'],
    queryFn: () => apiRequest('GET', '/api/documents/drive/categories').then(res => res.json()),
    enabled: isOpen,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => 
      apiRequest('POST', '/api/documents/drive/categories', { categoryName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/drive/categories'] });
      toast({
        title: "Success",
        description: "New folder created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new folder. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (!newTitle.trim()) {
      setTitleError('Title is required');
      setTitle(newTitle);
    } else {
      setTitleError('');
      setTitle(newTitle);
    }
  };

  const handleSelectChange = useCallback((value: string) => {
    if (value === "new") {
      setIsNewCategory(true);
      setNewCategoryName("");
    } else {
      setIsNewCategory(false);
      setCategory(value);
    }
  }, []);

  const handleCreateCategory = useCallback(async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    try {
      await createCategoryMutation.mutateAsync(trimmedName);
      setCategory(trimmedName);
      setIsNewCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  }, [newCategoryName, createCategoryMutation]);

  const handleSave = async () => {
    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      if (isNewCategory && newCategoryName) {
        await createCategoryMutation.mutateAsync(newCategoryName);
        await onSave(title.trim(), newCategoryName, permission);
      } else {
        await onSave(title.trim(), category, permission);
      }
      onClose();
    } catch (error) {
      console.error('Error saving to Drive:', error);
      toast({
        title: 'Error',
        description: 'Failed to save document to Drive',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !isSaving && !open && onClose()}>
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
              onChange={handleTitleChange}
              placeholder="Enter document title"
              className="w-full"
              autoComplete="off"
              autoFocus
              required
            />
            {titleError && (
              <div className="text-red-500 text-sm">{titleError}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Save to folder</Label>
            {isNewCategory ? (
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryName(e.target.value)}
                  placeholder="New folder name"
                />
                <Button
                  variant="outline"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderPlus className="h-4 w-4 mr-2" />
                  )}
                  Create
                </Button>
              </div>
            ) : (
              <Select value={category} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      {category === "main" ? "Main Folder" : category}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      Main Folder
                    </div>
                  </SelectItem>
                  {categories?.map((cat: Category) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center">
                        <Folder className="h-4 w-4 mr-2" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <div className="flex items-center">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      New Folder
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
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