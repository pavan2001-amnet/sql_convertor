import React from 'react';
import Header from './Header';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Header />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className={`py-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <p>SQL Server to PostgreSQL Converter © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Layout;