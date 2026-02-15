import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import type { AuthenticatedRequest } from '@libs/auth-jwt/interfaces/authenticated-request.interface';

describe('AnalyticsController', () => {
    let analyticsController: AnalyticsController;
    let analyticsService: {
        recordClick: jest.Mock;
        getShortlinkAnalytics: jest.Mock;
    };

    beforeEach(async () => {
        const serviceMock = {
            recordClick: jest.fn(),
            getShortlinkAnalytics: jest.fn(),
        };

        const app: TestingModule = await Test.createTestingModule({
            controllers: [AnalyticsController],
            providers: [
                {
                    provide: AnalyticsService,
                    useValue: serviceMock,
                },
            ],
        }).compile();

        analyticsController = app.get<AnalyticsController>(AnalyticsController);
        analyticsService = app.get(AnalyticsService);
    });

    it('delegates click tracking to service', async () => {
        const payload = {
            shortlinkId: 1,
            shortCode: 'abc12345',
            ownerUserId: '1',
            clickedAt: '2026-02-15T22:10:00.000Z',
            ipAddress: '203.0.113.10',
            userAgent: null,
        };

        await analyticsController.trackShortlinkClick(payload);

        expect(analyticsService.recordClick).toHaveBeenCalledWith(payload);
    });

    it('returns analytics payload from service', async () => {
        analyticsService.getShortlinkAnalytics.mockResolvedValue({
            short_code: 'abc12345',
            total_clicks: 1,
            history: [],
            pagination: { limit: 50, offset: 0 },
        });

        const req = {
            user: { sub: '1', email: 'u@example.com' },
        } as AuthenticatedRequest;

        const result = await analyticsController.getShortlinkAnalytics(
            req,
            'abc12345',
            { limit: 50, offset: 0 },
        );

        expect(result.total_clicks).toBe(1);
        expect(analyticsService.getShortlinkAnalytics).toHaveBeenCalledWith(
            '1',
            'abc12345',
            50,
            0,
        );
    });
});
