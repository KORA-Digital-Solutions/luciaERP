import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Prisma } from '@lucia/database';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new client
   */
  async create(tenantId: string, dto: CreateClientDto) {
    // If email provided, check it's not already used in tenant
    if (dto.email) {
      const existing = await this.prisma.client.findFirst({
        where: {
          tenantId,
          email: dto.email,
        },
      });

      if (existing) {
        throw new ConflictException('Client with this email already exists');
      }
    }

    return this.prisma.client.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        country: dto.country,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        marketingConsent: dto.marketingConsent,
        marketingConsentDate: dto.marketingConsent ? new Date() : undefined,
        healthDataConsent: dto.healthDataConsent,
        healthDataConsentDate: dto.healthDataConsent ? new Date() : undefined,
        notes: dto.notes,
      },
    });
  }

  /**
   * Find all clients with filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      search?: string;
      isActive?: boolean;
    },
  ) {
    const { skip = 0, take = 20, search, isActive } = params || {};

    const where: Prisma.ClientWhereInput = {
      tenantId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          birthDate: true,
          gender: true,
          city: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              appointments: true,
              invoices: true,
            },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  /**
   * Search clients (autocomplete)
   */
  async search(tenantId: string, query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    return this.prisma.client.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
  }

  /**
   * Find client by ID
   */
  async findOne(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            appointments: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /**
   * Update client
   */
  async update(id: string, tenantId: string, dto: UpdateClientDto) {
    const client = await this.findOne(id, tenantId);

    // If updating email, check it's not taken
    if (dto.email && dto.email !== client.email) {
      const existing = await this.prisma.client.findFirst({
        where: {
          tenantId,
          email: dto.email,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Client with this email already exists');
      }
    }

    // Handle consent date updates
    const updateData: Prisma.ClientUpdateInput = { ...dto };
    
    if (dto.marketingConsent !== undefined && dto.marketingConsent !== client.marketingConsent) {
      updateData.marketingConsentDate = dto.marketingConsent ? new Date() : null;
    }
    
    if (dto.healthDataConsent !== undefined && dto.healthDataConsent !== client.healthDataConsent) {
      updateData.healthDataConsentDate = dto.healthDataConsent ? new Date() : null;
    }

    if (dto.birthDate) {
      updateData.birthDate = new Date(dto.birthDate);
    }

    return this.prisma.client.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete client (set isActive to false)
   */
  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get client statistics for tenant
   */
  async getStats(tenantId: string) {
    const [total, active, withMarketingConsent, withHealthDataConsent, recentClients] =
      await Promise.all([
        this.prisma.client.count({ where: { tenantId } }),
        this.prisma.client.count({ where: { tenantId, isActive: true } }),
        this.prisma.client.count({ where: { tenantId, marketingConsent: true } }),
        this.prisma.client.count({ where: { tenantId, healthDataConsent: true } }),
        this.prisma.client.count({
          where: {
            tenantId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

    return {
      total,
      active,
      inactive: total - active,
      withMarketingConsent,
      withHealthDataConsent,
      newLast30Days: recentClients,
    };
  }

  /**
   * Export clients data (GDPR compliant)
   */
  async exportClientData(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        appointments: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            service: {
              select: { name: true },
            },
          },
          orderBy: { startTime: 'desc' },
        },
        invoices: {
          select: {
            id: true,
            invoiceCode: true,
            issueDate: true,
            total: true,
            status: true,
          },
          orderBy: { issueDate: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Return GDPR-compliant export format
    return {
      personalData: {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        birthDate: client.birthDate,
        gender: client.gender,
        address: client.address,
        city: client.city,
        postalCode: client.postalCode,
        country: client.country,
        documentType: client.documentType,
        documentNumber: client.documentNumber,
      },
      consents: {
        marketing: {
          given: client.marketingConsent,
          date: client.marketingConsentDate,
        },
        healthData: {
          given: client.healthDataConsent,
          date: client.healthDataConsentDate,
        },
      },
      appointments: client.appointments,
      invoices: client.invoices,
      metadata: {
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        exportedAt: new Date(),
      },
    };
  }
}
