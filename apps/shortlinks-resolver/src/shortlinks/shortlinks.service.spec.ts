import { Test, TestingModule } from '@nestjs/testing';
import { ShortlinksService } from './shortlinks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShortLink } from './entities/shortlink.entity';
import { of } from 'rxjs';
import { SubscriptionType } from '@libs/shared';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

describe('ShortlinksService', () => {
    let service: ShortlinksService;
    let usersClient: { send: jest.Mock };
    let analyticsClient: { emit: jest.Mock };
    let shortLinkRepo: {
        findOne: jest.Mock;
        findOneOrFail: jest.Mock;
        find: jest.Mock;
        count: jest.Mock;
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
            findOneOrFail: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
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

    it('creates one shortlink and emits created event', async () => {
        const txRepo = createTransactionRepo({
            monthlyCreatedCount: 0,
            shortCodeExists: false,
            savedShortLinks: [
                {
                    id: 1,
                    userId: '1',
                    shortCode: 'abc12345',
                    originalUrl: 'https://example.com',
                    expiresAt: null,
                    createdAt: new Date('2026-02-16T00:00:00.000Z'),
                    updatedAt: new Date('2026-02-16T00:00:00.000Z'),
                },
            ],
        });
        mockTransaction(shortLinkRepo, txRepo);
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.PRO,
            }),
        );

        const result = await service.createOne(
            { sub: '1', email: 'u@example.com' },
            {
                originalUrl: 'https://example.com',
                shortCode: 'abc12345',
            },
        );

        expect(txRepo.count).toHaveBeenCalled();
        expect(txRepo.exists).toHaveBeenCalledWith({
            where: { shortCode: 'abc12345' },
        });
        expect(result.shortenedUrl).toBe('http://localhost:3004/r/abc12345');
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

    it('emits shortlink_created for each item in createMany', async () => {
        shortLinkRepo.manager.transaction.mockResolvedValue([
            {
                id: 1,
                userId: '1',
                shortCode: 'abc11111',
                originalUrl: 'https://example.com/a',
                expiresAt: null,
                createdAt: new Date('2026-02-16T00:00:00.000Z'),
                updatedAt: new Date('2026-02-16T00:00:00.000Z'),
                shortenedUrl: 'http://localhost:3004/r/abc11111',
            },
            {
                id: 2,
                userId: '1',
                shortCode: 'abc22222',
                originalUrl: 'https://example.com/b',
                expiresAt: null,
                createdAt: new Date('2026-02-16T00:00:00.000Z'),
                updatedAt: new Date('2026-02-16T00:00:00.000Z'),
                shortenedUrl: 'http://localhost:3004/r/abc22222',
            },
        ]);

        await service.createMany(
            { sub: '1', email: 'u@example.com' },
            [
                { originalUrl: 'https://example.com/a' },
                { originalUrl: 'https://example.com/b' },
            ],
        );

        expect(analyticsClient.emit).toHaveBeenCalledTimes(2);
        expect(analyticsClient.emit).toHaveBeenNthCalledWith(
            1,
            { cmd: 'shortlink_created' },
            expect.objectContaining({ shortCode: 'abc11111' }),
        );
        expect(analyticsClient.emit).toHaveBeenNthCalledWith(
            2,
            { cmd: 'shortlink_created' },
            expect.objectContaining({ shortCode: 'abc22222' }),
        );
    });

    it('throws forbidden when monthly limit is reached', async () => {
        const txRepo = createTransactionRepo({
            monthlyCreatedCount: 10,
            shortCodeExists: false,
            savedShortLinks: [],
        });
        mockTransaction(shortLinkRepo, txRepo);
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.FREE,
            }),
        );

        await expect(
            service.createOne(
                { sub: '1', email: 'u@example.com' },
                { originalUrl: 'https://example.com' },
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids custom shortcode for FREE user', async () => {
        const txRepo = createTransactionRepo({
            monthlyCreatedCount: 0,
            shortCodeExists: false,
            savedShortLinks: [],
        });
        mockTransaction(shortLinkRepo, txRepo);
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.FREE,
            }),
        );

        await expect(
            service.createOne(
                { sub: '1', email: 'u@example.com' },
                {
                    originalUrl: 'https://example.com',
                    shortCode: 'mycode01',
                },
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws conflict when custom shortcode is already taken on create', async () => {
        const txRepo = createTransactionRepo({
            monthlyCreatedCount: 0,
            shortCodeExists: true,
            savedShortLinks: [],
        });
        mockTransaction(shortLinkRepo, txRepo);
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.PRO,
            }),
        );

        await expect(
            service.createOne(
                { sub: '1', email: 'u@example.com' },
                {
                    originalUrl: 'https://example.com',
                    shortCode: 'mycode01',
                },
            ),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws bad request when expiresAt is invalid on create', async () => {
        const txRepo = createTransactionRepo({
            monthlyCreatedCount: 0,
            shortCodeExists: false,
            savedShortLinks: [],
        });
        mockTransaction(shortLinkRepo, txRepo);
        usersClient.send.mockReturnValue(
            of({
                userId: '1',
                subscriptionType: SubscriptionType.PRO,
            }),
        );

        await expect(
            service.createOne(
                { sub: '1', email: 'u@example.com' },
                {
                    originalUrl: 'https://example.com',
                    expiresAt: 'not-a-date',
                },
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns paginated shortlinks with defaults', async () => {
        shortLinkRepo.count.mockResolvedValue(1);
        shortLinkRepo.find.mockResolvedValue([
            {
                id: 1,
                userId: '1',
                shortCode: 'abc12345',
                originalUrl: 'https://example.com',
                createdAt: new Date('2026-02-16T00:00:00.000Z'),
                updatedAt: new Date('2026-02-16T00:00:00.000Z'),
            },
        ]);

        const result = await service.findAll(
            { sub: '1', email: 'u@example.com' },
            undefined,
            undefined,
        );

        expect(shortLinkRepo.find).toHaveBeenCalledWith({
            where: {
                userId: '1',
            },
            order: {
                createdAt: 'DESC',
            },
            take: 50,
            skip: 0,
        });
        expect(result.pagination).toEqual({
            limit: 50,
            offset: 0,
            total: 1,
        });
    });

    it('caps limit and normalizes offset in findAll', async () => {
        shortLinkRepo.count.mockResolvedValue(0);
        shortLinkRepo.find.mockResolvedValue([]);

        await service.findAll({ sub: '1', email: 'u@example.com' }, 999, -5);

        expect(shortLinkRepo.find).toHaveBeenCalledWith(
            expect.objectContaining({
                take: 200,
                skip: 0,
            }),
        );
    });

    it('finds one shortlink by owner and shortcode', async () => {
        shortLinkRepo.findOneOrFail.mockResolvedValue({
            id: 1,
            userId: '1',
            shortCode: 'abc12345',
            originalUrl: 'https://example.com',
            createdAt: new Date('2026-02-16T00:00:00.000Z'),
            updatedAt: new Date('2026-02-16T00:00:00.000Z'),
        });

        const result = await service.findOne(
            { sub: '1', email: 'u@example.com' },
            'abc12345',
        );

        expect(result.shortenedUrl).toBe('http://localhost:3004/r/abc12345');
    });

    it('throws not found when findOne target is missing', async () => {
        shortLinkRepo.findOneOrFail.mockRejectedValue(new Error('not found'));

        await expect(
            service.findOne({ sub: '1', email: 'u@example.com' }, 'missing'),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws not found when updating unknown shortlink', async () => {
        shortLinkRepo.findOne.mockResolvedValue(null);

        await expect(
            service.update({ sub: '1', email: 'u@example.com' }, 'abc12345', {
                originalUrl: 'https://example.com',
            }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns current shortlink as no-op patch when body has no fields', async () => {
        shortLinkRepo.findOne.mockResolvedValue({
            id: 1,
            userId: '1',
            shortCode: 'oldcode1',
            originalUrl: 'https://example.com',
            expiresAt: null,
            createdAt: new Date('2026-02-16T00:00:00.000Z'),
            updatedAt: new Date('2026-02-16T00:00:00.000Z'),
        });

        const result = await service.update(
            { sub: '1', email: 'u@example.com' },
            'oldcode1',
            {},
        );

        expect(shortLinkRepo.save).not.toHaveBeenCalled();
        expect(result.shortenedUrl).toBe('http://localhost:3004/r/oldcode1');
    });

    it('forbids shortcode change for FREE user on update', async () => {
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

    it('throws conflict when shortcode is already taken on update', async () => {
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
                subscriptionType: SubscriptionType.PRO,
            }),
        );
        shortLinkRepo.exists.mockResolvedValue(true);

        await expect(
            service.update({ sub: '1', email: 'u@example.com' }, 'oldcode1', {
                shortCode: 'taken001',
            }),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates shortlink and emits shortlink_updated event', async () => {
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
                subscriptionType: SubscriptionType.PRO,
            }),
        );
        shortLinkRepo.exists.mockResolvedValue(false);
        shortLinkRepo.save.mockResolvedValue({
            id: 1,
            userId: '1',
            shortCode: 'newcode1',
            originalUrl: 'https://updated.example.com',
            expiresAt: null,
            createdAt: new Date('2026-02-16T00:00:00.000Z'),
            updatedAt: new Date('2026-02-16T00:05:00.000Z'),
        });

        const result = await service.update(
            { sub: '1', email: 'u@example.com' },
            'oldcode1',
            {
                shortCode: 'newcode1',
                originalUrl: 'https://updated.example.com',
            },
        );

        expect(result.shortCode).toBe('newcode1');
        expect(result.originalUrl).toBe('https://updated.example.com');
        expect(analyticsClient.emit).toHaveBeenCalledWith(
            { cmd: 'shortlink_updated' },
            {
                shortlinkId: 1,
                ownerUserId: '1',
                shortCode: 'newcode1',
                createdAt: '2026-02-16T00:00:00.000Z',
                updatedAt: '2026-02-16T00:05:00.000Z',
            },
        );
    });

    it('throws bad request when expiresAt is in the past on update', async () => {
        shortLinkRepo.findOne.mockResolvedValue({
            id: 1,
            userId: '1',
            shortCode: 'oldcode1',
            originalUrl: 'https://example.com',
            expiresAt: null,
            createdAt: new Date('2026-02-16T00:00:00.000Z'),
            updatedAt: new Date('2026-02-16T00:00:00.000Z'),
        });

        await expect(
            service.update({ sub: '1', email: 'u@example.com' }, 'oldcode1', {
                expiresAt: '2000-01-01T00:00:00.000Z',
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws not found when removing unknown shortlink', async () => {
        shortLinkRepo.findOne.mockResolvedValue(null);

        await expect(
            service.remove({ sub: '1', email: 'u@example.com' }, 'missing01'),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes shortlink and emits shortlink_deleted event', async () => {
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

    it('throws bad request for invalid userId in monthly usage', async () => {
        await expect(
            service.getUserMonthlyShortlinksUsage('abc'),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns monthly usage for valid userId', async () => {
        shortLinkRepo.count.mockResolvedValue(7);

        const result = await service.getUserMonthlyShortlinksUsage('3');

        expect(result.userId).toBe('3');
        expect(result.createdCount).toBe(7);
        expect(result.periodStart).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(result.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
});

function createTransactionRepo({
    monthlyCreatedCount,
    shortCodeExists,
    savedShortLinks,
}: {
    monthlyCreatedCount: number;
    shortCodeExists: boolean;
    savedShortLinks: Array<{
        id: number;
        userId: string;
        shortCode: string;
        originalUrl: string;
        expiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}): {
    count: jest.Mock;
    exists: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
} {
    const queue = [...savedShortLinks];

    return {
        count: jest.fn().mockResolvedValue(monthlyCreatedCount),
        exists: jest.fn().mockResolvedValue(shortCodeExists),
        create: jest.fn().mockImplementation((payload) => payload),
        save: jest.fn().mockImplementation(async () => queue.shift()),
    };
}

function mockTransaction(
    shortLinkRepo: { manager: { transaction: jest.Mock } },
    txRepo: {
        count: jest.Mock;
        exists: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    },
): void {
    shortLinkRepo.manager.transaction.mockImplementation(
        async (callback: (manager: unknown) => Promise<unknown>) => {
            const manager = {
                query: jest.fn().mockResolvedValue(undefined),
                getRepository: jest.fn().mockReturnValue(txRepo),
            };

            return callback(manager);
        },
    );
}
