import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum DocumentType {
  DNI = 'DNI',
  NIE = 'NIE',
  PASSPORT = 'PASSPORT',
  OTHER = 'OTHER',
}

export class CreateClientDto {
  @ApiProperty({ example: 'María' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'García López' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ example: 'maria.garcia@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+34612345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  // Address
  @ApiPropertyOptional({ example: 'Calle Mayor 15, 2º A' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Madrid' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: '28013' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'ES', default: 'ES' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  // Documentation
  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiPropertyOptional({ example: '12345678A' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentNumber?: string;

  // GDPR Consents
  @ApiPropertyOptional({ description: 'Marketing communications consent', default: false })
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @ApiPropertyOptional({ description: 'Health data processing consent', default: false })
  @IsOptional()
  @IsBoolean()
  healthDataConsent?: boolean;

  // Notes
  @ApiPropertyOptional({ description: 'Internal notes about the client' })
  @IsOptional()
  @IsString()
  notes?: string;
}
