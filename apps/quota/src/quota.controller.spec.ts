import { Test, TestingModule } from '@nestjs/testing';
import { QuotaController } from './quota.controller';
import { QuotaService } from './quota.service';

describe('QuotaController', () => {
  let quotaController: QuotaController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [QuotaController],
      providers: [QuotaService],
    }).compile();

    quotaController = app.get<QuotaController>(QuotaController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(quotaController.getHello()).toBe('Hello World!');
    });
  });
});
