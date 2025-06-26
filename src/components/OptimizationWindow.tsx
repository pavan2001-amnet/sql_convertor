import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import { optimizeSqlCode } from '../services/conversionService';
import { Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface OptimizationWindowProps {
  onOptimized: (optimizedCode: string) => void;
  sqlType: 'postgresql' | 'sqlserver';
  sqlCode: string;
}

const OptimizationWindow: React.FC<OptimizationWindowProps> = ({ onOptimized, sqlType, sqlCode }) => {
  const { isDarkMode } = useTheme();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!sqlCode.trim()) {
      setOptimizationError('Please provide SQL code to optimize.');
      return;
    }

    setIsOptimizing(true);
    setOptimizationError(null);
    try {
      const result = await optimizeSqlCode(sqlCode, sqlType);
      onOptimized(result);
    } catch (error) {
      console.error('Optimization error:', error);
      setOptimizationError('Failed to optimize SQL code. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          SQL Optimization
        </h2>
        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${isOptimizing ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}
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
      
      {optimizationError && (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'}`}>
          {optimizationError}
        </div>
      )}
      
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Click the "Optimize SQL" button to analyze and optimize your {sqlType === 'postgresql' ? 'PostgreSQL function' : 'SQL Server stored procedure'}.
          The optimizer will suggest improvements for:
          {sqlType === 'postgresql' ? (
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Query performance and execution plans</li>
              <li>Index usage and table access methods</li>
              <li>Function volatility and parameter optimization</li>
              <li>Array and JSON operations</li>
              <li>Parallel query execution</li>
            </ul>
          ) : (
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Query performance and execution plans</li>
              <li>Index usage and table access methods</li>
              <li>Stored procedure optimization</li>
              <li>Dynamic SQL and parameter handling</li>
              <li>Locking and concurrency</li>
            </ul>
          )}
        </p>
      </div>
    </div>
  );
};

export default OptimizationWindow; 