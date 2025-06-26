import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import { optimizeSqlCode } from '../services/conversionService';
import { Zap, Clipboard, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseType } from '../types';

const OptimizationPanel: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [sqlInput, setSqlInput] = useState('');
  const [optimizedOutput, setOptimizedOutput] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [sqlType, setSqlType] = useState<DatabaseType>('sqlserver');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleOptimize = async () => {
    if (!sqlInput.trim()) {
      setOptimizationError('Please provide SQL code to optimize.');
      return;
    }

    setIsOptimizing(true);
    setOptimizationError(null);
    try {
      const result = await optimizeSqlCode(sqlInput, sqlType);
      setOptimizedOutput(result);
    } catch (error) {
      console.error('Optimization error:', error);
      setOptimizationError('Failed to optimize SQL code. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(optimizedOutput);
  };

  const handleSqlTypeChange = (type: DatabaseType) => {
    setSqlType(type);
    setIsDropdownOpen(false);
    // Clear input and output when changing SQL type
    setSqlInput('');
    setOptimizedOutput('');
    setOptimizationError(null);
  };

  const getSqlTypeLabel = (type: DatabaseType): string => {
    switch (type) {
      case 'sqlserver': return 'SQL Server';
      case 'postgresql': return 'PostgreSQL';
      case 'mysql': return 'MySQL';
      default: return 'SQL Server';
    }
  };

  const getInputLabel = (type: DatabaseType): string => {
    switch (type) {
      case 'sqlserver': return 'SQL Server Stored Procedure';
      case 'postgresql': return 'PostgreSQL Function';
      case 'mysql': return 'MySQL Stored Procedure';
      default: return 'SQL Server Stored Procedure';
    }
  };

  const getPlaceholder = (type: DatabaseType): string => {
    switch (type) {
      case 'sqlserver': return 'Paste your SQL Server stored procedure to optimize...';
      case 'postgresql': return 'Paste your PostgreSQL function to optimize...';
      case 'mysql': return 'Paste your MySQL stored procedure to optimize...';
      default: return 'Paste your SQL Server stored procedure to optimize...';
    }
  };

  const getOptimizationTips = (type: DatabaseType): string[] => {
    switch (type) {
      case 'sqlserver':
        return [
          'Query performance and execution plans',
          'Index usage and table access methods',
          'Stored procedure optimization',
          'Dynamic SQL and parameter handling',
          'Locking and concurrency'
        ];
      case 'postgresql':
        return [
          'Query performance and execution plans',
          'Index usage and table access methods',
          'Function volatility and parameter optimization',
          'Array and JSON operations',
          'Parallel query execution'
        ];
      case 'mysql':
        return [
          'Query performance and execution plans',
          'Index usage and table access methods',
          'JSON operations optimization',
          'Stored procedure variable usage',
          'JOIN order optimization'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          SQL Optimization
        </h2>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <span className="font-medium">
              {getSqlTypeLabel(sqlType)}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="py-1">
                <button
                  onClick={() => handleSqlTypeChange('sqlserver')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sqlType === 'sqlserver'
                      ? isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-100 text-gray-900'
                      : isDarkMode
                        ? 'text-gray-200 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  SQL Server
                </button>
                <button
                  onClick={() => handleSqlTypeChange('postgresql')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sqlType === 'postgresql'
                      ? isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-100 text-gray-900'
                      : isDarkMode
                        ? 'text-gray-200 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  PostgreSQL
                </button>
                <button
                  onClick={() => handleSqlTypeChange('mysql')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sqlType === 'mysql'
                      ? isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-100 text-gray-900'
                      : isDarkMode
                        ? 'text-gray-200 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  MySQL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left panel - Input */}
        <div className="flex-1">
          <h3 className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {getInputLabel(sqlType)}
          </h3>
          <CodeEditor
            value={sqlInput}
            onChange={setSqlInput}
            language="sql"
            placeholder={getPlaceholder(sqlType)}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Right panel - Output */}
        <div className="flex-1">
          <h3 className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Optimized {getInputLabel(sqlType)}
          </h3>
          <CodeEditor
            value={optimizedOutput}
            onChange={() => {}} // Read-only
            language="sql"
            placeholder="Optimized SQL code will appear here..."
            isDarkMode={isDarkMode}
            isReadOnly={true}
          />
          {optimizedOutput && (
            <button 
              onClick={handleCopyOutput}
              className={`mt-2 flex items-center gap-1 px-3 py-1 rounded text-sm ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <Clipboard className="h-4 w-4" /> Copy to Clipboard
            </button>
          )}
        </div>
      </div>

      {optimizationError && (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'}`}>
          {optimizationError}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || !sqlInput.trim()}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105
            ${isOptimizing ? 'opacity-70 cursor-not-allowed' : ''}
            ${isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          <Zap className="h-5 w-5" />
          {isOptimizing ? 'Optimizing...' : 'Optimize SQL'}
        </button>
      </div>

      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          The optimizer will suggest improvements for:
          <ul className="list-disc list-inside mt-2 space-y-1">
            {getOptimizationTips(sqlType).map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </p>
      </div>
    </div>
  );
};

export default OptimizationPanel; 