import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import {
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: { findByEmail: jest.Mock };
    let jwtService: { decode: jest.Mock; signAsync: jest.Mock };
    let usersRepository: { findOne: jest.Mock };

    beforeEach(async () => {
        usersService = {
            findByEmail: jest.fn(),
        };

        jwtService = {
            decode: jest.fn(),
            signAsync: jest.fn(),
        };

        usersRepository = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: usersService,
                },
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: usersRepository,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('returns authorized response on successful login', async () => {
        usersService.findByEmail.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            password: 'hashed-password',
            xApiKey: 'usr_test',
        });
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

        const result = await service.login({
            email: 'u@example.com',
            password: 'plain-password',
        });

        expect(result).toEqual({
            email: 'u@example.com',
            xApiKey: 'usr_test',
        });
    });

    it('throws bad request when login email is unknown', async () => {
        usersService.findByEmail.mockResolvedValue(null);

        await expect(
            service.login({
                email: 'missing@example.com',
                password: 'plain-password',
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws bad request when password does not match', async () => {
        usersService.findByEmail.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            password: 'hashed-password',
            xApiKey: 'usr_test',
        });
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        await expect(
            service.login({
                email: 'u@example.com',
                password: 'wrong-password',
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns user by valid access token', async () => {
        jwtService.decode.mockReturnValue({ sub: 1 });
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
        });

        const result = await service.findByToken('jwt-token');

        expect(result).toEqual({
            id: 1,
            email: 'u@example.com',
        });
    });

    it('throws unauthorized when token user is missing', async () => {
        jwtService.decode.mockReturnValue({ sub: 999 });
        usersRepository.findOne.mockResolvedValue(null);

        await expect(service.findByToken('jwt-token')).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('throws bad request when x-api-key header is empty', async () => {
        await expect(service.generateTokenByApiKey('')).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('throws bad request when x-api-key does not map to user', async () => {
        usersRepository.findOne.mockResolvedValue(null);

        await expect(
            service.generateTokenByApiKey('usr_missing'),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('generates access token from valid x-api-key', async () => {
        usersRepository.findOne.mockResolvedValue({
            id: 1,
            email: 'u@example.com',
            xApiKey: 'usr_valid',
        });
        jwtService.signAsync.mockResolvedValue('signed-token');

        const result = await service.generateTokenByApiKey('usr_valid');

        expect(jwtService.signAsync).toHaveBeenCalledWith({
            sub: 1,
            email: 'u@example.com',
        });
        expect(result).toEqual({
            accessToken: 'signed-token',
        });
    });
});
