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
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request', details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class SubscriptionRequiredError extends AppError {
  constructor(message = 'An active subscription is required to view nutrition details') {
    super(402, 'SUBSCRIPTION_REQUIRED', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Request conflicts with the current state') {
    super(409, 'CONFLICT', message);
  }
}

/** Any failure of a third-party provider. The cause is logged, never returned. */
export class UpstreamError extends AppError {
  constructor(message = 'The external service is unavailable') {
    super(502, 'UPSTREAM_ERROR', message);
  }
}

/**
 * Stripe-hosted billing failed to produce a usable URL. Separate from
 * UPSTREAM_ERROR so the UI does not blame Open Food Facts for a Stripe outage.
 */
export class BillingUnavailableError extends AppError {
  constructor(message = 'Billing is unavailable right now') {
    super(502, 'BILLING_UNAVAILABLE', message);
  }
}
