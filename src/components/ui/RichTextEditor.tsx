import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  rows = 4,
  className = '',
  id
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // Gérer l'historique undo/redo
      if (content !== undoStack.current[undoStack.current.length - 1]) {
        undoStack.current.push(content);
        if (undoStack.current.length > 50) {
          undoStack.current.shift();
        }
        redoStack.current = [];
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
      }
    }
  };

  const handleUndo = () => {
    if (undoStack.current.length > 1) {
      const currentContent = undoStack.current.pop();
      if (currentContent) {
        redoStack.current.push(currentContent);
      }
      const previousContent = undoStack.current[undoStack.current.length - 1];
      if (editorRef.current && previousContent) {
        editorRef.current.innerHTML = previousContent;
        onChange(previousContent);
      }
    }
  };

  const handleRedo = () => {
    if (redoStack.current.length > 0) {
      const content = redoStack.current.pop();
      if (content && editorRef.current) {
        editorRef.current.innerHTML = content;
        onChange(content);
        undoStack.current.push(content);
      }
    }
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    isActive?: boolean;
  }> = ({ onClick, children, title, isActive = false }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className={`h-8 w-8 p-0 ${isActive ? 'bg-blue-100 text-blue-600' : ''}`}
      title={title}
    >
      {children}
    </Button>
  );

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => executeCommand('bold')}
            title="Gras (Ctrl+B)"
            isActive={isCommandActive('bold')}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('italic')}
            title="Italique (Ctrl+I)"
            isActive={isCommandActive('italic')}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('underline')}
            title="Souligné (Ctrl+U)"
            isActive={isCommandActive('underline')}
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => executeCommand('insertUnorderedList')}
            title="Liste à puces"
            isActive={isCommandActive('insertUnorderedList')}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('insertOrderedList')}
            title="Liste numérotée"
            isActive={isCommandActive('insertOrderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('formatBlock', 'blockquote')}
            title="Citation"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => executeCommand('justifyLeft')}
            title="Aligner à gauche"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('justifyCenter')}
            title="Centrer"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('justifyRight')}
            title="Aligner à droite"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={handleUndo}
            title="Annuler (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={handleRedo}
            title="Rétablir (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        id={id}
        contentEditable
        className={`p-3 min-h-[${rows * 1.5}rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        style={{ minHeight: `${rows * 1.5}rem` }}
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: value }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

        <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
