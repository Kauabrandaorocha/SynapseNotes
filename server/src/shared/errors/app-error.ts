export class AppError extends Error {
  public status: number;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    status = 500,
    code = 'INTERNAL_ERROR',
    details?: any,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Dados de requisição inválidos.', details?: any) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Credenciais não fornecidas ou inválidas.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Você não possui permissão para executar esta ação.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso solicitado não foi encontrado.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito com o estado atual do recurso.') {
    super(message, 409, 'CONFLICT');
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'O tamanho do payload excede o limite permitido.') {
    super(message, 413, 'PAYLOAD_TOO_LARGE');
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = 'Limite de requisições excedido. Tente novamente em alguns instantes.',
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'A requisição foi compreendida, mas contém erros semânticos.', details?: any) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}
