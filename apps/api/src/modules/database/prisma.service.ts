import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@lucia/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error - Prisma event typing
      this.$on('query', (e: { query: string; duration: number }) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Set tenant context for RLS
   * Must be called before any tenant-scoped query
   */
  async setTenantContext(tenantId: string): Promise<void> {
    await this.$executeRawUnsafe(`SET app.is_super_admin = 'false'`);
    await this.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`);
  }

  /**
   * Set super admin context (bypass RLS)
   */
  async setSuperAdminContext(): Promise<void> {
    await this.$executeRawUnsafe(`SET app.is_super_admin = 'true'`);
    await this.$executeRawUnsafe(`SET app.current_tenant_id = ''`);
  }

  /**
   * Clear tenant context
   */
  async clearTenantContext(): Promise<void> {
    await this.$executeRawUnsafe(`SET app.current_tenant_id = ''`);
    await this.$executeRawUnsafe(`SET app.is_super_admin = 'false'`);
  }

  /**
   * Execute a function with tenant context
   */
  async withTenantContext<T>(
    tenantId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    await this.setTenantContext(tenantId);
    try {
      return await fn();
    } finally {
      await this.clearTenantContext();
    }
  }

  /**
   * Execute a function with super admin context
   */
  async withSuperAdminContext<T>(fn: () => Promise<T>): Promise<T> {
    await this.setSuperAdminContext();
    try {
      return await fn();
    } finally {
      await this.clearTenantContext();
    }
  }
}
