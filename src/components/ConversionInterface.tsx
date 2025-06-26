import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import ExamplesPanel from './ExamplesPanel';
import { processMultiDatabaseConversion } from '../services/conversionService';
import { ChevronDown, ChevronUp, Clipboard, Zap, ArrowLeftRight, Database } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ConversionHistory from './ConversionHistory';
import OptimizationPanel from './OptimizationPanel';
import { HistoryItem, DatabaseType } from '../types';

const ConversionInterface: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [sqlInput, setSqlInput] = useState('');
  const [convertedOutput, setConvertedOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isExamplesPanelOpen, setIsExamplesPanelOpen] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sourceType, setSourceType] = useState<DatabaseType>('sqlserver');
  const [targetType, setTargetType] = useState<DatabaseType>('postgresql');
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  
  const handleConvert = async () => {
    if (!sqlInput.trim()) return;
    
    setIsConverting(true);
    try {
      const result = await processMultiDatabaseConversion(sqlInput, sourceType, targetType);
      setConvertedOutput(result);
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        sqlServer: sourceType === 'sqlserver' ? sqlInput : targetType === 'sqlserver' ? result : '',
        postgres: sourceType === 'postgresql' ? sqlInput : targetType === 'postgresql' ? result : '',
        mysql: sourceType === 'mysql' ? sqlInput : targetType === 'mysql' ? result : '',
        timestamp: new Date(),
        conversionDirection: `${sourceType}-to-${targetType}` as any
      };
      
      setConversionHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Conversion error:', error);
      setConvertedOutput('Error converting SQL. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };
  
  const handleCopyOutput = () => {
    navigator.clipboard.writeText(convertedOutput);
  };
  
  const loadFromHistory = (item: HistoryItem) => {
    // Determine source and target from history item
    const direction = item.conversionDirection;
    if (direction) {
      const [source, target] = direction.split('-to-');
      setSourceType(source as DatabaseType);
      setTargetType(target as DatabaseType);
    }
    
    // Set input based on source type
    if (sourceType === 'sqlserver') {
      setSqlInput(item.sqlServer);
    } else if (sourceType === 'postgresql') {
      setSqlInput(item.postgres);
    } else if (sourceType === 'mysql') {
      setSqlInput(item.mysql);
    }
    
    // Set output based on target type
    if (targetType === 'sqlserver') {
      setConvertedOutput(item.sqlServer);
    } else if (targetType === 'postgresql') {
      setConvertedOutput(item.postgres);
    } else if (targetType === 'mysql') {
      setConvertedOutput(item.mysql);
    }
  };
  
  const toggleExamplesPanel = () => {
    setIsExamplesPanelOpen(prev => !prev);
  };

  const getDatabaseLabel = (type: DatabaseType): string => {
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

  const getOutputLabel = (type: DatabaseType): string => {
    switch (type) {
      case 'sqlserver': return 'SQL Server Stored Procedure';
      case 'postgresql': return 'PostgreSQL Function';
      case 'mysql': return 'MySQL Stored Procedure';
      default: return 'PostgreSQL Function';
    }
  };

  const getPlaceholder = (type: DatabaseType): string => {
    switch (type) {
      case 'sqlserver': return 'Paste your SQL Server stored procedure here...';
      case 'postgresql': return 'Paste your PostgreSQL function here...';
      case 'mysql': return 'Paste your MySQL stored procedure here...';
      default: return 'Paste your SQL code here...';
    }
  };

  const getConversionDirection = (): string => {
    return `${getDatabaseLabel(sourceType)} → ${getDatabaseLabel(targetType)}`;
  };

  const handleSourceTypeChange = (type: DatabaseType) => {
    setSourceType(type);
    setIsSourceDropdownOpen(false);
    // Clear input and output when changing source type
    setSqlInput('');
    setConvertedOutput('');
  };

  const handleTargetTypeChange = (type: DatabaseType) => {
    setTargetType(type);
    setIsTargetDropdownOpen(false);
    // Clear output when changing target type
    setConvertedOutput('');
  };
  
  return (
    <div className="space-y-8">
      {/* Database Selection */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
        {/* Source Database */}
        <div className="relative">
          <button
            onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Database className="h-4 w-4" />
            <span className="font-medium">{getDatabaseLabel(sourceType)}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isSourceDropdownOpen && (
            <div className={`absolute left-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="py-1">
                {(['sqlserver', 'postgresql', 'mysql'] as DatabaseType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSourceTypeChange(type)}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      sourceType === type
                        ? isDarkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-100 text-gray-900'
                        : isDarkMode
                          ? 'text-gray-200 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {getDatabaseLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ArrowLeftRight className="h-6 w-6 text-gray-500" />

        {/* Target Database */}
        <div className="relative">
          <button
            onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Database className="h-4 w-4" />
            <span className="font-medium">{getDatabaseLabel(targetType)}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isTargetDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isTargetDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="py-1">
                {(['sqlserver', 'postgresql', 'mysql'] as DatabaseType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTargetTypeChange(type)}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      targetType === type
                        ? isDarkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-100 text-gray-900'
                        : isDarkMode
                          ? 'text-gray-200 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {getDatabaseLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Examples Button */}
        <button
          onClick={toggleExamplesPanel}
          className={`flex items-center text-sm px-3 py-2 rounded ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Examples {isExamplesPanelOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
        </button>
      </div>

      {/* Examples Panel */}
      {isExamplesPanelOpen && (
        <ExamplesPanel 
          onSelectExample={(example) => setSqlInput(example)} 
          conversionMode={`${sourceType}-to-${targetType}`}
        />
      )}

      {/* Conversion Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left panel - Input */}
          <div className="flex-1">
            <div className="mb-2 flex justify-between items-center">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {getInputLabel(sourceType)}
              </h2>
            </div>
            
            <CodeEditor
              value={sqlInput}
              onChange={setSqlInput}
              language="sql"
              placeholder={getPlaceholder(sourceType)}
              isDarkMode={isDarkMode}
            />
          </div>
          
          {/* Right panel - Output */}
          <div className="flex-1">
            <h2 className={`mb-2 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {getOutputLabel(targetType)}
            </h2>
            <CodeEditor
              value={convertedOutput}
              onChange={setConvertedOutput}
              language="sql"
              placeholder={`Converted ${getDatabaseLabel(targetType)} code will appear here...`}
              isDarkMode={isDarkMode}
              isReadOnly={true}
            />
            {convertedOutput && (
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
        
        {/* Convert button */}
        <div className="flex justify-center">
          <button
            onClick={handleConvert}
            disabled={isConverting || !sqlInput.trim() || sourceType === targetType}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105
              ${isConverting || sourceType === targetType ? 'opacity-70 cursor-not-allowed' : ''}
              ${isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            <Zap className="h-5 w-5" />
            {isConverting ? 'Converting...' : `Convert to ${getDatabaseLabel(targetType)}`}
          </button>
        </div>
      </div>

      {/* Optimization Panel */}
      <div className="border-t pt-8">
        <OptimizationPanel />
      </div>
      
      {/* Conversion history */}
      {conversionHistory.length > 0 && (
        <div className="mt-8">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowHistory(prev => !prev)}
          >
            <h3 className="text-lg font-semibold">Conversion History</h3>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {showHistory && (
            <ConversionHistory 
              history={conversionHistory} 
              onSelectItem={loadFromHistory}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ConversionInterface;