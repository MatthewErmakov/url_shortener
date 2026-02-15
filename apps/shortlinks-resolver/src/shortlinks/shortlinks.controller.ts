import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ShortlinksService } from './shortlinks.service';
import { CreateShortlinkDto } from './dto/create-shortlink.dto';
import { UpdateShortlinkDto } from './dto/update-shortlink.dto';
import { ApiKeyGuard } from '@libs/auth-jwt';
import type { AuthenticatedRequest } from '@libs/auth-jwt/interfaces/authenticated-request.interface';
import { ShortLink } from './entities/shortlink.entity';

@UseGuards(ApiKeyGuard)
@Controller('shortlinks')
export class ShortlinksController {
    constructor(private readonly shortlinksService: ShortlinksService) {}

    @Post()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createShortlinkDto: CreateShortlinkDto,
    ): Promise<ShortLink> {
        return this.shortlinksService.create(req.user, createShortlinkDto);
    }

    @Get()
    findAll() {
        return this.shortlinksService.findAll();
    }

    @Get(':short_code')
    findOne(
        @Req() req: AuthenticatedRequest,
        @Param('short_code') shortCode: string,
    ): object {
        return this.shortlinksService.findOne(req.user, shortCode);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateShortlinkDto: UpdateShortlinkDto,
    ) {
        return this.shortlinksService.update(+id, updateShortlinkDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.shortlinksService.remove(+id);
    }
}
