import { Test, TestingModule } from '@nestjs/testing';
import { ShortenerController } from './shortener.controller';
import { ShortenerService } from './shortener.service';

describe('ShortenerController', () => {
  let shortenerController: ShortenerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ShortenerController],
      providers: [ShortenerService],
    }).compile();

    shortenerController = app.get<ShortenerController>(ShortenerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(shortenerController.getHello()).toBe('Hello World!');
    });
  });
});
