import { Controller, Get } from '@nestjs/common';
import { RedirectService } from './redirect.service';

@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get()
  getHello(): string {
    return this.redirectService.getHello();
  }
}
