import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    UseGuards,
    Req,
    ParseArrayPipe,
    Query,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShortlinksService } from './shortlinks.service';
import { CreateShortlinkDto } from './dto/create-shortlink.dto';
import { UpdateShortlinkDto } from './dto/update-shortlink.dto';
import { ApiKeyGuard } from '@libs/auth-jwt';
import type { AuthenticatedRequest } from '@libs/auth-jwt/interfaces/authenticated-request.interface';
import { GetShortlinksQueryDto } from './dto/get-shortlinks-query.dto';
import {
    PaginatedShortlinksResponseDto,
    ShortLinkResponse,
} from './dto/paginated-shortlinks-response.dto';

@Controller('shortlinks')
export class ShortlinksController {
    constructor(private readonly shortlinksService: ShortlinksService) {}

    @MessagePattern({ cmd: 'get_user_monthly_shortlinks_usage' })
    async getUserMonthlyShortlinksUsage(
        @Payload() payload: { userId: string },
    ) {
        return this.shortlinksService.getUserMonthlyShortlinksUsage(
            payload.userId,
        );
    }

    @Post()
    @UseGuards(ApiKeyGuard)
    async createOne(
        @Req() req: AuthenticatedRequest,
        @Body() createShortlinkDto: CreateShortlinkDto,
    ): Promise<ShortLinkResponse> {
        return this.shortlinksService.createOne(req.user, createShortlinkDto);
    }

    @Post('bulk')
    @UseGuards(ApiKeyGuard)
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
    ): Promise<ShortLinkResponse[]> {
        return this.shortlinksService.createMany(
            req.user,
            createShortlinkDtoArr,
        );
    }

    @Get()
    @UseGuards(ApiKeyGuard)
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
    @UseGuards(ApiKeyGuard)
    findOne(
        @Req() req: AuthenticatedRequest,
        @Param('shortcode') shortCode: string,
    ): object {
        return this.shortlinksService.findOne(req.user, shortCode);
    }

    @Patch(':shortcode')
    @UseGuards(ApiKeyGuard)
    update(
        @Req() req: AuthenticatedRequest,
        @Param('shortcode') shortCode: string,
        @Body() updateShortlinkDto: UpdateShortlinkDto,
    ): Promise<ShortLinkResponse> {
        return this.shortlinksService.update(
            req.user,
            shortCode,
            updateShortlinkDto,
        );
    }

    @HttpCode(204)
    @Delete(':shortcode')
    @UseGuards(ApiKeyGuard)
    remove(
        @Req() req: AuthenticatedRequest,
        @Param('shortcode') shortCode: string,
    ): Promise<void> {
        return this.shortlinksService.remove(req.user, shortCode);
    }
}
