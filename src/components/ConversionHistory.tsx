import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { HistoryItem } from '../types';

interface ConversionHistoryProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  isDarkMode: boolean;
}

const ConversionHistory: React.FC<ConversionHistoryProps> = ({ 
  history, 
  onSelectItem,
  isDarkMode
}) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getSourceCode = (item: HistoryItem): string => {
    if (item.conversionDirection?.includes('sqlserver-to-')) return item.sqlServer;
    if (item.conversionDirection?.includes('postgres-to-')) return item.postgres;
    if (item.conversionDirection?.includes('mysql-to-')) return item.mysql;
    return item.sqlServer; // fallback
  };

  const getTargetCode = (item: HistoryItem): string => {
    if (item.conversionDirection?.includes('-to-sqlserver')) return item.sqlServer;
    if (item.conversionDirection?.includes('-to-postgres')) return item.postgres;
    if (item.conversionDirection?.includes('-to-mysql')) return item.mysql;
    return item.postgres; // fallback
  };

  const getConversionLabel = (direction?: string): string => {
    if (!direction) return 'SQL Server → PostgreSQL';
    
    const [source, target] = direction.split('-to-');
    const sourceLabel = source === 'sqlserver' ? 'SQL Server' : source === 'postgresql' ? 'PostgreSQL' : 'MySQL';
    const targetLabel = target === 'sqlserver' ? 'SQL Server' : target === 'postgresql' ? 'PostgreSQL' : 'MySQL';
    
    return `${sourceLabel} → ${targetLabel}`;
  };
  
  return (
    <div className={`mt-2 rounded-lg border ${
      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
    }`}>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {history.map((item) => {
          const sourceCode = getSourceCode(item);
          const targetCode = getTargetCode(item);
          
          return (
            <li 
              key={item.id}
              className={`p-3 cursor-pointer transition-colors hover:bg-opacity-80 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectItem(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {getConversionLabel(item.conversionDirection)}
                    </span>
                  </div>
                  <div className="font-medium">
                    {sourceCode.split('\n')[0].substring(0, 40)}
                    {sourceCode.split('\n')[0].length > 40 ? '...' : ''}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {targetCode.split('\n')[0].substring(0, 40)}
                    {targetCode.split('\n')[0].length > 40 ? '...' : ''}
                  </div>
                </div>
                <div className={`flex items-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(item.timestamp)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ConversionHistory;