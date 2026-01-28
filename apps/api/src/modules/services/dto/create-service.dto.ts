import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VatType {
  STANDARD = 'STANDARD',
  REDUCED = 'REDUCED',
  SUPER_REDUCED = 'SUPER_REDUCED',
  EXEMPT = 'EXEMPT',
}

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de pelo' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'Corte de pelo con lavado incluido' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsInt()
  @Min(5)
  @Max(480) // Max 8 hours
  durationMinutes!: number;

  @ApiProperty({ example: 25.0, description: 'Price without VAT' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceNet!: number;

  @ApiPropertyOptional({ enum: VatType, default: VatType.STANDARD })
  @IsOptional()
  @IsEnum(VatType)
  vatType?: VatType;

  @ApiPropertyOptional({ example: 'Peluquería', description: 'Service category' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ 
    example: '#FF5733', 
    description: 'Hex color for calendar display' 
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex code (e.g., #FF5733)',
  })
  color?: string;

  @ApiPropertyOptional({ 
    description: 'Requires healthcare professional to perform', 
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  requiresHealthcareProfessional?: boolean;
}
