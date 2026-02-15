import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Analytics } from './entities/analytics.entity';
import { SubscriptionType } from '@libs/shared';
import { of } from 'rxjs';
import { ForbiddenException } from '@nestjs/common';

describe('AnalyticsService', () => {
    let analyticsService: AnalyticsService;
    let usersClient: { send: jest.Mock };
    let analyticsRepository: {
        create: jest.Mock;
        save: jest.Mock;
        count: jest.Mock;
        find: jest.Mock;
    };

    beforeEach(async () => {
        usersClient = {
            send: jest.fn(),
        };

        analyticsRepository = {
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            find: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                {
                    provide: 'USERS_SERVICE',
                    useValue: usersClient,
                },
                {
                    provide: getRepositoryToken(Analytics),
                    useValue: analyticsRepository,
                },
            ],
        }).compile();

        analyticsService = module.get<AnalyticsService>(AnalyticsService);
    });

    it('stores click event in repository', async () => {
        analyticsRepository.create.mockReturnValue({
            id: 1,
            shortCode: 'abc12345',
        });
        analyticsRepository.save.mockResolvedValue(undefined);

        await analyticsService.recordClick({
            shortlinkId: 1,
            shortCode: 'abc12345',
            ownerUserId: '1',
            clickedAt: '2026-02-15T22:10:00.000Z',
            ipAddress: '203.0.113.10',
            userAgent: 'jest-agent',
        });

        expect(analyticsRepository.create).toHaveBeenCalled();
        expect(analyticsRepository.save).toHaveBeenCalled();
    });

    it('returns total clicks and paginated history for PRO user', async () => {
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.PRO,
            }),
        );
        analyticsRepository.count.mockResolvedValue(1);
        analyticsRepository.find.mockResolvedValue([
            {
                clickedAt: new Date('2026-02-15T22:10:00.000Z'),
                ipAddress: '203.0.113.10',
                userAgent: 'jest-agent',
            },
        ]);

        const result = await analyticsService.getShortlinkAnalytics(
            '1',
            'abc12345',
            50,
            0,
        );

        expect(result.total_clicks).toBe(1);
        expect(result.history[0].ip_address).toBe('203.0.113.10');
    });

    it('throws forbidden for FREE user', async () => {
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.FREE,
            }),
        );

        await expect(
            analyticsService.getShortlinkAnalytics('1', 'abc12345'),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });
});
