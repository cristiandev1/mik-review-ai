export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class BillingError extends AppError {
  constructor(message: string) {
    super(message, 402, 'BILLING_ERROR');
  }
}

export class TrialExpiredError extends AppError {
  constructor(message = 'Trial expired. Please upgrade to a paid plan.') {
    super(message, 403, 'TRIAL_EXPIRED');
  }
}

export class NoSeatsAvailableError extends AppError {
  constructor(message = 'No seats available. Please purchase more seats.') {
    super(message, 403, 'NO_SEATS_AVAILABLE');
  }
}

export class SubscriptionRequiredError extends AppError {
  constructor(message = 'Active subscription required.') {
    super(message, 403, 'SUBSCRIPTION_REQUIRED');
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}
