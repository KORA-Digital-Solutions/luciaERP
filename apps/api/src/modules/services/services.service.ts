import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Prisma } from '@lucia/database';
import { VAT_RATES } from '@lucia/shared-types';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new service
   */
  async create(tenantId: string, dto: CreateServiceDto) {
    // Check for duplicate name in tenant
    const existing = await this.prisma.service.findFirst({
      where: {
        tenantId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Service with this name already exists');
    }

    return this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        priceNet: dto.priceNet,
        vatType: dto.vatType || 'STANDARD',
        category: dto.category,
        color: dto.color,
        requiresHealthcareProfessional: dto.requiresHealthcareProfessional,
      },
    });
  }

  /**
   * Find all services with filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      search?: string;
      category?: string;
      isActive?: boolean;
    },
  ) {
    const { skip = 0, take = 50, search, category, isActive } = params || {};

    const where: Prisma.ServiceWhereInput = {
      tenantId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.service.count({ where }),
    ]);

    // Calculate price with VAT for each service
    const itemsWithVat = items.map((service) => ({
      ...service,
      vatRate: VAT_RATES[service.vatType] || 21,
      priceWithVat: this.calculatePriceWithVat(
        Number(service.priceNet),
        service.vatType,
      ),
    }));

    return {
      items: itemsWithVat,
      total,
      skip,
      take,
    };
  }

  /**
   * Get distinct categories for tenant
   */
  async getCategories(tenantId: string) {
    const services = await this.prisma.service.findMany({
      where: { tenantId, isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return services
      .map((s) => s.category)
      .filter((c): c is string => c !== null)
      .sort();
  }

  /**
   * Find service by ID
   */
  async findOne(id: string, tenantId: string) {
    const service = await this.prisma.service.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            appointments: true,
            invoiceLines: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return {
      ...service,
      vatRate: VAT_RATES[service.vatType] || 21,
      priceWithVat: this.calculatePriceWithVat(
        Number(service.priceNet),
        service.vatType,
      ),
    };
  }

  /**
   * Update service
   */
  async update(id: string, tenantId: string, dto: UpdateServiceDto) {
    await this.findOne(id, tenantId);

    // If updating name, check for duplicates
    if (dto.name) {
      const existing = await this.prisma.service.findFirst({
        where: {
          tenantId,
          name: dto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Service with this name already exists');
      }
    }

    const updated = await this.prisma.service.update({
      where: { id },
      data: dto,
    });

    return {
      ...updated,
      vatRate: VAT_RATES[updated.vatType] || 21,
      priceWithVat: this.calculatePriceWithVat(
        Number(updated.priceNet),
        updated.vatType,
      ),
    };
  }

  /**
   * Soft delete service
   */
  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get service statistics
   */
  async getStats(tenantId: string) {
    const [total, active, byCategory] = await Promise.all([
      this.prisma.service.count({ where: { tenantId } }),
      this.prisma.service.count({ where: { tenantId, isActive: true } }),
      this.prisma.service.groupBy({
        by: ['category'],
        where: { tenantId, isActive: true },
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byCategory: byCategory.reduce(
        (acc, item) => {
          acc[item.category || 'Sin categoría'] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Calculate price with VAT
   */
  private calculatePriceWithVat(priceNet: number, vatType: string): number {
    const vatRate = VAT_RATES[vatType] || 21;
    return Math.round(priceNet * (1 + vatRate / 100) * 100) / 100;
  }
}
