import type { Request } from 'express';
import type { JwtPayload } from '@libs/auth-jwt';

export interface AuthenticatedRequest extends Request {
    user: JwtPayload;
}
