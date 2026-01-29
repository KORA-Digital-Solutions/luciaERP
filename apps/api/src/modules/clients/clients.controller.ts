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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { TenantId } from '@/common/decorators/tenant.decorator';
import { PERMISSIONS } from '@lucia/shared-types';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller({ path: 'clients', version: '1' })
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.CLIENT_CREATE)
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateClientDto, @TenantId() tenantId: string) {
    return this.clientsService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CLIENT_READ)
  @ApiOperation({ summary: 'List all clients' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.clientsService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('search')
  @RequirePermissions(PERMISSIONS.CLIENT_READ)
  @ApiOperation({ summary: 'Search clients (autocomplete)' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query (min 2 chars)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 10)' })
  search(
    @TenantId() tenantId: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientsService.search(
      tenantId,
      query,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('stats')
  @RequirePermissions(PERMISSIONS.CLIENT_READ)
  @ApiOperation({ summary: 'Get client statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.clientsService.getStats(tenantId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CLIENT_READ)
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ status: 200, description: 'Client found' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.clientsService.findOne(id, tenantId);
  }

  @Get(':id/export')
  @RequirePermissions(PERMISSIONS.CLIENT_EXPORT)
  @ApiOperation({ summary: 'Export client data (GDPR)' })
  @ApiResponse({ status: 200, description: 'Client data exported' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  exportData(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.clientsService.exportClientData(id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CLIENT_UPDATE)
  @ApiOperation({ summary: 'Update client' })
  @ApiResponse({ status: 200, description: 'Client updated' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
    @TenantId() tenantId: string,
  ) {
    return this.clientsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CLIENT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete client' })
  @ApiResponse({ status: 204, description: 'Client deactivated' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.clientsService.remove(id, tenantId);
  }
}
