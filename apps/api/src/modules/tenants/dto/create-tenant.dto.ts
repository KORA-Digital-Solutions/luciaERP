import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Plan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export class CreateTenantDto {
  @ApiProperty({ example: 'Clínica Dental Madrid' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: 'clinica-dental-madrid',
    description: 'URL-friendly slug for subdomain',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug!: string;

  @ApiPropertyOptional({ enum: Plan, default: Plan.STARTER })
  @IsOptional()
  @IsEnum(Plan)
  plan?: Plan;

  // Feature flags
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  moduleStock?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  moduleMarketing?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  moduleHealthcare?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  moduleCommissions?: boolean;

  // Compliance
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  complianceEnhanced?: boolean;

  @ApiPropertyOptional({ default: 36, description: 'Data retention in months (0 = indefinite)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  dataRetentionMonths?: number;

  // Fiscal
  @ApiPropertyOptional({ example: 'B12345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;

  @ApiPropertyOptional({ example: 'Calle Gran Vía 1, 28013 Madrid' })
  @IsOptional()
  @IsString()
  taxAddress?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  verifactuEnabled?: boolean;
}
