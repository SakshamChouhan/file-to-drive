import React, { useState, useEffect, useRef } from 'react';
import { Editor as DraftEditor, EditorState, RichUtils, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Document } from '@shared/schema';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, ChevronLeft, ChevronRight,
  CloudUpload, MoreHorizontal
} from 'lucide-react';

interface EditorProps {
  document?: Document;
  onSaveDraft: () => Promise<boolean>;
  onSaveToDrive: () => Promise<boolean>;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  isSaving: boolean;
  isSaved: boolean;
  lastSavedTime: Date | null;
}

const Editor: React.FC<EditorProps> = ({
  document,
  onSaveDraft,
  onSaveToDrive,
  onUpdateTitle,
  onUpdateContent,
  isSaving,
  isSaved,
  lastSavedTime
}) => {
  const [editorState, setEditorState] = useState(() => {
    if (document?.content) {
      try {
        const contentState = convertFromRaw(JSON.parse(document.content));
        return EditorState.createWithContent(contentState);
      } catch (e) {
        return EditorState.createWithContent(ContentState.createFromText(document.content || ''));
      }
    }
    return EditorState.createEmpty();
  });
  
  const editorRef = useRef<DraftEditor>(null);
  
  useEffect(() => {
    if (!document?.content) return;
    
    try {
      // Parse content from document
      const contentState = convertFromRaw(JSON.parse(document.content));
      const newEditorState = EditorState.createWithContent(contentState);
      setEditorState(newEditorState);
    } catch (e) {
      // If parsing fails, create from plain text
      const contentState = ContentState.createFromText(document.content || '');
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, [document?.id, document?.content]);
  
  const handleChange = (state: EditorState) => {
    setEditorState(state);
    
    // Convert content to JSON string
    const contentState = state.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    const jsonContent = JSON.stringify(rawContent);
    
    onUpdateContent(jsonContent);
  };
  
  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };
  
  const toggleInlineStyle = (style: string) => {
    handleChange(RichUtils.toggleInlineStyle(editorState, style));
  };
  
  const toggleBlockType = (blockType: string) => {
    handleChange(RichUtils.toggleBlockType(editorState, blockType));
  };
  
  if (!document) {
    return (
      <div className="flex-grow overflow-hidden flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a document or create a new one</p>
      </div>
    );
  }
  
  return (
    <div className="flex-grow overflow-hidden flex flex-col">
      {/* Document Title */}
      <div className="px-4 sm:px-6 py-3 border-b border-neutral-200 bg-white">
        <Input
          type="text"
          className="w-full px-2 py-1 text-xl font-medium border-transparent focus:border-[#4285F4] focus:ring-0 rounded"
          value={document.title}
          placeholder="Untitled Letter"
          onChange={(e) => onUpdateTitle(e.target.value)}
        />
        
        {/* Edit History/Status */}
        <div className="flex items-center mt-1 text-xs text-gray-500">
          {lastSavedTime && (
            <span>
              Last edited on {format(lastSavedTime, 'MMM d, yyyy')} at {format(lastSavedTime, 'h:mm a')}
            </span>
          )}
        </div>
      </div>
      
      {/* Formatting Toolbar */}
      <div className="px-2 py-1 border-b border-neutral-200 bg-white flex items-center overflow-x-auto">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1 mr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleInlineStyle('BOLD')}
            className="h-8 w-8 p-0 rounded"
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleInlineStyle('ITALIC')}
            className="h-8 w-8 p-0 rounded"
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleInlineStyle('UNDERLINE')}
            className="h-8 w-8 p-0 rounded"
            aria-label="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Alignment */}
        <div className="flex items-center space-x-1 mr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlockType('align-left')}
            className="h-8 w-8 p-0 rounded"
            aria-label="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlockType('align-center')}
            className="h-8 w-8 p-0 rounded"
            aria-label="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlockType('align-right')}
            className="h-8 w-8 p-0 rounded"
            aria-label="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Lists */}
        <div className="flex items-center space-x-1 mr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlockType('unordered-list-item')}
            className="h-8 w-8 p-0 rounded"
            aria-label="Bulleted List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlockType('ordered-list-item')}
            className="h-8 w-8 p-0 rounded"
            aria-label="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Indent */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Decrease indent */}}
            className="h-8 w-8 p-0 rounded"
            aria-label="Decrease Indent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Increase indent */}}
            className="h-8 w-8 p-0 rounded"
            aria-label="Increase Indent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-white" onClick={() => editorRef.current?.focus()}>
        <div className="editor-content max-w-3xl mx-auto">
          <DraftEditor
            ref={editorRef}
            editorState={editorState}
            onChange={handleChange}
            handleKeyCommand={handleKeyCommand}
            placeholder="Start writing your letter..."
          />
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="px-4 py-3 border-t border-neutral-200 bg-white flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900 flex items-center"
            aria-label="More formatting options"
          >
            <MoreHorizontal className="h-4 w-4 mr-1" />
            <span className="text-sm hidden sm:inline">More</span>
          </Button>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSaving || isSaved}
            className="py-2 px-4 text-sm"
          >
            {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Draft'}
          </Button>
          <Button
            variant="default"
            onClick={onSaveToDrive}
            disabled={isSaving}
            className="py-2 px-4 text-sm bg-[#0F9D58] hover:bg-green-700 flex items-center"
          >
            <CloudUpload className="h-4 w-4 mr-1" />
            Save to Drive
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
