import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoreModule } from './core.module';
import { AccountModule } from './account/account.module';

@Module({
    imports: [AuthModule, UsersModule, AccountModule, CoreModule],
})
export class AppModule {}
