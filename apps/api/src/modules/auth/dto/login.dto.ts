import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@demo-beauty.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ description: 'MFA code if enabled' })
  @IsOptional()
  @IsString()
  mfaCode?: string;

  @ApiPropertyOptional({ description: 'Tenant slug for multi-tenant login' })
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
