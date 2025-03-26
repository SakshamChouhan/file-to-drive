import { useEditor } from "@/hooks/use-editor";
import { EditorToolbar } from "./editor-toolbar";
import { useEffect, useRef } from "react";

export function Editor() {
  const { content, onContentChange, currentLetter } = useEditor();
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);
  
  const handleEditorInput = () => {
    if (editorRef.current) {
      onContentChange(editorRef.current.innerHTML);
    }
  };
  
  return (
    <div className="editor-container max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <EditorToolbar />
      
      <div className="p-6 md:p-8">
        {/* Letter Header Format */}
        <div className="mb-8">
          <div className="text-right mb-4">
            <div 
              contentEditable={true}
              suppressContentEditableWarning={true}
              className="focus:outline-none"
              onInput={handleEditorInput}
            >
              {currentLetter?.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div 
              contentEditable={true}
              suppressContentEditableWarning={true}
              className="focus:outline-none"
              onInput={handleEditorInput}
            >
              {currentLetter?.sender || ''}
            </div>
            <div 
              contentEditable={true}
              suppressContentEditableWarning={true}
              className="focus:outline-none"
              onInput={handleEditorInput}
            >
              {currentLetter?.senderAddress || ''}
            </div>
            <div 
              contentEditable={true}
              suppressContentEditableWarning={true}
              className="focus:outline-none"
              onInput={handleEditorInput}
            >
              {currentLetter?.senderCity || ''}
            </div>
          </div>
          
          <div className="mb-6">
            <div 
              contentEditable={true}
              suppressContentEditableWarning={true}
              className="focus:outline-none"
              onInput={handleEditorInput}
            >
              {currentLetter?.recipient || ''}
            </div>
            <div 
              contentEditable={true}
              suppressContentEditableWarning={true}
              className="focus:outline-none"
              onInput={handleEditorInput}
            >
              {currentLetter?.recipientAddress || ''}
            </div>
            <div 
              contentEditable={true}
              suppressContentEditableWarning={true}
              className="focus:outline-none"
              onInput={handleEditorInput}
            >
              {currentLetter?.recipientCity || ''}
            </div>
          </div>
          
          <div className="mb-4">
            <div 
              contentEditable={true}
              suppressContentEditableWarning={true}
              className="focus:outline-none"
              onInput={handleEditorInput}
            >
              {currentLetter?.greeting || ''}
            </div>
          </div>
        </div>
        
        {/* Letter Body */}
        <div 
          id="editor" 
          ref={editorRef}
          className="editor-content focus:outline-none min-h-[500px]" 
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleEditorInput}
        ></div>
      </div>
    </div>
  );
}
