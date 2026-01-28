import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = req.ip;
    return this.authService.refreshTokens(dto.refreshToken, ipAddress);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser() user: CurrentUserData,
    @Body('refreshToken') refreshToken?: string,
  ) {
    await this.authService.logout(user.id, refreshToken);
    return { message: 'Logout successful' };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async me(@CurrentUser() user: CurrentUserData) {
    return user;
  }

  @Post('mfa/setup')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Setup MFA' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  async setupMfa(@CurrentUser() user: CurrentUserData) {
    return this.authService.setupMfa(user.id);
  }

  @Post('mfa/enable')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enable MFA after verification' })
  @ApiResponse({ status: 200, description: 'MFA enabled' })
  async enableMfa(
    @CurrentUser() user: CurrentUserData,
    @Body('code') code: string,
  ) {
    return this.authService.enableMfa(user.id, code);
  }

  @Post('mfa/disable')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  async disableMfa(
    @CurrentUser() user: CurrentUserData,
    @Body('password') password: string,
  ) {
    return this.authService.disableMfa(user.id, password);
  }
}
