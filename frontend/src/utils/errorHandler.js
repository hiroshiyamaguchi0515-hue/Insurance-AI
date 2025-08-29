/**
 * Utility function to parse API errors and return user-friendly error messages
 * Handles various error formats including Pydantic validation errors and server errors
 */
export const parseApiError = error => {
  // Handle network errors (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout - the server took too long to respond';
    }
    if (error.message?.includes('Network Error')) {
      return 'Network error - please check your internet connection';
    }
    return 'Network error occurred - unable to connect to the server';
  }

  const { status, data } = error.response;

  // Handle specific HTTP status codes with meaningful messages
  switch (status) {
    case 400:
      return 'Bad request - please check your input data';
    case 401:
      return 'Unauthorized - please log in again';
    case 403:
      return 'Access denied - you don\'t have permission for this action';
    case 404:
      return 'Resource not found - the requested item doesn\'t exist';
    case 409:
      return 'Conflict - this resource already exists or conflicts with existing data';
    case 422:
      return 'Validation error - please check your input data';
    case 429:
      return 'Too many requests - please wait before trying again';
    case 500:
      return 'Server error - our system encountered an internal error. Please try again later or contact support if the problem persists.';
    case 502:
      return 'Bad gateway - the server is temporarily unavailable. Please try again later.';
    case 503:
      return 'Service unavailable - the server is temporarily down for maintenance. Please try again later.';
    case 504:
      return 'Gateway timeout - the server took too long to respond. Please try again later.';
    default:
      if (status >= 500) {
        return `Server error (${status}) - our system encountered an internal error. Please try again later or contact support if the problem persists.`;
      }
      if (status >= 400) {
        return `Client error (${status}) - please check your request and try again.`;
      }
  }

  // Handle Pydantic validation errors (array format)
  if (data.detail && Array.isArray(data.detail)) {
    const errorMessages = data.detail.map(err => {
      // Extract field name from location
      const field =
        err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : 'field';
      return `${field}: ${err.msg}`;
    });
    return `Validation errors: ${errorMessages.join('; ')}`;
  }

  // Handle single error message
  if (data.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  // Handle error object with message
  if (data.detail && typeof data.detail === 'object') {
    if (data.detail.msg) {
      return data.detail.msg;
    }
    if (data.detail.error) {
      return data.detail.error;
    }
  }

  // Handle other error formats
  if (data.message) {
    return data.message;
  }

  if (data.error) {
    return data.error;
  }

  // If we have a status but no specific message, provide a generic one
  if (status) {
    if (status >= 500) {
      return `Server error (${status}) - please try again later or contact support if the problem persists.`;
    }
    return `Request failed with status ${status}`;
  }

  return 'An unexpected error occurred';
};

/**
 * Enhanced error handler that logs errors and returns formatted messages
 */
export const handleApiError = (error, context = '') => {
  // Log the full error for debugging
  console.error(`${context} API Error:`, error);
  console.error(`${context} Error Response:`, error.response?.data);
  console.error(`${context} Error Status:`, error.response?.status);
  console.error(`${context} Error Headers:`, error.response?.headers);

  const errorMessage = parseApiError(error);
  
  // Log the parsed error message
  console.error(`${context} Parsed Error Message:`, errorMessage);
  
  return errorMessage;
};

/**
 * Specific handler for server errors (5xx)
 */
export const handleServerError = (error, context = '') => {
  if (error.response?.status >= 500) {
    console.error(`${context} Server Error (${error.response.status}):`, error);
    console.error(`${context} Server Error Details:`, error.response?.data);
    
    // Return a user-friendly server error message
    return parseApiError(error);
  }
  
  // For non-server errors, use the regular error handler
  return handleApiError(error, context);
};
