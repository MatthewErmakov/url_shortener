import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request, Response } from 'express';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('/r/:shortCode')
    async redirect(
        @Param('shortCode') shortCode: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const { url, statusCode } = await this.appService.redirectTo({
            shortCode,
            ipAddress: this.appService.extractIpAddress(req),
            userAgent: this.appService.extractUserAgent(req),
        });

        return res.redirect(statusCode, url);
    }
}
