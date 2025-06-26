import React from 'react';
import { Database, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <header className={`py-4 px-6 shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Database className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className="text-xl font-bold">SQL Converter</h1>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;