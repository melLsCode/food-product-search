/**
 * Errors that are safe to show to a client. `code` is a stable machine-readable
 * string: the frontend maps it to a translated message, so no user-facing prose
 * is ever produced by the API.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}
