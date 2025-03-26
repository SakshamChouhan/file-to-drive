import { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Letter } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

interface EditorContextType {
  content: string;
  currentLetter: Letter | null;
  saveStatus: string;
  isEditorReady: boolean;
  setCurrentLetter: (letter: Letter | null) => void;
  onContentChange: (content: string) => void;
  setTitle: (title: string) => void;
  executeCommand: (command: string, value?: string) => void;
  saveDraft: () => Promise<Letter | null>;
  saveToGoogleDrive: (title: string, folderId: string) => Promise<boolean>;
}

export const EditorContext = createContext<EditorContextType>({
  content: '',
  currentLetter: null,
  saveStatus: 'All changes saved',
  isEditorReady: false,
  setCurrentLetter: () => {},
  onContentChange: () => {},
  setTitle: () => {},
  executeCommand: () => {},
  saveDraft: async () => null,
  saveToGoogleDrive: async () => false,
});

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [content, setContent] = useState('');
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);
  const [saveStatus, setSaveStatus] = useState('All changes saved');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-save draft when content changes
  useEffect(() => {
    if (currentLetter && content) {
      setSaveStatus('Saving...');
      
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      const timeout = setTimeout(() => {
        saveDraft()
          .then(() => {
            setSaveStatus('All changes saved');
          })
          .catch(() => {
            setSaveStatus('Failed to save');
          });
      }, 1500);
      
      setSaveTimeout(timeout);
    }
    
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [content]);

  const onContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    if (currentLetter) {
      setCurrentLetter({
        ...currentLetter,
        content: newContent,
      });
    }
  }, [currentLetter]);

  const setTitle = useCallback((title: string) => {
    if (currentLetter) {
      setCurrentLetter({
        ...currentLetter,
        title,
      });
    }
  }, [currentLetter]);

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  const saveDraft = useCallback(async (): Promise<Letter | null> => {
    if (!currentLetter) return null;
    
    try {
      const method = currentLetter.id ? 'PUT' : 'POST';
      const endpoint = currentLetter.id 
        ? `/api/letters/${currentLetter.id}` 
        : '/api/letters';
      
      const response = await apiRequest(method, endpoint, currentLetter);
      const savedLetter = await response.json();
      
      setCurrentLetter(savedLetter);
      queryClient.invalidateQueries({ queryKey: ['/api/letters'] });
      
      return savedLetter;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [currentLetter, queryClient, toast]);

  const saveToGoogleDrive = useCallback(async (title: string, folderId: string): Promise<boolean> => {
    if (!currentLetter) return false;
    
    try {
      // First ensure we have the latest version saved locally
      await saveDraft();
      
      const response = await apiRequest('POST', `/api/letters/${currentLetter.id}/gdrive`, {
        title,
        folderId,
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Letter successfully saved to Google Drive.",
        });
        return true;
      } else {
        throw new Error('Failed to save to Google Drive');
      }
    } catch (error) {
      console.error('Error saving to Google Drive:', error);
      toast({
        title: "Error",
        description: "Failed to save to Google Drive. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [currentLetter, saveDraft, toast]);

  useEffect(() => {
    setIsEditorReady(true);
  }, []);

  return (
    <EditorContext.Provider value={{
      content,
      currentLetter,
      saveStatus,
      isEditorReady,
      setCurrentLetter,
      onContentChange,
      setTitle,
      executeCommand,
      saveDraft,
      saveToGoogleDrive,
    }}>
      {children}
    </EditorContext.Provider>
  );
}
