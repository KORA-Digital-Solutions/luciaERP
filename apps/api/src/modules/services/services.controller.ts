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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { TenantId } from '@/common/decorators/tenant.decorator';
import { PERMISSIONS } from '@lucia/shared-types';

@ApiTags('Services')
@ApiBearerAuth()
@Controller({ path: 'services', version: '1' })
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.SERVICE_CREATE)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  create(@Body() dto: CreateServiceDto, @TenantId() tenantId: string) {
    return this.servicesService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICE_READ)
  @ApiOperation({ summary: 'List all services' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.servicesService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('categories')
  @RequirePermissions(PERMISSIONS.SERVICE_READ)
  @ApiOperation({ summary: 'Get service categories' })
  getCategories(@TenantId() tenantId: string) {
    return this.servicesService.getCategories(tenantId);
  }

  @Get('stats')
  @RequirePermissions(PERMISSIONS.SERVICE_READ)
  @ApiOperation({ summary: 'Get service statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.servicesService.getStats(tenantId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SERVICE_READ)
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.servicesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SERVICE_UPDATE)
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
    @TenantId() tenantId: string,
  ) {
    return this.servicesService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SERVICE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete service' })
  @ApiResponse({ status: 204, description: 'Service deactivated' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.servicesService.remove(id, tenantId);
  }
}
