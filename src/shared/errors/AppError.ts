export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado(a).`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Resposta inválida do serviço externo.') {
    super(message, 502, 'BAD_GATEWAY');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Serviço externo indisponível.') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}
