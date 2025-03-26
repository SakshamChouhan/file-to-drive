import { useContext } from 'react';
import { EditorContext } from '@/contexts/editor-context';

export function useEditor() {
  const context = useContext(EditorContext);
  
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  
  return context;
}
