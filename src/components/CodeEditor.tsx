import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  isDarkMode: boolean;
  isReadOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  placeholder,
  isDarkMode,
  isReadOnly = false
}) => {
  return (
    <div 
      className={`relative border rounded-lg overflow-hidden ${
        isDarkMode 
          ? 'border-gray-700 bg-gray-800' 
          : 'border-gray-300 bg-white'
      }`}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={isReadOnly}
        className={`w-full h-64 p-4 font-mono text-sm resize-none focus:outline-none ${
          isDarkMode 
            ? 'bg-gray-800 text-gray-200 placeholder-gray-500' 
            : 'bg-white text-gray-800 placeholder-gray-400'
        } ${isReadOnly ? 'cursor-default' : ''}`}
        spellCheck="false"
      />
    </div>
  );
};

export default CodeEditor;