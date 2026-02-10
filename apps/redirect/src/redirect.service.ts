import { Injectable } from '@nestjs/common';

@Injectable()
export class RedirectService {
  getHello(): string {
    return 'Hello World!';
  }
}
