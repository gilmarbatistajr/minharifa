import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * Os casos de uso lançam `Error` simples para violações de regra de negócio
 * (CPF inválido, cota já reservada, etc). Sem este filtro, o Nest trata
 * qualquer `Error` não reconhecido como 500 — aqui elas viram 400 com a
 * mensagem original, preservando o comportamento padrão para exceções HTTP
 * já lançadas explicitamente (guards, ValidationPipe).
 */
@Catch(Error)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
    });
  }
}
