import { Test, TestingModule } from '@nestjs/testing';
import { ShortlinksService } from './shortlinks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShortLink } from './entities/shortlink.entity';
import { of } from 'rxjs';
import { SubscriptionType } from '@libs/shared';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ShortlinksService', () => {
    let service: ShortlinksService;
    let usersClient: { send: jest.Mock };
    let analyticsClient: { emit: jest.Mock };
    let shortLinkRepo: {
        findOne: jest.Mock;
        save: jest.Mock;
        remove: jest.Mock;
        exists: jest.Mock;
        manager: {
            transaction: jest.Mock;
        };
    };

    beforeEach(async () => {
        usersClient = { send: jest.fn() };
        analyticsClient = {
            emit: jest.fn().mockReturnValue({
                subscribe: jest.fn(),
            }),
        };
        shortLinkRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            exists: jest.fn(),
            manager: {
                transaction: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ShortlinksService,
                {
                    provide: 'USERS_SERVICE',
                    useValue: usersClient,
                },
                {
                    provide: 'ANALYTICS_SERVICE',
                    useValue: analyticsClient,
                },
                {
                    provide: getRepositoryToken(ShortLink),
                    useValue: shortLinkRepo,
                },
            ],
        }).compile();

        service = module.get<ShortlinksService>(ShortlinksService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('emits shortlink_created event on createOne', async () => {
        shortLinkRepo.manager.transaction.mockResolvedValue([
            {
                id: 1,
                userId: '1',
                shortCode: 'abc12345',
                originalUrl: 'https://example.com',
                expiresAt: null,
                createdAt: new Date('2026-02-16T00:00:00.000Z'),
                updatedAt: new Date('2026-02-16T00:00:00.000Z'),
                shortenedUrl: 'http://localhost:3004/r/abc12345',
            },
        ]);

        await service.createOne(
            { sub: '1', email: 'u@example.com' },
            { originalUrl: 'https://example.com' },
        );

        expect(analyticsClient.emit).toHaveBeenCalledWith(
            { cmd: 'shortlink_created' },
            {
                shortlinkId: 1,
                ownerUserId: '1',
                shortCode: 'abc12345',
                createdAt: '2026-02-16T00:00:00.000Z',
                updatedAt: '2026-02-16T00:00:00.000Z',
            },
        );
    });

    it('throws not found when updating unknown shortlink', async () => {
        shortLinkRepo.findOne.mockResolvedValue(null);

        await expect(
            service.update({ sub: '1', email: 'u@example.com' }, 'abc12345', {
                originalUrl: 'https://example.com',
            }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids shortcode change for FREE user', async () => {
        shortLinkRepo.findOne.mockResolvedValue({
            id: 1,
            userId: '1',
            shortCode: 'oldcode1',
            originalUrl: 'https://example.com',
            expiresAt: null,
            createdAt: new Date('2026-02-16T00:00:00.000Z'),
            updatedAt: new Date('2026-02-16T00:00:00.000Z'),
        });
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.FREE,
            }),
        );

        await expect(
            service.update({ sub: '1', email: 'u@example.com' }, 'oldcode1', {
                shortCode: 'newcode1',
            }),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('removes shortlink and emits deleted event', async () => {
        shortLinkRepo.findOne.mockResolvedValue({
            id: 1,
            userId: '1',
            shortCode: 'oldcode1',
            originalUrl: 'https://example.com',
            expiresAt: null,
            createdAt: new Date('2026-02-16T00:00:00.000Z'),
            updatedAt: new Date('2026-02-16T00:00:00.000Z'),
        });
        shortLinkRepo.remove.mockResolvedValue(undefined);

        await service.remove({ sub: '1', email: 'u@example.com' }, 'oldcode1');

        expect(shortLinkRepo.remove).toHaveBeenCalled();
        expect(analyticsClient.emit).toHaveBeenCalledWith(
            { cmd: 'shortlink_deleted' },
            {
                shortlinkId: 1,
                ownerUserId: '1',
                shortCode: 'oldcode1',
            },
        );
    });
});
