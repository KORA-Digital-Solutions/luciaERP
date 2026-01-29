import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateInvoiceDto, InvoiceLineDto, VatType } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { VAT_RATES } from '@lucia/shared-types';
import { Prisma } from '@lucia/database';
import * as crypto from 'crypto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new invoice (as DRAFT)
   */
  async create(tenantId: string, dto: CreateInvoiceDto) {
    // Validate client if provided
    let client = null;
    if (dto.clientId) {
      client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, tenantId },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    // For standard invoices, client is required
    if (dto.type !== 'SIMPLIFIED' && !dto.clientId && !dto.customerName) {
      throw new BadRequestException('Client or customer name is required for standard invoices');
    }

    // Validate rectifying invoice if specified
    if (dto.rectifiesInvoiceId) {
      const originalInvoice = await this.prisma.invoice.findFirst({
        where: { id: dto.rectifiesInvoiceId, tenantId, status: 'ISSUED' },
      });
      if (!originalInvoice) {
        throw new NotFoundException('Original invoice not found or not issued');
      }
    }

    // Get next invoice number
    const series = dto.series || 'A';
    const year = new Date().getFullYear();
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        series,
        invoiceCode: { startsWith: `${series}-${year}-` },
      },
      orderBy: { number: 'desc' },
    });

    const nextNumber = lastInvoice ? lastInvoice.number + 1 : 1;
    const invoiceCode = `${series}-${year}-${String(nextNumber).padStart(5, '0')}`;

    // Calculate line totals
    const calculatedLines = dto.lines.map((line, index) => 
      this.calculateLineAmounts(line, index),
    );

    // Calculate invoice totals
    const subtotal = calculatedLines.reduce((sum, line) => sum + line.subtotal, 0);
    const totalVat = calculatedLines.reduce((sum, line) => sum + line.vatAmount, 0);
    const total = subtotal + totalVat;

    // Determine customer data
    const customerName = dto.customerName || 
      (client ? `${client.firstName} ${client.lastName}` : 'Cliente anónimo');
    const customerTaxId = dto.customerTaxId || client?.documentNumber || null;
    const customerAddress = dto.customerAddress || 
      (client ? [client.address, client.city, client.postalCode].filter(Boolean).join(', ') : null);

    return this.prisma.invoice.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        series,
        number: nextNumber,
        invoiceCode,
        type: dto.type || 'STANDARD',
        rectifiesInvoiceId: dto.rectifiesInvoiceId,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        customerName,
        customerTaxId,
        customerAddress,
        subtotal,
        totalVat,
        total,
        status: 'DRAFT',
        notes: dto.notes,
        lines: {
          create: calculatedLines.map((line) => ({
            serviceId: line.serviceId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            vatType: line.vatType,
            vatRate: line.vatRate,
            subtotal: line.subtotal,
            vatAmount: line.vatAmount,
            total: line.total,
            sortOrder: line.sortOrder,
          })),
        },
      },
      include: {
        lines: true,
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Find all invoices with filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      clientId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ) {
    const { skip = 0, take = 20, clientId, status, startDate, endDate, search } = params || {};

    const where: Prisma.InvoiceWhereInput = { tenantId };

    if (clientId) where.clientId = clientId;
    if (status) where.status = status as Prisma.EnumInvoiceStatusFilter;

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate);
      if (endDate) where.issueDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { invoiceCode: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerTaxId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: 'desc' },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { lines: true },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  /**
   * Find invoice by ID
   */
  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          orderBy: { sortOrder: 'asc' },
          include: {
            service: {
              select: { id: true, name: true },
            },
          },
        },
        client: true,
        rectifiesInvoice: {
          select: { id: true, invoiceCode: true },
        },
        rectifiedBy: {
          select: { id: true, invoiceCode: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Issue invoice (change from DRAFT to ISSUED)
   * Once issued, invoice is immutable and gets a content hash
   */
  async issue(id: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be issued');
    }

    // Generate content hash for integrity (Veri*Factu requirement)
    const contentHash = this.generateContentHash(invoice);

    // Get previous invoice hash for chain integrity
    const previousInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        status: { in: ['ISSUED', 'SUBMITTED', 'PAID'] },
        id: { not: id },
      },
      orderBy: { registeredAt: 'desc' },
      select: { contentHash: true },
    });

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'ISSUED',
        contentHash,
        previousHash: previousInvoice?.contentHash || null,
        registeredAt: new Date(),
      },
      include: {
        lines: true,
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);

    if (!['ISSUED', 'SUBMITTED'].includes(invoice.status)) {
      throw new BadRequestException('Only issued or submitted invoices can be marked as paid');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }

  /**
   * Cancel invoice (requires rectifying invoice for issued invoices)
   */
  async cancel(id: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);

    if (invoice.status === 'DRAFT') {
      // Draft invoices can be deleted
      return this.prisma.invoice.delete({ where: { id } });
    }

    if (['CANCELLED', 'PAID'].includes(invoice.status)) {
      throw new BadRequestException('Cannot cancel this invoice');
    }

    // For issued invoices, we mark as cancelled but require a rectifying invoice
    throw new BadRequestException(
      'Issued invoices must be cancelled with a rectifying invoice. Create a rectifying invoice instead.',
    );
  }

  /**
   * Update invoice (only DRAFT invoices)
   */
  async update(id: string, tenantId: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(id, tenantId);

    if (invoice.status !== 'DRAFT') {
      throw new ForbiddenException('Only draft invoices can be updated');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: dto,
      include: {
        lines: true,
      },
    });
  }

  /**
   * Get invoice statistics
   */
  async getStats(tenantId: string, startDate?: string, endDate?: string) {
    const where: Prisma.InvoiceWhereInput = { tenantId };

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate);
      if (endDate) where.issueDate.lte = new Date(endDate);
    }

    const [totals, byStatus] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { ...where, status: { notIn: ['DRAFT', 'CANCELLED'] } },
        _sum: { total: true, totalVat: true, subtotal: true },
        _count: true,
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { total: true },
      }),
    ]);

    return {
      totalInvoiced: Number(totals._sum.total) || 0,
      totalVat: Number(totals._sum.totalVat) || 0,
      totalNet: Number(totals._sum.subtotal) || 0,
      invoiceCount: totals._count,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = {
            count: item._count,
            total: Number(item._sum.total) || 0,
          };
          return acc;
        },
        {} as Record<string, { count: number; total: number }>,
      ),
    };
  }

  /**
   * Calculate line amounts
   */
  private calculateLineAmounts(
    line: InvoiceLineDto,
    index: number,
  ): InvoiceLineDto & {
    vatRate: number;
    subtotal: number;
    vatAmount: number;
    total: number;
    sortOrder: number;
  } {
    const vatType = line.vatType ?? VatType.STANDARD;
    const vatRate = VAT_RATES[vatType] || 21;
    const discount = line.discount || 0;

    const grossAmount = line.quantity * line.unitPrice;
    const discountAmount = grossAmount * (discount / 100);
    const subtotal = Math.round((grossAmount - discountAmount) * 100) / 100;
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
    const total = subtotal + vatAmount;

    return {
      ...line,
      vatType,
      vatRate,
      discount,
      subtotal,
      vatAmount,
      total,
      sortOrder: index,
    };
  }

  /**
   * Generate SHA-256 hash of invoice content (for Veri*Factu)
   */
  private generateContentHash(invoice: any): string {
    const content = JSON.stringify({
      invoiceCode: invoice.invoiceCode,
      issueDate: invoice.issueDate,
      customerName: invoice.customerName,
      customerTaxId: invoice.customerTaxId,
      subtotal: invoice.subtotal,
      totalVat: invoice.totalVat,
      total: invoice.total,
      lines: invoice.lines.map((l: any) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
        total: l.total,
      })),
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
