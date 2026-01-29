import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Note: Invoices have limited update capabilities once created
// Most changes require issuing a rectifying invoice

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  SUBMITTED = 'SUBMITTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ enum: InvoiceStatus, description: 'Only DRAFT invoices can be updated' })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
