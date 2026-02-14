import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_API_KEY_STRATEGY } from '../constants';

@Injectable()
export class ApiKeyGuard extends AuthGuard(JWT_API_KEY_STRATEGY) {}
