import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}

export class NotFoundException extends AppException {
  constructor(resource: string, id?: string) {
    super(
      `${resource.toUpperCase()}_NOT_FOUND`,
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ConflictException extends AppException {
  constructor(message: string, code = 'CONFLICT') {
    super(code, message, HttpStatus.CONFLICT);
  }
}

export class ForbiddenException extends AppException {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED);
  }
}

export class ValidationException extends AppException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

export class PaymentException extends AppException {
  constructor(message: string) {
    super('PAYMENT_ERROR', message, HttpStatus.PAYMENT_REQUIRED);
  }
}
