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
      // Only update title if it's empty or if it's the default and document has a different title
      if (!title || (title === 'Untitled Letter' && initialDocument.title)) {
        setTitle(initialDocument.title || 'Untitled Letter');
      }
      setLastSavedTime(initialDocument.lastSaved ? new Date(initialDocument.lastSaved) : null);
      setIsSaved(true);
    }
  }, [initialDocument, title]);
  
  // Mark as unsaved when content or title changes
  useEffect(() => {
    if (document && (content !== document.content || title !== document.title)) {
      setIsSaved(false);
    }
  }, [content, title, document]);
  
  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    // Don't allow empty titles
    if (!newTitle.trim()) {
      setTitle('Untitled Letter');
    } else {
      setTitle(newTitle.trim());
    }
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
          content,
          title
        }
      });

      if (updatedDoc) {
        setDocument(updatedDoc);
        setIsSaved(true);
        setLastSavedTime(updatedDoc.lastSaved ? new Date(updatedDoc.lastSaved) : new Date());
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [document, isSaving, isSaved, content, title, updateDocument]);

  // Save to Google Drive
  const saveToGoogleDrive = useCallback(async (category: string, permission: string, customTitle?: string): Promise<boolean> => {
    if (!document || isSaving) {
      return false;
    }

    setIsSaving(true);
    try {
      // Use customTitle if provided, otherwise use current title
      const titleToSave = (customTitle || title).trim();

      // Make sure we have a valid title
      if (!titleToSave) {
        throw new Error('Title is required');
      }

      // Make sure we have the latest content and title saved first
      await saveDraft();

      const updatedDoc = await saveToDrive.mutateAsync({
        id: document.id,
        title: titleToSave,
        category,
        content,
        permission
      });

      if (updatedDoc) {
        setDocument(updatedDoc);
        setTitle(titleToSave); // Update local title state
        setLastSavedTime(updatedDoc.lastSaved ? new Date(updatedDoc.lastSaved) : new Date());
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to save to Google Drive:', error);
      throw error; // Re-throw to handle in the UI
    } finally {
      setIsSaving(false);
    }
  }, [document, isSaving, saveDraft, saveToDrive, title, content]);
  
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
