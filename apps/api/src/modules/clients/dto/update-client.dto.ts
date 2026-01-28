import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional({ description: 'Whether the client is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
