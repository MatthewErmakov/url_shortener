import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { SubscriptionType } from '@libs/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('UsersService', () => {
    let service: UsersService;
    let usersRepository: { findOne: jest.Mock };

    beforeEach(async () => {
        usersRepository = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: 'ANALYTICS_SERVICE',
                    useValue: { emit: jest.fn() },
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
});
