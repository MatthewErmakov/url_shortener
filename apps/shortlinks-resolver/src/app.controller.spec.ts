import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import type { Request, Response } from 'express';

describe('ShortlinkResolverController', () => {
    let shortlinkResolverController: AppController;
    let appService: { redirectTo: jest.Mock };

    beforeEach(async () => {
        const serviceMock = {
            redirectTo: jest.fn().mockResolvedValue({
                url: 'https://example.com',
                statusCode: 301,
            }),
        };

        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                {
                    provide: AppService,
                    useValue: serviceMock,
                },
            ],
        }).compile();

        shortlinkResolverController = app.get<AppController>(AppController);
        appService = app.get(AppService);
    });

    it('passes request metadata to redirect service', async () => {
        const req = {
            headers: {
                'x-forwarded-for': '203.0.113.10, 70.41.3.18',
                'user-agent': 'jest-agent',
            },
            ip: '127.0.0.1',
        } as unknown as Request;

        const redirectSpy = jest.fn();
        const res = {
            redirect: redirectSpy,
        } as unknown as Response;

        await shortlinkResolverController.redirect('abc12345', req, res);

        expect(appService.redirectTo).toHaveBeenCalledWith({
            shortCode: 'abc12345',
            ipAddress: '203.0.113.10',
            userAgent: 'jest-agent',
        });
        expect(redirectSpy).toHaveBeenCalledWith(301, 'https://example.com');
    });
});
