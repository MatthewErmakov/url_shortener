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

describe('UsersService', () => {
    let service: UsersService;
    let usersRepository: {
        findOne: jest.Mock;
        save: jest.Mock;
    };

    beforeEach(async () => {
        usersRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
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
                    useValue: { send: jest.fn() },
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
