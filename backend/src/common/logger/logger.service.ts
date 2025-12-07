import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: string, context?: string, meta?: Record<string, unknown>) {
    this.logger.info(message, { context, ...meta });
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: Record<string, unknown>,
  ) {
    this.logger.error(message, { context, trace, ...meta });
  }

  warn(message: string, context?: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: Record<string, unknown>) {
    this.logger.verbose(message, { context, ...meta });
  }

  // Custom methods for structured logging
  logRequest(
    method: string,
    url: string,
    userId?: string,
    meta?: Record<string, unknown>,
  ) {
    this.logger.info(`${method} ${url}`, {
      context: 'HTTP',
      type: 'request',
      userId,
      ...meta,
    });
  }

  logResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.logger[level](`${method} ${url} ${statusCode} ${duration}ms`, {
      context: 'HTTP',
      type: 'response',
      statusCode,
      duration,
      userId,
    });
  }

  logAuth(action: string, userId: string, success: boolean, ip?: string) {
    const level = success ? 'info' : 'warn';
    this.logger[level](`Auth ${action}: ${success ? 'success' : 'failed'}`, {
      context: 'Auth',
      type: 'auth',
      action,
      userId,
      success,
      ip,
    });
  }

  logOCR(
    filename: string,
    success: boolean,
    confidence?: number,
    duration?: number,
  ) {
    this.logger.info(`OCR ${success ? 'completed' : 'failed'}: ${filename}`, {
      context: 'OCR',
      type: 'ocr',
      filename,
      success,
      confidence,
      duration,
    });
  }

  logDatabase(
    operation: string,
    entity: string,
    recordId?: string,
    userId?: string,
  ) {
    this.logger.info(`DB ${operation}: ${entity}`, {
      context: 'Database',
      type: 'database',
      operation,
      entity,
      recordId,
      userId,
    });
  }
}
