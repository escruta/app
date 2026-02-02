export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Bad request. Please check your input.";
    case 401:
      return "Authentication failed. Please sign in again.";
    case 403:
      return "Access denied. You don't have permission to perform this action.";
    case 404:
      return "Resource not found.";
    case 429:
      return "Too many requests. Please try again later.";
    case 500:
      return "Internal server error. Please try again later.";
    case 502:
      return "Service temporarily unavailable. Please try again later.";
    case 503:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again later.";
  }
}
