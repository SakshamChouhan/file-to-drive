import { useState, useEffect, useCallback } from 'react';
import { useDocuments } from './useDocuments';
import { Document } from '@shared/schema';

export function useEditor(initialDocument?: Document) {
  const [document, setDocument] = useState<Document | undefined>(initialDocument);
  const [content, setContent] = useState<string>(initialDocument?.content || '');
  const [title, setTitle] = useState<string>(initialDocument?.title || 'Untitled Letter');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(
    initialDocument?.lastSaved ? new Date(initialDocument.lastSaved) : null
  );
  
  const { updateDocument, saveToDrive } = useDocuments();
  
  // Update state when initialDocument changes
  useEffect(() => {
    if (initialDocument) {
      setDocument(initialDocument);
      setContent(initialDocument.content || '');
      setTitle(initialDocument.title || 'Untitled Letter');
      setLastSavedTime(initialDocument.lastSaved ? new Date(initialDocument.lastSaved) : null);
      setIsSaved(true);
    }
  }, [initialDocument]);
  
  // Mark as unsaved when content or title changes
  useEffect(() => {
    if (document && (content !== document.content || title !== document.title)) {
      setIsSaved(false);
    }
  }, [content, title, document]);
  
  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setIsSaved(false);
  }, []);
  
  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  }, []);
  
  // Save draft
  const saveDraft = useCallback(async () => {
    if (!document || isSaving || (isSaved && content === document.content && title === document.title)) {
      return false;
    }
    
    setIsSaving(true);
    
    try {
      const updatedDoc = await updateDocument.mutateAsync({
        id: document.id,
        data: {
          title,
          content
        }
      });
      
      if (updatedDoc) {
        setDocument(updatedDoc);
        setLastSavedTime(updatedDoc.lastSaved ? new Date(updatedDoc.lastSaved) : new Date());
        setIsSaved(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [document, content, title, isSaving, isSaved, updateDocument]);
  
  // Save to Google Drive
  const saveToGoogleDrive = useCallback(async (category?: string, permission?: string) => {
    if (!document || isSaving) {
      return;
    }
    
    // First save locally if there are unsaved changes
    if (!isSaved) {
      await saveDraft();
    }
    
    setIsSaving(true);
    
    try {
      const updatedDoc = await saveToDrive.mutateAsync({ 
        id: document.id,
        title: title, // Pass the current title
        category,
        content: content, // Pass the current content
        permission // Pass the permission parameter for sharing settings
      } as any);
      
      if (updatedDoc) {
        setDocument(updatedDoc);
        setLastSavedTime(updatedDoc.lastSaved ? new Date(updatedDoc.lastSaved) : new Date());
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to save to Google Drive:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [document, isSaving, isSaved, saveDraft, saveToDrive, title]);
  
  // Auto-save draft
  useEffect(() => {
    const autoSaveInterval = 30000; // 30 seconds
    
    if (!isSaved && !isSaving && document) {
      const timeoutId = setTimeout(async () => {
        await saveDraft();
      }, autoSaveInterval);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isSaved, isSaving, document, content, title, saveDraft]);
  
  // Save on title change after a short delay
  useEffect(() => {
    if (document && title !== document.title) {
      const titleChangeTimeout = setTimeout(async () => {
        if (!isSaving) {
          await saveDraft();
        }
      }, 1000); // 1 second delay after title change
      
      return () => clearTimeout(titleChangeTimeout);
    }
  }, [title, document, isSaving, saveDraft]);
  
  return {
    document,
    content,
    title,
    isSaving,
    isSaved,
    lastSavedTime,
    handleContentChange,
    handleTitleChange,
    saveDraft,
    saveToGoogleDrive
  };
}
