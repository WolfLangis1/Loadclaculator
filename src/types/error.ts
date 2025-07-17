export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  API_LIMIT = 'API_LIMIT',
  CALCULATION = 'CALCULATION',
  FILE_PROCESSING = 'FILE_PROCESSING',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  context?: string;
  recoverable: boolean;
}
