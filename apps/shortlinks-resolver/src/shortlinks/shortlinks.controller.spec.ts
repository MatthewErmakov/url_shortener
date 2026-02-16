import { Test, TestingModule } from '@nestjs/testing';
import { ShortlinksController } from './shortlinks.controller';
import { ShortlinksService } from './shortlinks.service';

describe('ShortlinksController', () => {
    let controller: ShortlinksController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ShortlinksController],
            providers: [
                {
                    provide: ShortlinksService,
                    useValue: {
                        createOne: jest.fn(),
                        createMany: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<ShortlinksController>(ShortlinksController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
