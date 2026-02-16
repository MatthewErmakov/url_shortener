import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SubscriptionType } from '@libs/shared';

describe('UsersController', () => {
    let usersController: UsersController;
    let usersService: {
        create: jest.Mock;
        getUserSubscriptionType: jest.Mock;
    };

    beforeEach(async () => {
        const serviceMock = {
            create: jest.fn(),
            getUserSubscriptionType: jest.fn(),
        };

        const app: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: serviceMock,
                },
            ],
        }).compile();

        usersController = app.get<UsersController>(UsersController);
        usersService = app.get(UsersService);
    });

    it('delegates create user to service', async () => {
        usersService.create.mockResolvedValue({
            email: 'u@example.com',
            xApiKey: 'usr_test',
        });

        const result = await usersController.create({
            email: 'u@example.com',
            password: 'password123',
        });

        expect(result.email).toBe('u@example.com');
        expect(usersService.create).toHaveBeenCalledWith(
            'u@example.com',
            'password123',
        );
    });

    it('returns subscription type from service', async () => {
        usersService.getUserSubscriptionType.mockResolvedValue({
            userId: '1',
            subscriptionType: SubscriptionType.PRO,
        });

        const result = await usersController.getUserSubscriptionType({
            userId: '1',
        });

        expect(result.subscriptionType).toBe(SubscriptionType.PRO);
    });
});
