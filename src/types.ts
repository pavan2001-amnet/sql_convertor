export interface HistoryItem {
  id: string;
  sqlServer: string;
  postgres: string;
  mysql: string;
  timestamp: Date;
  isOptimized?: boolean;
  conversionDirection?: 'sqlserver-to-postgres' | 'postgres-to-sqlserver' | 'sqlserver-to-mysql' | 'postgres-to-mysql' | 'mysql-to-sqlserver' | 'mysql-to-postgres';
}

export interface Example {
  title: string;
  snippet: string;
  full: string;
}

export type DatabaseType = 'sqlserver' | 'postgresql' | 'mysql';

export interface ConversionRequest {
  sourceCode: string;
  sourceType: DatabaseType;
  targetType: DatabaseType;
}