import React, { useState, useEffect, useRef } from 'react';

import { NodeData } from '../../types/models';

interface NodeInlineEditorProps {
  nodeId: string;
  initialValue: string;
  onSave: (nodeId: string, newContent: string) => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}

const NodeInlineEditor: React.FC<NodeInlineEditorProps> = ({
  nodeId,
  initialValue,
  onSave,
  onCancel,
  style,
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus the input and select text on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-resize textarea
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const handleBlur = () => {
    // AUTO_SAVE ON blur
    if (value.trim() !== initialValue.trim()) {
      onSave(nodeId, value.trim());
    } else {
      onCancel(); // Treat blur without changes as cancel
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline
      handleBlur(); // Save on Enter
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setValue(initialValue); // Revert changes
      onCancel();
    }
  };

  // Basic styling to overlay the input
  const editorStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    border: '1px solid #2196f3', // Use primary color from palette
    padding: '4px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    lineHeight: 'inherit',
    minWidth: '100px',
    minHeight: '20px',
    resize: 'none',
    overflow: 'hidden',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    borderRadius: '4px',
    ...style,
  };

  return (
    <textarea
      ref={inputRef}
      value={value}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={editorStyle}
      rows={1}
      aria-label="Node content editor"
      title="Edit node content"
    />
  );
};

export default NodeInlineEditor;
