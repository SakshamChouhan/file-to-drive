import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditor } from "@/hooks/use-editor";
import { useState } from "react";

interface SaveToDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, folderId: string) => void;
}

export function SaveToDriveModal({ isOpen, onClose, onSave }: SaveToDriveModalProps) {
  const { currentLetter } = useEditor();
  const [title, setTitle] = useState(currentLetter?.title || "Untitled Letter");
  const [folder, setFolder] = useState("letters");
  
  const handleSave = () => {
    onSave(title, folder);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driveFolder" className="text-right">
              Save to folder
            </Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letters">Letters</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="new">Create new folder...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave} className="bg-primary hover:bg-blue-600">
            <span className="material-icons text-sm mr-1">cloud_upload</span>
            Save to Drive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
