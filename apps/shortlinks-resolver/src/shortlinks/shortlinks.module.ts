import { Module } from '@nestjs/common';
import { ShortlinksService } from './shortlinks.service';
import { ShortlinksController } from './shortlinks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortLink } from './entities/shortlink.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ShortLink])],
    controllers: [ShortlinksController],
    providers: [ShortlinksService],
})
export class ShortlinksModule {}
