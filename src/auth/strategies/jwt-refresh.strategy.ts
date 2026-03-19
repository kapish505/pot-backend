import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            secretOrKey: process.env.JWT_REFRESH_SECRET,
            passReqToCallback: true,
            ignoreExpiration: false,
        });
    }

    async validate(req: Request, payload: { sub: string }) {
        const { refreshToken } = req.body;
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.refreshToken) throw new UnauthorizedException();

        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isMatch) throw new UnauthorizedException('Invalid refresh token');

        return user;
    }
}
