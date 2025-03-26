import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { CloudUpload, Folder, FolderPlus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Document } from "@shared/schema";

interface Category {
  id: string;
  name: string;
}

interface SaveToDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, category: string) => Promise<void>;
  document?: Document;
}

export function SaveToDriveModal({ isOpen, onClose, onSave, document }: SaveToDriveModalProps) {
  const [title, setTitle] = useState(document?.title || "Untitled Letter");
  const [category, setCategory] = useState<string>("");
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
      setTitle(document.title || "Untitled Letter");
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
  
  const handleSave = async () => {
    if (isNewCategory && newCategoryName.trim()) {
      // Create category first
      try {
        setIsSaving(true);
        const result = await createCategoryMutation.mutateAsync(newCategoryName.trim());
        await onSave(title, newCategoryName.trim());
        setIsSaving(false);
        onClose();
      } catch (error) {
        console.error('Error saving with new category:', error);
        setIsSaving(false);
      }
    } else if (category) {
      // Save to existing category
      try {
        setIsSaving(true);
        await onSave(title, category);
        setIsSaving(false);
        onClose();
      } catch (error) {
        console.error('Error saving to Drive:', error);
        setIsSaving(false);
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Google Drive</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="docTitle" className="text-right">
              Document Title
            </Label>
            <Input
              id="docTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          {isNewCategory ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newCategory" className="text-right">
                New Category
              </Label>
              <div className="col-span-3 flex gap-2">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="driveFolder" className="text-right">
                Save to folder
              </Label>
              <Select value={category} onValueChange={handleSelectChange}>
                <SelectTrigger id="driveFolder" className="col-span-3">
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
                  <SelectItem value="">
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      Main Folder
                    </div>
                  </SelectItem>
                  
                  {/* Categories */}
                  {categories?.map((cat) => (
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={isSaving || (isNewCategory && !newCategoryName.trim())}
            className="bg-[#0F9D58] hover:bg-green-700"
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
}
