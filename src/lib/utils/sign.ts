export function getSignErrorMessage(status: number) {
  switch (status) {
    case 401:
      return "Invalid email or password.";
    case 403:
      return "Forbidden. You do not have permission to sign in.";
    case 404:
      return "User not found.";
    case 405:
      return "Method not allowed.";
    case 408:
      return "Request timeout.";
    case 409:
      return "Conflict. Account may be locked or disabled.";
    case 410:
      return "Gone. Account may have been deleted.";
    case 411:
      return "Length required.";
    case 412:
      return "Precondition failed.";
    case 413:
      return "Payload too large.";
    case 414:
      return "URI too long.";
    case 415:
      return "Unsupported media type.";
    case 416:
      return "Range not satisfiable.";
    case 417:
      return "Expectation failed.";
    case 418:
      return "I'm a teapot.";
    case 421:
      return "Misdirected request.";
    case 422:
      return "Unprocessable entity.";
    case 423:
      return "Locked.";
    case 424:
      return "Failed dependency.";
    case 425:
      return "Too early.";
    case 426:
      return "Upgrade required.";
    case 428:
      return "Precondition required.";
    case 429:
      return "Too many requests. Please try again later.";
    case 431:
      return "Request header fields too large.";
    case 451:
      return "Unavailable due to legal reasons.";
    default:
      return "Sign in error. Please try again.";
  }
}
