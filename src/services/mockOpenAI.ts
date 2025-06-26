// This file contains mock responses to simulate OpenAI API
// In a production environment, this would be replaced with actual API calls

export const mockOpenAIResponse = (sqlServerCode: string): string => {
  // Simple patterns to identify and transform
  if (sqlServerCode.includes('CREATE PROCEDURE') || sqlServerCode.includes('CREATE PROC')) {
    return transformToPgFunction(sqlServerCode);
  }
  
  // Default fallback response
  return `-- Could not automatically convert the provided SQL Server code.
-- Here's a general PostgreSQL function template:

CREATE OR REPLACE FUNCTION function_name(param1 TYPE, param2 TYPE)
RETURNS return_type AS $$
BEGIN
  -- Converted code would go here
  -- Please provide a valid SQL Server stored procedure for conversion
END;
$$ LANGUAGE plpgsql;`;
};

const transformToPgFunction = (sqlServerCode: string): string => {
  let pgFunction = sqlServerCode;
  
  // Replace procedure declaration
  pgFunction = pgFunction.replace(
    /CREATE\s+(PROC|PROCEDURE)\s+(\[?[\w\d_]+\]?)\.?(\[?[\w\d_]+\]?)/i,
    'CREATE OR REPLACE FUNCTION $2$3'
  );
  
  // Replace parameters
  pgFunction = pgFunction.replace(/@([\w\d_]+)\s+([\w\d_]+)(\(\d+\))?/g, '$1 $2');
  
  // Replace OUTPUT parameters
  pgFunction = pgFunction.replace(/OUTPUT/gi, 'OUT');
  
  // Add RETURNS clause if not present
  if (!pgFunction.includes('RETURNS')) {
    pgFunction = pgFunction.replace(
      /\)(\s*AS|\s*BEGIN|\s*WITH)/i,
      ')\nRETURNS VOID$1'
    );
  }
  
  // Replace AS with LANGUAGE declaration
  pgFunction = pgFunction.replace(
    /AS\s*BEGIN/i,
    'AS $$\nBEGIN'
  );
  
  // Replace END with PostgreSQL function end
  pgFunction = pgFunction.replace(
    /END(\s*;)?$/i,
    'END;\n$$ LANGUAGE plpgsql;'
  );
  
  // Replace common SQL Server specific syntax
  pgFunction = pgFunction
    .replace(/ISNULL\s*\(/gi, 'COALESCE(')
    .replace(/SELECT\s+@([\w\d_]+)\s*=\s*/gi, '$1 := ')
    .replace(/DECLARE\s+@/gi, 'DECLARE ')
    .replace(/SET\s+@([\w\d_]+)\s*=/gi, '$1 :=')
    .replace(/GETDATE\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/GETUTCDATE\(\)/gi, 'CURRENT_TIMESTAMP AT TIME ZONE \'UTC\'')
    .replace(/DATEDIFF\s*\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, 
             'EXTRACT(EPOCH FROM ($3::timestamp - $2::timestamp))/CASE \'$1\' WHEN \'SECOND\' THEN 1 WHEN \'MINUTE\' THEN 60 WHEN \'HOUR\' THEN 3600 WHEN \'DAY\' THEN 86400 END')
    .replace(/CONVERT\s*\((\w+),\s*([^)]+)\)/gi, '$2::$1');
  
  // Add a header comment
  pgFunction = `-- Converted from SQL Server to PostgreSQL
-- Note: This is an automated conversion and may require manual adjustments
-- for complex logic, error handling, or PostgreSQL-specific optimizations.

${pgFunction}`;
  
  return pgFunction;
};