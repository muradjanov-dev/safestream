import {
  Controller, Post, Body, Req, Res, UseGuards,
  Get, Delete, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/login.dto';
import { JwtAuthGuard, CurrentUser, Public, RequestUser } from '@safestream/auth';
import { SessionsService } from '../sessions/sessions.service';
import { MfaService } from '../mfa/mfa.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
    private readonly mfaService: MfaService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req.ip ?? '');
  }

  @Public()
  @Throttle({ default: { ttl: 900000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto,
      req.ip ?? '',
      req.headers['user-agent'] ?? '',
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { success: true, data: { accessToken: result.accessToken, user: result.user } };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, error: { code: 'NO_REFRESH_TOKEN' } });
    }
    const result = await this.authService.refresh(refreshToken, req.ip ?? '');
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { success: true, data: { accessToken: result.accessToken, user: result.user } };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.replace('Bearer ', '');
    // Extract jti from token (decode without verify since we already validated)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    );
    await this.authService.logout(user.id, user.sessionId, payload.jti);
    res.clearCookie('refreshToken');
    return { success: true };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { success: true, message: 'Email verified successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser() user: RequestUser) {
    const sessions = await this.sessionsService.findByUser(user.id);
    return { success: true, data: sessions };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.sessionsService.revokeForUser(sessionId, user.id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  async enableMfa(@CurrentUser() user: RequestUser) {
    const result = await this.mfaService.generateSecret(user.id);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async confirmMfa(@CurrentUser() user: RequestUser, @Body('code') code: string) {
    await this.mfaService.enable(user.id, code);
    return { success: true, message: 'MFA enabled successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  async disableMfa(@CurrentUser() user: RequestUser, @Body('code') code: string) {
    await this.mfaService.disable(user.id, code);
    return { success: true, message: 'MFA disabled' };
  }
}
