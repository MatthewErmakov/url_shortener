import {
    ArgumentsHost,
    BadRequestException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import {
    GlobalHttpExceptionFilter,
    HttpErrorResponse,
} from '@libs/shared';

describe('GlobalHttpExceptionFilter', () => {
    let filter: GlobalHttpExceptionFilter;

    beforeEach(() => {
        filter = new GlobalHttpExceptionFilter();
    });

    it('formats HttpException with string message', () => {
        const response = createResponseMock();
        const host = createHttpHost(response);

        filter.catch(new BadRequestException('Bad request'), host);

        expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining<HttpErrorResponse>({
                statusCode: HttpStatus.BAD_REQUEST,
                error: 'BadRequestException',
                message: 'Bad request',
            }),
        );
    });

    it('formats HttpException with object message', () => {
        const response = createResponseMock();
        const host = createHttpHost(response);

        filter.catch(
            new HttpException({ message: 'Not found' }, HttpStatus.NOT_FOUND),
            host,
        );

        expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining<HttpErrorResponse>({
                statusCode: HttpStatus.NOT_FOUND,
                error: 'HttpException',
                message: 'Not found',
            }),
        );
    });

    it('keeps array message as-is for validation-like errors', () => {
        const response = createResponseMock();
        const host = createHttpHost(response);
        const validationMessages = [
            'email must be an email',
            'password should not be empty',
        ];

        filter.catch(
            new HttpException(
                { message: validationMessages },
                HttpStatus.BAD_REQUEST,
            ),
            host,
        );

        expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining<HttpErrorResponse>({
                statusCode: HttpStatus.BAD_REQUEST,
                error: 'HttpException',
                message: validationMessages,
            }),
        );
    });

    it('returns internal error payload for unknown errors', () => {
        const response = createResponseMock();
        const host = createHttpHost(response);

        filter.catch(new Error('boom'), host);

        expect(response.status).toHaveBeenCalledWith(
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining<HttpErrorResponse>({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'INTERNAL_ERROR',
                message: 'Internal server error',
            }),
        );
    });

    it('rethrows for non-http contexts', () => {
        const exception = new Error('rpc error');
        const host = createNonHttpHost('rpc');

        expect(() => filter.catch(exception, host)).toThrow(exception);
    });
});

type ResponseMock = {
    status: jest.Mock;
    json: jest.Mock;
};

function createResponseMock(): ResponseMock {
    const response: ResponseMock = {
        status: jest.fn(),
        json: jest.fn(),
    };

    response.status.mockReturnValue(response);

    return response;
}

function createHttpHost(response: ResponseMock): ArgumentsHost {
    return {
        getType: () => 'http',
        switchToHttp: () => ({
            getResponse: () => response,
            getRequest: () => ({
                originalUrl: '/test',
                url: '/test',
            }),
            getNext: () => undefined,
        }),
        switchToRpc: () => ({
            getData: () => undefined,
            getContext: () => undefined,
        }),
        switchToWs: () => ({
            getClient: () => undefined,
            getData: () => undefined,
        }),
        getArgs: () => [],
        getArgByIndex: () => undefined,
    } as unknown as ArgumentsHost;
}

function createNonHttpHost(type: 'rpc' | 'ws'): ArgumentsHost {
    return {
        getType: () => type,
        switchToHttp: () => ({
            getResponse: () => undefined,
            getRequest: () => undefined,
            getNext: () => undefined,
        }),
        switchToRpc: () => ({
            getData: () => undefined,
            getContext: () => undefined,
        }),
        switchToWs: () => ({
            getClient: () => undefined,
            getData: () => undefined,
        }),
        getArgs: () => [],
        getArgByIndex: () => undefined,
    } as unknown as ArgumentsHost;
}
