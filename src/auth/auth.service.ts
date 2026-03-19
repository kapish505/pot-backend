import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new ConflictException('Email already in use');

        const hash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash: hash,
                fcmToken: dto.fcmToken,
            },
        });

        return this.generateTokens(user.id, user.email);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        return this.generateTokens(user.id, user.email);
    }

    async validateGoogleUser(profile: {
        googleId: string;
        email: string;
        name: string;
        photoUrl?: string;
    }) {
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [{ googleId: profile.googleId }, { email: profile.email }],
            },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    googleId: profile.googleId,
                    email: profile.email,
                    name: profile.name,
                    photoUrl: profile.photoUrl,
                },
            });
        } else if (!user.googleId) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.googleId, photoUrl: profile.photoUrl },
            });
        }

        return user;
    }

    async googleCallback(user: any) {
        return this.generateTokens(user.id, user.email);
    }

    async refresh(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException();
        return this.generateTokens(user.id, user.email);
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        return { message: 'Logged out' };
    }

    private async generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
            }),
        ]);

        const hashedRefresh = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefresh },
        });

        return { accessToken, refreshToken, userId };
    }
}
