import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Prisma } from '@lucia/database';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tenant
   */
  async create(dto: CreateTenantDto) {
    // Check if slug is already taken
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        plan: dto.plan,
        moduleStock: dto.moduleStock,
        moduleMarketing: dto.moduleMarketing,
        moduleHealthcare: dto.moduleHealthcare,
        moduleCommissions: dto.moduleCommissions,
        complianceEnhanced: dto.complianceEnhanced,
        dataRetentionMonths: dto.dataRetentionMonths,
        taxId: dto.taxId,
        taxAddress: dto.taxAddress,
        verifactuEnabled: dto.verifactuEnabled,
      },
    });
  }

  /**
   * Find all tenants with optional filtering
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: string;
    plan?: string;
    search?: string;
  }) {
    const { skip = 0, take = 20, status, plan, search } = params || {};

    const where: Prisma.TenantWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumTenantStatusFilter;
    }

    if (plan) {
      where.plan = plan as Prisma.EnumPlanFilter;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          moduleStock: true,
          moduleMarketing: true,
          moduleHealthcare: true,
          moduleCommissions: true,
          verifactuEnabled: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              clients: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  /**
   * Find tenant by ID
   */
  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            services: true,
            appointments: true,
            invoices: true,
            locations: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Update tenant
   */
  async update(id: string, dto: UpdateTenantDto) {
    // Check tenant exists
    await this.findOne(id);

    // If updating slug, check it's not taken
    if (dto.slug) {
      const existing = await this.prisma.tenant.findFirst({
        where: {
          slug: dto.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Tenant slug already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Soft delete tenant (set status to CANCELLED)
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Get tenant statistics
   */
  async getStats(id: string) {
    await this.findOne(id);

    const [users, clients, services, appointments, invoices] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.client.count({ where: { tenantId: id } }),
      this.prisma.service.count({ where: { tenantId: id } }),
      this.prisma.appointment.count({ where: { tenantId: id } }),
      this.prisma.invoice.count({ where: { tenantId: id } }),
    ]);

    const recentAppointments = await this.prisma.appointment.count({
      where: {
        tenantId: id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    return {
      users,
      clients,
      services,
      appointments: {
        total: appointments,
        last30Days: recentAppointments,
      },
      invoices,
    };
  }
}
