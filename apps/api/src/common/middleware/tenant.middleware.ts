import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@/modules/database/prisma.service';

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    // Try to get tenant from multiple sources
    const tenantId = this.extractTenantId(req);
    const tenantSlug = this.extractTenantSlug(req);

    if (tenantId) {
      // Validate tenant exists and is active
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, slug: true, status: true },
      });

      if (!tenant) {
        throw new UnauthorizedException('Invalid tenant');
      }

      if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
        throw new UnauthorizedException('Tenant is not active');
      }

      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;

      // Set tenant context for RLS
      await this.prisma.setTenantContext(tenant.id);
    } else if (tenantSlug) {
      // Resolve tenant by slug
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true, slug: true, status: true },
      });

      if (!tenant) {
        throw new UnauthorizedException('Invalid tenant');
      }

      if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
        throw new UnauthorizedException('Tenant is not active');
      }

      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;

      // Set tenant context for RLS
      await this.prisma.setTenantContext(tenant.id);
    }
    // If no tenant info, this might be a super admin request
    // The auth guard will handle authorization

    next();
  }

  private extractTenantId(req: Request): string | undefined {
    // 1. From header (X-Tenant-ID)
    const headerTenantId = req.headers['x-tenant-id'];
    if (typeof headerTenantId === 'string' && this.isValidUuid(headerTenantId)) {
      return headerTenantId;
    }

    // 2. From JWT payload (will be set by auth guard)
    // This is handled in JwtStrategy

    return undefined;
  }

  private extractTenantSlug(req: Request): string | undefined {
    // 1. From header (X-Tenant-Slug)
    const headerSlug = req.headers['x-tenant-slug'];
    if (typeof headerSlug === 'string') {
      return headerSlug;
    }

    // 2. From subdomain (tenant.luciaerp.com)
    const host = req.headers.host;
    if (host) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain && !['www', 'api', 'app'].includes(subdomain)) {
        return subdomain;
      }
    }

    return undefined;
  }

  private extractSubdomain(host: string): string | undefined {
    // Remove port if present
    const hostname = host.split(':')[0];

    // Split by dots
    const parts = hostname.split('.');

    // If we have more than 2 parts (subdomain.domain.tld), return first part
    if (parts.length > 2) {
      return parts[0];
    }

    // For localhost or single domain, no subdomain
    return undefined;
  }

  private isValidUuid(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
