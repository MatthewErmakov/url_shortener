import {
    Controller,
    Get,
    Param,
    Post,
    Redirect,
    Res,
    UseGuards,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyGuard } from '@libs/auth-jwt';
import { AppService } from './app.service';
import type { Response } from 'express';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('/r/:shortCode')
    async redirect(
        @Param('shortCode') shortCode: string,
        @Res() res: Response,
    ) {
        const { url, statusCode } = await this.appService.redirectTo(shortCode);

        return res.redirect(statusCode, url);
    }
}
