import { Test, TestingModule } from '@nestjs/testing';
import { ShortlinkResolverController } from './shortlink-resolver.controller';
import { ShortlinkResolverService } from './shortlink-resolver.service';

describe('ShortlinkResolverController', () => {
    let shortlinkResolverController: ShortlinkResolverController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [ShortlinkResolverController],
            providers: [ShortlinkResolverService],
        }).compile();

        shortlinkResolverController = app.get<ShortlinkResolverController>(ShortlinkResolverController);
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(shortlinkResolverController.getHello()).toBe('Hello World!');
        });
    });
});
