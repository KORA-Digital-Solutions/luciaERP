import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@lucia/database';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Fields to exclude from user responses (sensitive data)
const userSelectFields = {
  id: true,
  tenantId: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  permissions: true,
  mfaEnabled: true,
  status: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(dto: CreateUserDto, creatorRole?: string) {
    // Only super admin can create users without tenant
    if (!dto.tenantId && creatorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admin can create global users');
    }

    // Only super admin can create super admin users
    if (dto.role === 'SUPER_ADMIN' && creatorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admin can create super admin users');
    }

    // Check if email already exists within tenant scope
    const existing = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: dto.tenantId || null,
      },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        permissions: dto.permissions || [],
        mfaEnabled: dto.mfaEnabled,
      },
      select: userSelectFields,
    });
  }

  /**
   * Find all users with optional filtering
   */
  async findAll(
    tenantId: string | null,
    params?: {
      skip?: number;
      take?: number;
      role?: string;
      status?: string;
      search?: string;
    },
  ) {
    const { skip = 0, take = 20, role, status, search } = params || {};

    const where: Prisma.UserWhereInput = {
      tenantId: tenantId,
    };

    if (role) {
      where.role = role as Prisma.EnumUserRoleFilter;
    }

    if (status) {
      where.status = status as Prisma.EnumUserStatusFilter;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: userSelectFields,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  /**
   * Find user by ID
   */
  async findOne(id: string, tenantId?: string | null) {
    const where: Prisma.UserWhereUniqueInput = { id };
    
    const user = await this.prisma.user.findUnique({
      where,
      select: {
        ...userSelectFields,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If tenantId is provided, ensure user belongs to that tenant
    if (tenantId !== undefined && user.tenantId !== tenantId) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email within tenant
   */
  async findByEmail(email: string, tenantId?: string | null) {
    return this.prisma.user.findFirst({
      where: {
        email,
        tenantId: tenantId,
      },
      select: userSelectFields,
    });
  }

  /**
   * Update user
   */
  async update(
    id: string,
    dto: UpdateUserDto,
    tenantId?: string | null,
    updaterRole?: string,
  ) {
    const user = await this.findOne(id, tenantId);

    // Prevent non-super-admin from changing role to super admin
    if (dto.role === 'SUPER_ADMIN' && updaterRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot assign super admin role');
    }

    // Prevent demoting super admin unless done by another super admin
    if (user.role === 'SUPER_ADMIN' && dto.role && dto.role !== 'SUPER_ADMIN' && updaterRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot demote super admin');
    }

    // If updating email, check it's not taken
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          tenantId: user.tenantId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        permissions: dto.permissions,
        mfaEnabled: dto.mfaEnabled,
        status: dto.status,
      },
      select: userSelectFields,
    });
  }

  /**
   * Soft delete user (set status to INACTIVE)
   */
  async remove(id: string, tenantId?: string | null) {
    await this.findOne(id, tenantId);

    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: userSelectFields,
    });
  }

  /**
   * Change user password
   */
  async changePassword(id: string, newPassword: string, tenantId?: string | null) {
    await this.findOne(id, tenantId);

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Get users count by role for a tenant
   */
  async getCountByRole(tenantId: string) {
    const counts = await this.prisma.user.groupBy({
      by: ['role'],
      where: { tenantId },
      _count: true,
    });

    return counts.reduce(
      (acc, item) => {
        acc[item.role] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
