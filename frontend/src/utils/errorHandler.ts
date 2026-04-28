/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across all frontend services
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ServiceError extends Error {
  status?: number;
  code?: string;
  details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Parse error response from API
 */
export function parseApiError(error: any): ApiError {
  // Axios error
  if (error.response) {
    return {
      message: error.response.data?.detail || error.response.data?.message || 'Request failed',
      status: error.response.status,
      code: error.response.data?.code,
      details: error.response.data,
    };
  }

  // Fetch error
  if (error instanceof Response) {
    return {
      message: error.statusText || 'Request failed',
      status: error.status,
    };
  }

  // Network error
  if (error.request) {
    return {
      message: 'Network error - please check your connection',
      status: 0,
      code: 'NETWORK_ERROR',
    };
  }

  // Generic error
  return {
    message: error.message || 'An unexpected error occurred',
    details: error,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: ApiError): string {
  const { status, message } = error;

  // Authentication errors
  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  // Client errors
  if (status === 400) {
    return message || 'Invalid request. Please check your input.';
  }

  if (status === 404) {
    return 'The requested resource was not found.';
  }

  if (status === 422) {
    return message || 'Validation error. Please check your input.';
  }

  // Server errors
  if (status && status >= 500) {
    return 'Server error. Please try again later.';
  }

  // Rate limiting
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Network errors
  if (status === 0) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Default to the original message
  return message || 'An unexpected error occurred. Please try again.';
}

/**
 * Handle API errors with logging and user-friendly messages
 */
export function handleApiError(error: any, context?: string): ServiceError {
  const apiError = parseApiError(error);
  const userMessage = getUserFriendlyMessage(apiError);

  // Log error for debugging
  console.error(`[${context || 'API Error'}]`, {
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    details: apiError.details,
  });

  return new ServiceError(
    userMessage,
    apiError.status,
    apiError.code,
    apiError.details
  );
}

/**
 * Retry wrapper for API calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
    retryOn?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    retryOn = (error: any) => {
      const apiError = parseApiError(error);
      // Retry on network errors and 5xx server errors
      return apiError.status === 0 || (apiError.status !== undefined && apiError.status >= 500);
    },
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries - 1 || !retryOn(error)) {
        throw error;
      }

      // Wait before retrying
      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper for API calls
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Request timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ServiceError(errorMessage, 408, 'TIMEOUT'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  const apiError = parseApiError(error);
  return apiError.status === 0 || apiError.code === 'NETWORK_ERROR';
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  const apiError = parseApiError(error);
  return apiError.status === 401 || apiError.status === 403;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  const apiError = parseApiError(error);
  return apiError.status === 400 || apiError.status === 422;
}
