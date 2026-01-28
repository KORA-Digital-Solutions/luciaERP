import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { TenantId } from '@/common/decorators/tenant.decorator';
import { PERMISSIONS } from '@lucia/shared-types';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller({ path: 'appointments', version: '1' })
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.APPOINTMENT_CREATE)
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 404, description: 'Client, Service, or Location not found' })
  @ApiResponse({ status: 409, description: 'Conflicting appointment' })
  create(@Body() dto: CreateAppointmentDto, @TenantId() tenantId: string) {
    return this.appointmentsService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.APPOINTMENT_READ)
  @ApiOperation({ summary: 'List appointments' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'professionalId', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('clientId') clientId?: string,
    @Query('professionalId') professionalId?: string,
    @Query('locationId') locationId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      clientId,
      professionalId,
      locationId,
      status,
      startDate,
      endDate,
    });
  }

  @Get('calendar')
  @RequirePermissions(PERMISSIONS.APPOINTMENT_READ)
  @ApiOperation({ summary: 'Get calendar view' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'professionalId', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  getCalendar(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('professionalId') professionalId?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.appointmentsService.getCalendar(
      tenantId,
      startDate,
      endDate,
      professionalId,
      locationId,
    );
  }

  @Get('availability')
  @RequirePermissions(PERMISSIONS.APPOINTMENT_READ)
  @ApiOperation({ summary: 'Check availability for a date' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'serviceId', required: true, type: String })
  @ApiQuery({ name: 'professionalId', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  checkAvailability(
    @TenantId() tenantId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
    @Query('professionalId') professionalId?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.appointmentsService.checkAvailability(
      tenantId,
      date,
      serviceId,
      professionalId,
      locationId,
    );
  }

  @Get('stats')
  @RequirePermissions(PERMISSIONS.APPOINTMENT_READ)
  @ApiOperation({ summary: 'Get appointment statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getStats(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getStats(tenantId, startDate, endDate);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.APPOINTMENT_READ)
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment found' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.appointmentsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.APPOINTMENT_UPDATE)
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'Conflicting appointment' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @TenantId() tenantId: string,
  ) {
    return this.appointmentsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.APPOINTMENT_CANCEL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 204, description: 'Appointment cancelled' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.appointmentsService.cancel(id, tenantId);
  }
}
