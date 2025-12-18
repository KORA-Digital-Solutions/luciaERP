import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/modules/database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string | null;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticate user and return tokens
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password, mfaCode, tenantSlug } = dto;

    // Find user (with tenant context if provided)
    const user = await this.findUserByEmail(email, tenantSlug);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new UnauthorizedException(
        'Account is locked. Please try again later.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return { requiresMfa: true };
      }

      const isMfaValid = this.verifyMfaCode(user.mfaSecret!, mfaCode);
      if (!isMfaValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed attempts on successful login
    await this.resetFailedAttempts(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log audit event
    await this.logAuditEvent(user.tenantId, user.id, 'LOGIN', ipAddress);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Register a new user
   */
  async register(dto: RegisterDto) {
    const { email, password, firstName, lastName, tenantSlug } = dto;

    // Find tenant if slug provided
    let tenantId: string | null = null;
    if (tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (!tenant) {
        throw new BadRequestException('Invalid tenant');
      }

      tenantId = tenant.id;
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        tenantId,
        role: tenantId ? 'USER' : 'SUPER_ADMIN',
        status: 'PENDING_VERIFICATION',
      },
    });

    // TODO: Send verification email

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken: string, ipAddress?: string) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Token has been revoked');
    }

    if (new Date(storedToken.expiresAt) < new Date()) {
      throw new UnauthorizedException('Token has expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Store new refresh token
    await this.storeRefreshToken(
      storedToken.user.id,
      tokens.refreshToken,
      ipAddress,
      storedToken.userAgent || undefined,
    );

    return tokens;
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const secret = authenticator.generateSecret();
    const issuer = this.configService.get<string>('mfa.issuer') || 'LuciaERP';
    const otpauth = authenticator.keyuri(user.email, issuer, secret);

    // Store secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return {
      secret,
      qrCodeUrl: otpauth,
    };
  }

  /**
   * Enable MFA after verification
   */
  async enableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const isValid = this.verifyMfaCode(user.mfaSecret, code);

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { message: 'MFA enabled successfully' };
  }

  /**
   * Disable MFA
   */
  async disableMfa(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, mfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    return { message: 'MFA disabled successfully' };
  }

  // Private helper methods

  private async findUserByEmail(email: string, tenantSlug?: string) {
    let tenantId: string | null = null;

    if (tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      tenantId = tenant?.id || null;
    }

    return this.prisma.user.findFirst({
      where: {
        email,
        ...(tenantSlug ? { tenantId } : {}),
        status: { not: 'INACTIVE' },
      },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            plan: true,
            moduleStock: true,
            moduleMarketing: true,
            moduleHealthcare: true,
            moduleCommissions: true,
          },
        },
      },
    });
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    tenantId: string | null;
    role: string;
    permissions: unknown;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      permissions: (user.permissions as string[]) || [],
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();

    const expiresIn =
      this.parseExpiration(
        this.configService.get<string>('jwt.accessExpiresIn') || '15m',
      ) * 1000;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokenHash = this.hashToken(token);
    const expiresIn = this.parseExpiration(
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });
  }

  private hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  private verifyMfaCode(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  private async handleFailedLogin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, tenantId: true },
    });

    if (!user) return;

    const newAttempts = user.failedLoginAttempts + 1;

    const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
      failedLoginAttempts: newAttempts,
    };

    if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(
        Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log audit event
    await this.logAuditEvent(user.tenantId, userId, 'LOGIN_FAILED');
  }

  private async resetFailedAttempts(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  private async logAuditEvent(
    tenantId: string | null,
    userId: string,
    action: string,
    ipAddress?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: action as any,
        entityType: 'User',
        entityId: userId,
        ipAddress,
      },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, mfaSecret, ...sanitized } = user;
    return sanitized;
  }
}
