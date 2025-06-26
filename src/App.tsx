import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ConversionInterface from './components/ConversionInterface';

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <ConversionInterface />
      </Layout>
    </ThemeProvider>
  );
}

export default App;