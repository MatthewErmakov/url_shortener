import { Module } from '@nestjs/common';
import { ShortlinksService } from './shortlinks.service';
import { ShortlinksController } from './shortlinks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortLink } from './entities/shortlink.entity';
import { CoreModule } from '../core.module';

@Module({
    imports: [TypeOrmModule.forFeature([ShortLink]), CoreModule],
    controllers: [ShortlinksController],
    providers: [ShortlinksService],
})
export class ShortlinksModule {}
