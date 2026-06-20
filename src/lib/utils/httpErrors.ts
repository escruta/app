export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Something went wrong with your request. Please check your input and try again.";
    case 401:
      return "It seems something went wrong. Please try signing in again.";
    case 403:
      return "You don't have permission to perform this action. Please contact support if you believe this is an error.";
    case 404:
      return "The item you're looking for can't be found. Please check the URL or try a different search.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "It seems something went wrong on our end. Please try again later.";
    case 502:
      return "The service is temporarily unavailable. Please try again in a few minutes.";
    case 503:
      return "The service is temporarily unavailable. Please try again in a few minutes.";
    default:
      return "It seems something went wrong. Please try again later.";
  }
}
