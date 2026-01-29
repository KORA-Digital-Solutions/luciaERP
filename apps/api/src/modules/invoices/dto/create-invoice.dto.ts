import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceType {
  STANDARD = 'STANDARD',
  SIMPLIFIED = 'SIMPLIFIED',
  RECTIFYING = 'RECTIFYING',
}

export enum VatType {
  STANDARD = 'STANDARD',
  REDUCED = 'REDUCED',
  SUPER_REDUCED = 'SUPER_REDUCED',
  EXEMPT = 'EXEMPT',
}

export class InvoiceLineDto {
  @ApiPropertyOptional({ description: 'Service ID (optional)' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({ example: 'Corte de pelo' })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: 1 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ example: 25.0, description: 'Unit price without VAT' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 0, description: 'Discount percentage' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discount?: number;

  @ApiPropertyOptional({ enum: VatType, default: VatType.STANDARD })
  @IsOptional()
  @IsEnum(VatType)
  vatType?: VatType;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: 'Client ID (optional for simplified invoices)' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ enum: InvoiceType, default: InvoiceType.STANDARD })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({ description: 'Invoice series (e.g., "A", "B")' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  series?: string;

  @ApiPropertyOptional({ example: '2025-01-28', description: 'Issue date (defaults to today)' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2025-02-28', description: 'Due date for payment' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  // Customer data override (useful when client data has changed)
  @ApiPropertyOptional({ description: 'Customer name (defaults to client name)' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer tax ID (NIF/CIF)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerTaxId?: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ type: [InvoiceLineDto], description: 'Invoice lines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines!: InvoiceLineDto[];

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID of invoice being rectified (for RECTIFYING type)' })
  @IsOptional()
  @IsUUID()
  rectifiesInvoiceId?: string;
}
