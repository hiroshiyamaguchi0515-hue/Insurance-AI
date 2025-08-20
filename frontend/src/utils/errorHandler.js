/**
 * Utility function to parse API errors and return user-friendly error messages
 * Handles various error formats including Pydantic validation errors
 */
export const parseApiError = error => {
  if (!error.response?.data) {
    return 'Network error occurred';
  }

  const { data } = error.response;

  // Handle Pydantic validation errors (array format)
  if (data.detail && Array.isArray(data.detail)) {
    const errorMessages = data.detail.map(err => {
      // Extract field name from location
      const field =
        err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : 'field';
      return `${field}: ${err.msg}`;
    });
    return errorMessages.join('; ');
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

  return 'An unexpected error occurred';
};

/**
 * Enhanced error handler that logs errors and returns formatted messages
 */
export const handleApiError = (error, context = '') => {
  console.error(`${context} API Error:`, error);
  console.error(`${context} Error Response:`, error.response?.data);

  const errorMessage = parseApiError(error);
  return errorMessage;
};
