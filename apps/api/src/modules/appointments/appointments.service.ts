import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Prisma } from '@lucia/database';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new appointment
   */
  async create(tenantId: string, dto: CreateAppointmentDto) {
    // Validate client belongs to tenant
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId, isActive: true },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Get service to calculate end time
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Validate location belongs to tenant
    const location = await this.prisma.location.findFirst({
      where: { id: dto.locationId, tenantId, isActive: true },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Validate professional if provided
    if (dto.professionalId) {
      const professional = await this.prisma.user.findFirst({
        where: { 
          id: dto.professionalId, 
          tenantId,
          status: 'ACTIVE',
        },
      });
      if (!professional) {
        throw new NotFoundException('Professional not found');
      }
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    // Validate appointment is in the future
    if (startTime <= new Date()) {
      throw new BadRequestException('Appointment must be in the future');
    }

    // Check for overlapping appointments for the professional
    if (dto.professionalId) {
      const overlapping = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          professionalId: dto.professionalId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          ],
        },
      });

      if (overlapping) {
        throw new ConflictException('Professional has a conflicting appointment');
      }
    }

    return this.prisma.appointment.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        locationId: dto.locationId,
        professionalId: dto.professionalId,
        startTime,
        endTime,
        internalNotes: dto.internalNotes,
        clientNotes: dto.clientNotes,
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        service: {
          select: { id: true, name: true, durationMinutes: true, color: true },
        },
        location: {
          select: { id: true, name: true },
        },
        professional: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Find all appointments with filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      clientId?: string;
      professionalId?: string;
      locationId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { 
      skip = 0, 
      take = 50, 
      clientId, 
      professionalId, 
      locationId, 
      status, 
      startDate, 
      endDate 
    } = params || {};

    const where: Prisma.AppointmentWhereInput = {
      tenantId,
    };

    if (clientId) where.clientId = clientId;
    if (professionalId) where.professionalId = professionalId;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status as Prisma.EnumAppointmentStatusFilter;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: 'asc' },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          service: {
            select: { id: true, name: true, durationMinutes: true, color: true, priceNet: true },
          },
          location: {
            select: { id: true, name: true },
          },
          professional: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  /**
   * Get calendar view (all appointments for a date range)
   */
  async getCalendar(
    tenantId: string,
    startDate: string,
    endDate: string,
    professionalId?: string,
    locationId?: string,
  ) {
    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      startTime: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: { notIn: ['CANCELLED'] },
    };

    if (professionalId) where.professionalId = professionalId;
    if (locationId) where.locationId = locationId;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        service: {
          select: { id: true, name: true, durationMinutes: true, color: true },
        },
        professional: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Find appointment by ID
   */
  async findOne(id: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        service: true,
        location: true,
        professional: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /**
   * Update appointment
   */
  async update(id: string, tenantId: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(id, tenantId);

    // Can't update completed or cancelled appointments
    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw new BadRequestException('Cannot update completed or cancelled appointments');
    }

    let endTime = appointment.endTime;

    // If changing time or service, recalculate end time
    if (dto.startTime || dto.serviceId) {
      const service = dto.serviceId
        ? await this.prisma.service.findFirst({
            where: { id: dto.serviceId, tenantId, isActive: true },
          })
        : appointment.service;

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      const startTime = dto.startTime ? new Date(dto.startTime) : appointment.startTime;
      endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

      // Check for conflicts if changing professional or time
      const professionalId = dto.professionalId ?? appointment.professionalId;
      if (professionalId) {
        const overlapping = await this.prisma.appointment.findFirst({
          where: {
            tenantId,
            professionalId,
            id: { not: id },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            OR: [
              {
                startTime: { lt: endTime },
                endTime: { gt: startTime },
              },
            ],
          },
        });

        if (overlapping) {
          throw new ConflictException('Professional has a conflicting appointment');
        }
      }
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        serviceId: dto.serviceId,
        locationId: dto.locationId,
        professionalId: dto.professionalId,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime,
        status: dto.status,
        internalNotes: dto.internalNotes,
        clientNotes: dto.clientNotes,
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        service: {
          select: { id: true, name: true, durationMinutes: true, color: true },
        },
        location: {
          select: { id: true, name: true },
        },
        professional: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Cancel appointment
   */
  async cancel(id: string, tenantId: string) {
    const appointment = await this.findOne(id, tenantId);

    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw new BadRequestException('Cannot cancel completed or already cancelled appointments');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Get appointment statistics
   */
  async getStats(tenantId: string, startDate?: string, endDate?: string) {
    const where: Prisma.AppointmentWhereInput = { tenantId };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [total, byStatus, upcoming] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.appointment.count({
        where: {
          ...where,
          startTime: { gte: new Date() },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
    ]);

    return {
      total,
      upcoming,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Check availability for a professional/location
   */
  async checkAvailability(
    tenantId: string,
    date: string,
    serviceId: string,
    professionalId?: string,
    locationId?: string,
  ) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    };

    if (professionalId) where.professionalId = professionalId;
    if (locationId) where.locationId = locationId;

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
      select: { startTime: true, endTime: true },
    });

    // Generate available slots (simple version - 9am to 7pm, every 30 mins)
    const slots: { time: string; available: boolean }[] = [];
    const slotDuration = 30; // minutes

    for (let hour = 9; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60 * 1000);

        // Check if slot conflicts with existing appointments
        const hasConflict = appointments.some(
          (apt) =>
            (slotStart >= apt.startTime && slotStart < apt.endTime) ||
            (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
            (slotStart <= apt.startTime && slotEnd >= apt.endTime),
        );

        slots.push({
          time: slotStart.toISOString(),
          available: !hasConflict && slotEnd.getHours() <= 19,
        });
      }
    }

    return {
      date,
      serviceId,
      serviceDuration: service.durationMinutes,
      slots,
    };
  }
}
