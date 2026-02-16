import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { UsersModule } from '../users/users.module';
import { AuthJwtModule } from '@libs/auth-jwt';

@Module({
    imports: [AuthJwtModule, UsersModule],
    controllers: [AccountController],
})
export class AccountModule {}
