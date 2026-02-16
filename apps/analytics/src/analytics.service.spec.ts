import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Analytics } from './entities/analytics.entity';
import { ShortlinkReflection } from './entities/shortlink-reflection.entity';
import { SubscriptionType } from '@libs/shared';
import { of } from 'rxjs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AnalyticsService', () => {
    let analyticsService: AnalyticsService;
    let usersClient: { send: jest.Mock };
    let analyticsRepository: {
        create: jest.Mock;
        save: jest.Mock;
        count: jest.Mock;
        find: jest.Mock;
    };
    let shortlinkReflectionRepository: {
        upsert: jest.Mock;
        delete: jest.Mock;
        findOne: jest.Mock;
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

        shortlinkReflectionRepository = {
            upsert: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
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
                {
                    provide: getRepositoryToken(ShortlinkReflection),
                    useValue: shortlinkReflectionRepository,
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
        shortlinkReflectionRepository.findOne.mockResolvedValue({
            shortlinkId: 1,
        });
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
        expect(shortlinkReflectionRepository.findOne).toHaveBeenCalledWith({
            where: {
                ownerUserId: '1',
                shortCode: 'abc12345',
            },
            select: ['shortlinkId'],
        });
        expect(analyticsRepository.count).toHaveBeenCalledWith({
            where: {
                shortlinkId: 1,
            },
        });
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

    it('throws not found when shortlink is absent in reflection', async () => {
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.PRO,
            }),
        );
        shortlinkReflectionRepository.findOne.mockResolvedValue(null);

        await expect(
            analyticsService.getShortlinkAnalytics('1', 'missing'),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('upserts reflection on shortlink lifecycle event', async () => {
        shortlinkReflectionRepository.upsert.mockResolvedValue(undefined);

        await analyticsService.upsertShortlinkReflection({
            shortlinkId: 1,
            ownerUserId: '1',
            shortCode: 'abc12345',
            createdAt: '2026-02-16T00:00:00.000Z',
            updatedAt: '2026-02-16T00:01:00.000Z',
        });

        expect(shortlinkReflectionRepository.upsert).toHaveBeenCalled();
    });

    it('deletes reflection on shortlink deletion event', async () => {
        shortlinkReflectionRepository.delete.mockResolvedValue(undefined);

        await analyticsService.deleteShortlinkReflection({
            shortlinkId: 1,
            ownerUserId: '1',
            shortCode: 'abc12345',
        });

        expect(shortlinkReflectionRepository.delete).toHaveBeenCalledWith({
            shortlinkId: 1,
        });
    });
});
