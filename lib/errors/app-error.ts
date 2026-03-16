export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "validation_error", 400, details)
  }
}

export class UnauthorizedAppError extends AppError {
  constructor(message = "Usuário não autenticado.") {
    super(message, "unauthorized", 401)
  }
}

export class ConflictAppError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "conflict", 409, details)
  }
}

export class NotFoundAppError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "not_found", 404, details)
  }
}

export class ConfigurationAppError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "configuration_error", 500, details)
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
