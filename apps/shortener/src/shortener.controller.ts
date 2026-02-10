import { Controller, Get } from '@nestjs/common';
import { ShortenerService } from './shortener.service';

@Controller()
export class ShortenerController {
  constructor(private readonly shortenerService: ShortenerService) {}

  @Get()
  getHello(): string {
    return this.shortenerService.getHello();
  }
}
