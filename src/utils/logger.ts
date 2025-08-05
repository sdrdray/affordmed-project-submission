// Configuration for the logging middleware
const config = {
  apiUrl: 'http://20.244.56.144/evaluation-service/logs',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzdWJocmFkaXBkcmF5QGdtYWlsLmNvbSIsImV4cCI6MTc1NDM3MzkwMCwiaWF0IjoxNzU0MzczMDAwLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiOTE5YzkxZjQtNjZkZi00M2Q3LTgzMDItYWRlODFkZmFlODdhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoic3ViaHJhZGlwIGRlYnJheSIsInN1YiI6IjQ4MzA4ZGI1LWMyN2ItNGZmYy1iN2FlLTRkNzhjZjE1YTc2OCJ9LCJlbWFpbCI6InN1YmhyYWRpcGRyYXlAZ21haWwuY29tIiwibmFtZSI6InN1YmhyYWRpcCBkZWJyYXkiLCJyb2xsTm8iOiJhMjMwNTIyMjM0NiIsImFjY2Vzc0NvZGUiOiJ5dmhkZGEiLCJjbGllbnRJRCI6IjQ4MzA4ZGI1LWMyN2ItNGZmYy1iN2FlLTRkNzhjZjE1YTc2OCIsImNsaWVudFNlY3JldCI6InRIekFzd3NaVEZ3RGJVdXgifQ._ByyAAm07bBNGCbHKthZwSHDCzHKdPKjHUR0sVo31FXA'
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type FrontendPackage = 'api' | 'component' | 'hook' | 'page' | 'state' | 'style' | 'auth' | 'config' | 'middleware' | 'utils';

interface LogResponse {
  logID: string;
  message: string;
}

/**
 * Reusable logging function that sends logs to the test server
 * @param stack - The application stack ("frontend" for frontend applications)
 * @param level - Log level ("debug", "info", "warn", "error", "fatal")
 * @param packageName - Package name from allowed frontend packages
 * @param message - Descriptive log message
 * @returns Promise<LogResponse> Response from the logging API
 */
export async function Log(
  stack: 'frontend',
  level: LogLevel,
  packageName: FrontendPackage,
  message: string
): Promise<LogResponse> {
  // Validate input parameters
  const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
  const validFrontendPackages: FrontendPackage[] = [
    'api', 'component', 'hook', 'page', 'state', 'style', 
    'auth', 'config', 'middleware', 'utils'
  ];
  
  if (!validLevels.includes(level)) {
    throw new Error(`Invalid level: ${level}. Must be one of: ${validLevels.join(', ')}`);
  }
  
  if (!validFrontendPackages.includes(packageName)) {
    throw new Error(`Invalid package for frontend: ${packageName}. Must be one of: ${validFrontendPackages.join(', ')}`);
  }
  
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }
  
  const logData = {
    stack: stack.toLowerCase(),
    level: level.toLowerCase(),
    package: packageName.toLowerCase(),
    message: message
  };
  
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`
      },
      body: JSON.stringify(logData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    // Fallback logging for critical errors - only for development
    console.error('Failed to send log to server:', error);
    console.error('Original log data:', logData);
    throw error;
  }
}

/**
 * Convenience methods for different log levels
 */
export const Logger = {
  debug: (packageName: FrontendPackage, message: string) => 
    Log('frontend', 'debug', packageName, message),
  info: (packageName: FrontendPackage, message: string) => 
    Log('frontend', 'info', packageName, message),
  warn: (packageName: FrontendPackage, message: string) => 
    Log('frontend', 'warn', packageName, message),
  error: (packageName: FrontendPackage, message: string) => 
    Log('frontend', 'error', packageName, message),
  fatal: (packageName: FrontendPackage, message: string) => 
    Log('frontend', 'fatal', packageName, message)
};
