import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantId } from '@/common/decorators/tenant.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PERMISSIONS } from '@lucia/shared-types';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice (draft)' })
  @RequirePermissions(PERMISSIONS.INVOICE_CREATE)
  create(@TenantId() tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices with filtering' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  @RequirePermissions(PERMISSIONS.INVOICE_READ)
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.invoicesService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      clientId,
      status,
      startDate,
      endDate,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @RequirePermissions(PERMISSIONS.INVOICE_READ)
  getStats(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoicesService.getStats(tenantId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID with all details' })
  @RequirePermissions(PERMISSIONS.INVOICE_READ)
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.invoicesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft invoice' })
  @RequirePermissions(PERMISSIONS.INVOICE_UPDATE)
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, tenantId, dto);
  }

  @Post(':id/issue')
  @ApiOperation({ summary: 'Issue an invoice (makes it immutable)' })
  @RequirePermissions(PERMISSIONS.INVOICE_CREATE)
  issue(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.invoicesService.issue(id, tenantId);
  }

  @Post(':id/paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @RequirePermissions(PERMISSIONS.INVOICE_UPDATE)
  markAsPaid(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.invoicesService.markAsPaid(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete invoice (only drafts can be deleted)' })
  @RequirePermissions(PERMISSIONS.INVOICE_DELETE)
  cancel(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.invoicesService.cancel(id, tenantId);
  }
}
