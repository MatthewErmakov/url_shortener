import { Injectable } from '@nestjs/common';

@Injectable()
export class ShortenerService {
  getHello(): string {
    return 'Hello World!';
  }
}
