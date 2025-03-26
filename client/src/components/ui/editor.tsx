import React, { useRef, useEffect } from 'react';
import { Editor, EditorState, RichUtils, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export const RichTextEditor = ({ content, onChange, className }: RichTextEditorProps) => {
  const [editorState, setEditorState] = React.useState(() => {
    if (content) {
      try {
        const contentState = convertFromRaw(JSON.parse(content));
        return EditorState.createWithContent(contentState);
      } catch (e) {
        return EditorState.createWithContent(ContentState.createFromText(content));
      }
    }
    return EditorState.createEmpty();
  });
  
  const editorRef = useRef<Editor>(null);
  
  useEffect(() => {
    // Focus the editor when mounted
    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  }, []);
  
  useEffect(() => {
    if (!content) return;
    
    try {
      // Only update if content from props is different from current content
      const currentContent = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
      if (content !== currentContent) {
        try {
          const contentState = convertFromRaw(JSON.parse(content));
          setEditorState(EditorState.createWithContent(contentState));
        } catch (e) {
          setEditorState(EditorState.createWithContent(ContentState.createFromText(content)));
        }
      }
    } catch (e) {
      // If parsing fails, do nothing
    }
  }, [content]);
  
  const handleChange = (state: EditorState) => {
    setEditorState(state);
    
    // Convert content to JSON string
    const contentState = state.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    const jsonContent = JSON.stringify(rawContent);
    
    onChange(jsonContent);
  };

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };
  
  // Text formatting methods
  const handleBold = () => {
    handleChange(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
  };
  
  const handleItalic = () => {
    handleChange(RichUtils.toggleInlineStyle(editorState, 'ITALIC'));
  };
  
  const handleUnderline = () => {
    handleChange(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'));
  };
  
  // List formatting
  const handleBulletedList = () => {
    handleChange(RichUtils.toggleBlockType(editorState, 'unordered-list-item'));
  };
  
  const handleNumberedList = () => {
    handleChange(RichUtils.toggleBlockType(editorState, 'ordered-list-item'));
  };
  
  // Text alignment
  const handleAlignLeft = () => {
    handleChange(RichUtils.toggleBlockType(editorState, 'align-left'));
  };
  
  const handleAlignCenter = () => {
    handleChange(RichUtils.toggleBlockType(editorState, 'align-center'));
  };
  
  const handleAlignRight = () => {
    handleChange(RichUtils.toggleBlockType(editorState, 'align-right'));
  };
  
  return {
    editorState,
    editorRef,
    handleChange,
    handleKeyCommand,
    handleBold,
    handleItalic,
    handleUnderline,
    handleBulletedList,
    handleNumberedList,
    handleAlignLeft,
    handleAlignCenter,
    handleAlignRight,
    Editor
  };
};
