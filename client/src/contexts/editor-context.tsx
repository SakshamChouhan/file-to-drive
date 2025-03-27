import React, { createContext, useContext, useState, useCallback } from 'react';
import { Letter } from '@/types';
import { useToast } from '@/components/toast/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface EditorContextType {
  currentLetter: Letter | null;
  setCurrentLetter: (letter: Letter | null) => void;
  saveDraft: () => Promise<Letter | null>;
  saveToGoogleDrive: (title: string, folderId: string) => Promise<boolean>;
  isModified: boolean;
  setIsModified: (modified: boolean) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};

interface EditorProviderProps {
  children: React.ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);
  const [isModified, setIsModified] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateTitle = useCallback((title: string): string => {
    const trimmedTitle = title.trim();
    return trimmedTitle || 'Untitled Letter';
  }, []);

  const saveDraft = useCallback(async (): Promise<Letter | null> => {
    if (!currentLetter) return null;
    
    try {
      const method = currentLetter.id ? 'PUT' : 'POST';
      const endpoint = currentLetter.id 
        ? `/api/letters/${currentLetter.id}` 
        : '/api/letters';
      
      // Ensure title is validated before saving
      const letterToSave = {
        ...currentLetter,
        title: validateTitle(currentLetter.title)
      };
      
      const response = await apiRequest(method, endpoint, letterToSave);
      const savedLetter = await response.json();
      
      setCurrentLetter(savedLetter);
      setIsModified(false);
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
  }, [currentLetter, queryClient, toast, validateTitle]);

  const saveToGoogleDrive = useCallback(async (title: string, folderId: string): Promise<boolean> => {
    if (!currentLetter) return false;
    
    try {
      // First ensure we have the latest version saved locally
      const savedLetter = await saveDraft();
      if (!savedLetter) throw new Error('Failed to save draft');
      
      const finalTitle = validateTitle(title);
      
      const response = await apiRequest(
        'POST',
        `/api/letters/${savedLetter.id}/gdrive`,
        {
          title: finalTitle,
          folderId,
        }
      );
      
      if (response.ok) {
        // Update local letter title if it was saved successfully
        setCurrentLetter(prev => prev ? {
          ...prev,
          title: finalTitle
        } : null);
        
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
  }, [currentLetter, saveDraft, toast, validateTitle]);

  return (
    <EditorContext.Provider
      value={{
        currentLetter,
        setCurrentLetter,
        saveDraft,
        saveToGoogleDrive,
        isModified,
        setIsModified,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};
