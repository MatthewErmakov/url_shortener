import { Injectable } from '@nestjs/common';

@Injectable()
export class QuotaService {
  getHello(): string {
    return 'Hello World!';
  }
}
