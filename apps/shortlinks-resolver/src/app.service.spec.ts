import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShortLink } from './shortlinks/entities/shortlink.entity';
import { NotFoundException } from '@nestjs/common';
import type { Request } from 'express';

describe('AppService', () => {
    let service: AppService;
    let analyticsClient: { emit: jest.Mock };
    let shortLinkRepo: { findOne: jest.Mock };

    beforeEach(async () => {
        analyticsClient = {
            emit: jest.fn().mockReturnValue({
                subscribe: jest.fn(),
            }),
        };

        shortLinkRepo = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppService,
                {
                    provide: 'ANALYTICS_SERVICE',
                    useValue: analyticsClient,
                },
                {
                    provide: getRepositoryToken(ShortLink),
                    useValue: shortLinkRepo,
                },
            ],
        }).compile();

        service = module.get<AppService>(AppService);
    });

    it('emits click analytics for successful redirect', async () => {
        shortLinkRepo.findOne.mockResolvedValue({
            id: 1,
            userId: '1',
            shortCode: 'abc12345',
            originalUrl: 'https://example.com',
            expiresAt: null,
        });

        const result = await service.redirectTo({
            shortCode: 'abc12345',
            ipAddress: '203.0.113.10',
            userAgent: 'jest-agent',
        });

        expect(result).toEqual({
            url: 'https://example.com',
            statusCode: 301,
        });
        expect(analyticsClient.emit).toHaveBeenCalledWith(
            { cmd: 'track_shortlink_click' },
            expect.objectContaining({
                shortlinkId: 1,
                shortCode: 'abc12345',
                ownerUserId: '1',
                ipAddress: '203.0.113.10',
                userAgent: 'jest-agent',
            }),
        );
        expect(shortLinkRepo.findOne).toHaveBeenCalledWith({
            where: { shortCode: 'abc12345' },
            select: ['id', 'userId', 'shortCode', 'originalUrl', 'expiresAt'],
        });
    });

    it('throws not found when shortcode does not exist', async () => {
        shortLinkRepo.findOne.mockResolvedValue(null);

        await expect(
            service.redirectTo({
                shortCode: 'unknown',
                ipAddress: '203.0.113.10',
                userAgent: null,
            }),
        ).rejects.toBeInstanceOf(NotFoundException);

        expect(analyticsClient.emit).not.toHaveBeenCalled();
    });

    it('throws not found when shortcode is expired', async () => {
        shortLinkRepo.findOne.mockResolvedValue({
            id: 1,
            userId: '1',
            shortCode: 'abc12345',
            originalUrl: 'https://example.com',
            expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        });

        await expect(
            service.redirectTo({
                shortCode: 'abc12345',
                ipAddress: '203.0.113.10',
                userAgent: null,
            }),
        ).rejects.toBeInstanceOf(NotFoundException);

        expect(analyticsClient.emit).not.toHaveBeenCalled();
    });

    it('extracts first IP from x-forwarded-for string header', () => {
        const request = {
            headers: {
                'x-forwarded-for': '203.0.113.10, 198.51.100.2',
            },
            ip: '127.0.0.1',
        } as unknown as Request;

        expect(service.extractIpAddress(request)).toBe('203.0.113.10');
    });

    it('extracts first IP from x-forwarded-for array header', () => {
        const request = {
            headers: {
                'x-forwarded-for': ['203.0.113.10, 198.51.100.2'],
            },
            ip: '127.0.0.1',
        } as unknown as Request;

        expect(service.extractIpAddress(request)).toBe('203.0.113.10');
    });

    it('falls back to req.ip when x-forwarded-for is missing', () => {
        const request = {
            headers: {},
            ip: '127.0.0.1',
        } as unknown as Request;

        expect(service.extractIpAddress(request)).toBe('127.0.0.1');
    });

    it('extracts user-agent from string header', () => {
        const request = {
            headers: {
                'user-agent': 'Mozilla/5.0',
            },
        } as unknown as Request;

        expect(service.extractUserAgent(request)).toBe('Mozilla/5.0');
    });

    it('extracts user-agent from array header', () => {
        const request = {
            headers: {
                'user-agent': ['Mozilla/5.0'],
            },
        } as unknown as Request;

        expect(service.extractUserAgent(request)).toBe('Mozilla/5.0');
    });

    it('returns null when user-agent header is missing', () => {
        const request = {
            headers: {},
        } as unknown as Request;

        expect(service.extractUserAgent(request)).toBeNull();
    });
});
