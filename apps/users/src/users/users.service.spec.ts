import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { SubscriptionType } from '@libs/shared';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

describe('UsersService', () => {
    let service: UsersService;
    let shortlinksService: {
        send: jest.Mock;
    };
    let usersRepository: {
        findOne: jest.Mock;
        save: jest.Mock;
        create: jest.Mock;
    };

    beforeEach(async () => {
        shortlinksService = {
            send: jest.fn(),
        };

        usersRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: 'ANALYTICS_SERVICE',
                    useValue: { emit: jest.fn() },
                },
                {
                    provide: 'SHORTLINKS_SERVICE',
                    useValue: shortlinksService,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: usersRepository,
                },
                {
                    provide: JwtService,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('creates user when email is not registered', async () => {
        usersRepository.findOne.mockResolvedValue(null);
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
        jest.spyOn(crypto, 'randomBytes').mockReturnValue(Buffer.alloc(28, 1));
        usersRepository.create.mockImplementation((payload) => payload);
        usersRepository.save.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_01010101010101010101010101010101010101010101010101010101',
            password: 'hashed-password',
        });

        const result = await service.create('u@example.com', 'plain-password');

        expect(usersRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'u@example.com',
                password: 'hashed-password',
            }),
        );
        expect(result).toEqual(
            expect.objectContaining({
                email: 'u@example.com',
                xApiKey:
                    'usr_01010101010101010101010101010101010101010101010101010101',
            }),
        );
    });

    it('throws bad request when creating already existing user', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
        });

        await expect(
            service.create('u@example.com', 'plain-password'),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns me payload', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.PRO,
        });

        const result = await service.me(1);

        expect(result).toEqual({
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.PRO,
        });
    });

    it('returns quota payload with remaining count', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.PRO,
        });
        shortlinksService.send.mockReturnValue(
            of({
                userId: '1',
                createdCount: 30,
                periodStart: '2026-02-01T00:00:00.000Z',
                periodEnd: '2026-03-01T00:00:00.000Z',
            }),
        );

        const result = await service.meQuota(1);

        expect(result).toEqual({
            subscriptionType: SubscriptionType.PRO,
            totalQuota: 100,
            createdCount: 30,
            remainingCount: 70,
        });
    });

    it('returns zero remaining quota when created count exceeds limit', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.FREE,
        });
        shortlinksService.send.mockReturnValue(
            of({
                userId: '1',
                createdCount: 999,
                periodStart: '2026-02-01T00:00:00.000Z',
                periodEnd: '2026-03-01T00:00:00.000Z',
            }),
        );

        const result = await service.meQuota(1);

        expect(result).toEqual({
            subscriptionType: SubscriptionType.FREE,
            totalQuota: 10,
            createdCount: 999,
            remainingCount: 0,
        });
    });

    it('returns subscription type for existing user', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            subscriptionType: SubscriptionType.PRO,
        });

        const result = await service.getUserSubscriptionType('1');

        expect(result).toEqual({
            userId: '1',
            subscriptionType: SubscriptionType.PRO,
        });
    });

    it('throws bad request for invalid userId', async () => {
        await expect(
            service.getUserSubscriptionType('abc'),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws not found for unknown user', async () => {
        usersRepository.findOne.mockResolvedValue(null);

        await expect(
            service.getUserSubscriptionType('10'),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws not found when findById user is missing', async () => {
        usersRepository.findOne.mockResolvedValue(null);

        await expect(service.findById(999)).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('subscribes user to PRO', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.FREE,
        });
        usersRepository.save.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.PRO,
        });

        const result = await service.subscribe(1);

        expect(result.subscriptionType).toBe(SubscriptionType.PRO);
    });

    it('unsubscribes user to FREE', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.PRO,
        });
        usersRepository.save.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.FREE,
        });

        const result = await service.unsubscribe(1);

        expect(result.subscriptionType).toBe(SubscriptionType.FREE);
    });

    it('throws conflict when user is already PRO', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.PRO,
        });

        await expect(service.subscribe(1)).rejects.toBeInstanceOf(
            ConflictException,
        );
        await expect(service.subscribe(1)).rejects.toThrow(
            'Your subscription type is already PRO.',
        );
    });

    it('throws conflict when user is already FREE', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_test',
            subscriptionType: SubscriptionType.FREE,
        });

        await expect(service.unsubscribe(1)).rejects.toBeInstanceOf(
            ConflictException,
        );
        await expect(service.unsubscribe(1)).rejects.toThrow(
            'Your subscription type is already FREE.',
        );
    });
});
