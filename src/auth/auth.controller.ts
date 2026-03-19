import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Req,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // Strict rate limiting on auth endpoints
    @Throttle({ short: { limit: 5, ttl: 900000 } })
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Throttle({ short: { limit: 5, ttl: 900000 } })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // Google OAuth
    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleLogin() {
        // Redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req, @Res() res) {
        const tokens = await this.authService.googleCallback(req.user);
        // In production: deep-link back to app with tokens
        res.redirect(
            `exp://localhost:19000/--/auth?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
        );
    }

    @UseGuards(AuthGuard('jwt-refresh'))
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    refresh(@GetUser('id') userId: string) {
        return this.authService.refresh(userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@GetUser('id') userId: string) {
        return this.authService.logout(userId);
    }
}
