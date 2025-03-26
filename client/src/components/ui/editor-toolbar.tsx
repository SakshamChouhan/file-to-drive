import { useEditor } from "@/hooks/use-editor";
import { useCallback } from "react";

export function EditorToolbar() {
  const { executeCommand } = useEditor();
  
  const handleFormatClick = useCallback((command: string) => {
    executeCommand(command);
  }, [executeCommand]);
  
  return (
    <div className="editor-toolbar border-b border-neutral-200 dark:border-neutral-700 p-2 flex items-center flex-wrap">
      {/* Format buttons */}
      <div className="flex items-center space-x-1">
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('bold')} 
          title="Bold"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_bold</span>
        </button>
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('italic')} 
          title="Italic"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_italic</span>
        </button>
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('underline')} 
          title="Underline"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_underlined</span>
        </button>
        <div className="h-6 border-l border-neutral-200 dark:border-neutral-700 mx-1"></div>
      </div>
      
      {/* Paragraph format */}
      <div className="flex items-center space-x-1">
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('justifyLeft')} 
          title="Align left"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_align_left</span>
        </button>
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('justifyCenter')} 
          title="Align center"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_align_center</span>
        </button>
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('justifyRight')} 
          title="Align right"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_align_right</span>
        </button>
        <div className="h-6 border-l border-neutral-200 dark:border-neutral-700 mx-1"></div>
      </div>
      
      {/* Lists */}
      <div className="flex items-center space-x-1">
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('insertUnorderedList')} 
          title="Bullet list"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_list_bulleted</span>
        </button>
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('insertOrderedList')} 
          title="Numbered list"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_list_numbered</span>
        </button>
        <div className="h-6 border-l border-neutral-200 dark:border-neutral-700 mx-1"></div>
      </div>
      
      {/* Indentation */}
      <div className="flex items-center space-x-1">
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('outdent')} 
          title="Decrease indent"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_indent_decrease</span>
        </button>
        <button 
          className="toolbar-btn p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
          onClick={() => handleFormatClick('indent')} 
          title="Increase indent"
        >
          <span className="material-icons text-neutral-700 dark:text-neutral-300">format_indent_increase</span>
        </button>
      </div>
    </div>
  );
}
