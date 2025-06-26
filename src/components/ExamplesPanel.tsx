import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getExamplesByType, Example } from '../data/examples';
import { DatabaseType } from '../types';

interface ExamplesPanelProps {
  onSelectExample: (example: string) => void;
  conversionMode: string;
}

const ExamplesPanel: React.FC<ExamplesPanelProps> = ({ onSelectExample, conversionMode }) => {
  const { isDarkMode } = useTheme();
  
  // Extract source type from conversion mode
  const getSourceType = (mode: string): DatabaseType => {
    if (mode.includes('sqlserver-to-')) return 'sqlserver';
    if (mode.includes('postgres-to-')) return 'postgresql';
    if (mode.includes('mysql-to-')) return 'mysql';
    return 'sqlserver'; // default
  };
  
  const sourceType = getSourceType(conversionMode);
  const examples = getExamplesByType(sourceType);
  
  const getTitle = (mode: string): string => {
    if (mode.includes('sqlserver-to-postgres')) return 'SQL Server to PostgreSQL Examples:';
    if (mode.includes('postgres-to-sqlserver')) return 'PostgreSQL to SQL Server Examples:';
    if (mode.includes('sqlserver-to-mysql')) return 'SQL Server to MySQL Examples:';
    if (mode.includes('postgres-to-mysql')) return 'PostgreSQL to MySQL Examples:';
    if (mode.includes('mysql-to-sqlserver')) return 'MySQL to SQL Server Examples:';
    if (mode.includes('mysql-to-postgres')) return 'MySQL to PostgreSQL Examples:';
    return 'Examples:';
  };
  
  return (
    <div className={`mb-4 rounded-lg p-4 ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
    }`}>
      <h3 className="text-sm font-medium mb-2">
        {getTitle(conversionMode)}
      </h3>
      <div className="space-y-3">
        {examples.map((example: Example, index: number) => (
          <div key={index} className="space-y-1">
            <h4 className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {example.title}
            </h4>
            <pre className={`text-xs p-2 rounded overflow-x-auto ${
              isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'
            }`}>
              {example.snippet}
            </pre>
            <button 
              onClick={() => onSelectExample(example.full)}
              className={`text-xs px-2 py-1 rounded ${
                isDarkMode 
                  ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Use This Example
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamplesPanel;