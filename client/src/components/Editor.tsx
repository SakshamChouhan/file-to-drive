import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor as DraftEditor, EditorState, RichUtils, ContentState, convertToRaw, convertFromRaw, SelectionState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Document } from '@shared/schema';
import { format } from 'date-fns';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, ChevronLeft, ChevronRight,
  CloudUpload
} from 'lucide-react';
import { CollaborationInfo } from './CollaborationInfo';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';

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
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const skipNextUpdate = useRef(false);
  const editorRef = useRef<any>(null);
  const { user } = useAuth();
  
  // Connect to WebSocket for real-time collaboration if document exists
  const { isConnected, sendDocumentUpdate, sendCursorPosition } = useWebSocket({
    documentId: document?.id?.toString() || '',
    onUserJoined: (data) => {
      // Add user to collaborators list
      setCollaborators(prev => {
        // Check if user already exists
        if (prev.some(c => c.id === data.userId)) {
          return prev.map(c => 
            c.id === data.userId 
              ? { ...c, lastActive: new Date(data.timestamp) } 
              : c
          );
        }
        // Add new user
        return [...prev, {
          id: data.userId,
          displayName: data.displayName || `User ${data.userId}`,
          profilePicture: data.profilePicture,
          lastActive: new Date(data.timestamp)
        }];
      });
    },
    onUserLeft: (data) => {
      // Remove user from collaborators list
      setCollaborators(prev => 
        prev.filter(c => c.id !== data.userId)
      );
    },
    onDocumentUpdated: (data) => {
      // Skip if this is our own update
      if (data.userId === user?.id) return;
      
      try {
        // Apply the changes from another user
        skipNextUpdate.current = true;
        
        let newState;
        const incomingContent = JSON.parse(data.content);
        const contentState = convertFromRaw(incomingContent);
        
        if (data.selection) {
          // If there's selection info, preserve it
          const selection = new SelectionState(data.selection);
          newState = EditorState.forceSelection(
            EditorState.createWithContent(contentState),
            selection
          );
        } else {
          newState = EditorState.createWithContent(contentState);
        }
        
        setEditorState(newState);
        
        // Update collaborator's last active time
        setCollaborators(prev => 
          prev.map(c => 
            c.id === data.userId 
              ? { ...c, lastActive: new Date(data.timestamp) } 
              : c
          )
        );
      } catch (e) {
        console.error('Error applying remote changes:', e);
      }
    },
    onCursorPosition: (data) => {
      // TODO: Show collaborative cursor positions
      // Update collaborator's last active time
      setCollaborators(prev => 
        prev.map(c => 
          c.id === data.userId 
            ? { ...c, lastActive: new Date(data.timestamp) } 
            : c
        )
      );
    }
  });
  
  // Reset editor when document changes or when creating new document
  useEffect(() => {
    if (!document) {
      // Clear editor state for new document
      setEditorState(EditorState.createEmpty());
      return;
    }
    
    try {
      if (document.content) {
        // Parse content from document
        const contentState = convertFromRaw(JSON.parse(document.content));
        const newEditorState = EditorState.createWithContent(contentState);
        setEditorState(newEditorState);
      } else {
        // Clear editor state if no content
        setEditorState(EditorState.createEmpty());
      }
    } catch (e) {
      // If parsing fails, create from plain text
      const contentState = ContentState.createFromText(document.content || '');
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, [document]);

  // Handle editor changes
  const handleEditorChange = useCallback((newState: typeof EditorState) => {
    if (skipNextUpdate.current) {
      skipNextUpdate.current = false;
      return;
    }

    setEditorState(newState);
    
    // Get current content and notify parent
    const contentState = newState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    onUpdateContent(JSON.stringify(rawContent));
    
    // Send update through WebSocket if connected
    if (isConnected && document?.id) {
      const selection = newState.getSelection();
      sendDocumentUpdate(JSON.stringify({
        content: rawContent,
        selection: selection.toJS()
      }));
    }
  }, [isConnected, document?.id, onUpdateContent, sendDocumentUpdate]);
  
  // Send cursor position updates on selection change
  useEffect(() => {
    if (!isConnected || !document || skipNextUpdate.current) {
      skipNextUpdate.current = false;
      return;
    }
    
    const selection = editorState.getSelection();
    if (selection.getHasFocus()) {
      sendCursorPosition({
        anchorKey: selection.getAnchorKey(),
        anchorOffset: selection.getAnchorOffset(),
        focusKey: selection.getFocusKey(),
        focusOffset: selection.getFocusOffset(),
        isBackward: selection.getIsBackward(),
        hasFocus: selection.getHasFocus()
      });
    }
  }, [editorState.getSelection(), isConnected, document, sendCursorPosition]);
  
  const handleKeyCommand = (command: string) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleEditorChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };
  
  const toggleInlineStyle = (style: string) => {
    handleEditorChange(RichUtils.toggleInlineStyle(editorState, style));
  };
  
  const toggleBlockType = (blockType: string) => {
    handleEditorChange(RichUtils.toggleBlockType(editorState, blockType));
  };
  
  const focusEditor = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
    }
  }, []);

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
          className="w-full px-2 py-1 text-xl font-medium border-gray-200 focus:border-[#4285F4] focus:ring-0 rounded"
          value={document.title || ""}
          placeholder="Untitled Letter"
          onChange={(e) => {
            onUpdateTitle(e.target.value);
          }}
          onBlur={() => document.title && document.title.trim() === "" && onUpdateTitle("Untitled Letter")}
        />
        
        {/* Edit History/Status and Collaboration Info */}
        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
          <div>
            {lastSavedTime && (
              <span>
                Last edited on {format(lastSavedTime, 'MMM d, yyyy')} at {format(lastSavedTime, 'h:mm a')}
              </span>
            )}
          </div>
          
          {/* Show collaboration status */}
          <div className="flex items-center">
            {isConnected && (
              <span className="text-green-600 flex items-center mr-2">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                Realtime
              </span>
            )}
            
            {/* Show collaborators if any */}
            {collaborators.length > 0 && (
              <CollaborationInfo 
                documentId={document.id.toString()} 
                collaborators={collaborators} 
              />
            )}
          </div>
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
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-white" onClick={focusEditor}>
        <div className="editor-content max-w-3xl mx-auto">
          <DraftEditor
            ref={editorRef}
            editorState={editorState}
            onChange={handleEditorChange}
            handleKeyCommand={handleKeyCommand}
            placeholder="Start writing your letter..."
          />
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="px-4 py-3 border-t border-neutral-200 bg-white flex items-center justify-end">
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
