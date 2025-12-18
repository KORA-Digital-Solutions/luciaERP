// @lucia/database
// Prisma client and utilities for LuciaERP multi-tenant database

export {
  prisma,
  setTenantContext,
  clearTenantContext,
  withTenantContext,
  withSuperAdminContext,
  PrismaClient,
} from './client';

// Re-export generated types
export * from './generated/prisma';
