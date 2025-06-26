import axios from 'axios';
import { DatabaseType } from '../types';

const API_URL = 'http://localhost:8000';

export const processConversion = async (sqlServerCode: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/convert`, {
      source_code: sqlServerCode,
      source_type: 'sqlserver',
      target_type: 'postgresql'
    });
    
    return response.data.converted_code;
  } catch (error) {
    console.error('Conversion error:', error);
    throw new Error('Failed to convert SQL code');
  }
};

export const processReverseConversion = async (postgresCode: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/convert`, {
      source_code: postgresCode,
      source_type: 'postgresql',
      target_type: 'sqlserver'
    });
    
    return response.data.converted_code;
  } catch (error) {
    console.error('Conversion error:', error);
    throw new Error('Failed to convert PostgreSQL code to SQL Server');
  }
};

export const processMySQLConversion = async (sourceCode: string, sourceType: DatabaseType): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/convert`, {
      source_code: sourceCode,
      source_type: sourceType,
      target_type: 'mysql'
    });
    
    return response.data.converted_code;
  } catch (error) {
    console.error('MySQL conversion error:', error);
    throw new Error('Failed to convert to MySQL');
  }
};

export const processMultiDatabaseConversion = async (
  sourceCode: string, 
  sourceType: DatabaseType, 
  targetType: DatabaseType
): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/convert`, {
      source_code: sourceCode,
      source_type: sourceType,
      target_type: targetType
    });
    
    return response.data.converted_code;
  } catch (error) {
    console.error('Multi-database conversion error:', error);
    throw new Error(`Failed to convert from ${sourceType} to ${targetType}`);
  }
};

export const optimizeSqlCode = async (sqlCode: string, sqlType: DatabaseType): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/optimize`, {
      sql_code: sqlCode,
      sql_type: sqlType
    });
    
    return response.data.optimized_code;
  } catch (error) {
    console.error('Optimization error:', error);
    throw new Error('Failed to optimize SQL code');
  }
};