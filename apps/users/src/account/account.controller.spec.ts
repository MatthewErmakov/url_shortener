import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { UsersService } from '../users/users.service';

describe('AccountController', () => {
    let controller: AccountController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AccountController],
            providers: [
                {
                    provide: UsersService,
                    useValue: {
                        meQuota: jest.fn(),
                        subscribe: jest.fn(),
                        unsubscribe: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<AccountController>(AccountController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
