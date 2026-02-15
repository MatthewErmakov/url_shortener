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
    ParseArrayPipe,
    Query,
} from '@nestjs/common';
import { ShortlinksService } from './shortlinks.service';
import { CreateShortlinkDto } from './dto/create-shortlink.dto';
import { UpdateShortlinkDto } from './dto/update-shortlink.dto';
import { ApiKeyGuard } from '@libs/auth-jwt';
import type { AuthenticatedRequest } from '@libs/auth-jwt/interfaces/authenticated-request.interface';
import { ShortLink } from './entities/shortlink.entity';
import { GetShortlinksQueryDto } from './dto/get-shortlinks-query.dto';
import { PaginatedShortlinksResponseDto } from './dto/paginated-shortlinks-response.dto';

@UseGuards(ApiKeyGuard)
@Controller('shortlinks')
export class ShortlinksController {
    constructor(private readonly shortlinksService: ShortlinksService) {}

    @Post()
    async createOne(
        @Req() req: AuthenticatedRequest,
        @Body() createShortlinkDto: CreateShortlinkDto,
    ): Promise<ShortLink> {
        return this.shortlinksService.createOne(req.user, createShortlinkDto);
    }

    @Post('bulk')
    async createMany(
        @Req() req: AuthenticatedRequest,
        @Body(
            new ParseArrayPipe({
                items: CreateShortlinkDto,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        )
        createShortlinkDtoArr: CreateShortlinkDto[],
    ): Promise<ShortLink[]> {
        return this.shortlinksService.createMany(
            req.user,
            createShortlinkDtoArr,
        );
    }

    @Get()
    findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query: GetShortlinksQueryDto,
    ): Promise<PaginatedShortlinksResponseDto> {
        return this.shortlinksService.findAll(
            req.user,
            query.limit,
            query.offset,
        );
    }

    @Get(':shortcode')
    findOne(
        @Req() req: AuthenticatedRequest,
        @Param('shortcode') shortCode: string,
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
