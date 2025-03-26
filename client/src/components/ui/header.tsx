import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditor } from "@/hooks/use-editor";
import { useState } from "react";

interface HeaderProps {
  onSaveDraft: () => void;
  onSaveToDrive: () => void;
}

export function Header({ onSaveDraft, onSaveToDrive }: HeaderProps) {
  const { currentLetter, setTitle, saveStatus } = useEditor();
  const [documentTitle, setDocumentTitle] = useState(currentLetter?.title || "Untitled Letter");
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentTitle(e.target.value);
    setTitle(e.target.value);
  };
  
  return (
    <header className="bg-white dark:bg-neutral-900 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Input
            type="text"
            value={documentTitle}
            onChange={handleTitleChange}
            className="text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0 dark:text-white"
            placeholder="Untitled Letter"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <div id="saveStatus" className="text-sm text-neutral-700 dark:text-neutral-300 hidden md:block">
            {saveStatus}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onSaveDraft}
              className="px-4 py-2 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium"
            >
              Save Draft
            </Button>
            
            <Button
              onClick={onSaveToDrive}
              className="px-4 py-2 rounded-md bg-primary hover:bg-blue-600 text-white text-sm font-medium"
            >
              Save to Drive
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
