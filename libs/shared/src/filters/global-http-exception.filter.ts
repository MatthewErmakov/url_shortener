import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export type HttpErrorMessage = string | string[];

export type HttpErrorResponse = {
    statusCode: number;
    error: string;
    message: HttpErrorMessage;
};

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        if (host.getType() !== 'http') {
            throw exception;
        }

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: HttpErrorMessage = 'Internal server error';
        let error = 'INTERNAL_ERROR';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            error = exception.name;

            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (
                typeof exceptionResponse === 'object' &&
                exceptionResponse !== null &&
                'message' in exceptionResponse
            ) {
                const rawMessage = exceptionResponse.message;

                if (typeof rawMessage === 'string') {
                    message = rawMessage;
                } else if (Array.isArray(rawMessage)) {
                    message = rawMessage.filter(
                        (item): item is string => typeof item === 'string',
                    );
                }
            }
        }

        const body: HttpErrorResponse = {
            statusCode: status,
            error,
            message,
        };

        response.status(status).json(body);
    }
}
