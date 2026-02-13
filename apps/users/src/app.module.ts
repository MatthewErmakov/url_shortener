import { Global, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoreModule } from './core.module';

@Module({
    imports: [AuthModule, UsersModule, CoreModule],
})
export class AppModule {}
