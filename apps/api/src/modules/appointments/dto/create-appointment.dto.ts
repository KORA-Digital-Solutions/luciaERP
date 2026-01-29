import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Client ID' })
  @IsUUID()
  clientId!: string;

  @ApiProperty({ description: 'Service ID' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ description: 'Location ID' })
  @IsUUID()
  locationId!: string;

  @ApiPropertyOptional({ description: 'Professional/Staff ID' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiProperty({ 
    example: '2025-01-28T10:00:00Z', 
    description: 'Appointment start time (ISO 8601)' 
  })
  @IsDateString()
  startTime!: string;

  @ApiPropertyOptional({ description: 'Internal notes for staff' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Notes from client (online booking)' })
  @IsOptional()
  @IsString()
  clientNotes?: string;
}
