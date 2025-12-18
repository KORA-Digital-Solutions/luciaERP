import { PrismaClient } from './generated/prisma';

// Singleton pattern para PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Cliente Prisma base (sin contexto de tenant)
 * Usar solo para operaciones globales o de super admin
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Configura el contexto de tenant para la sesión de PostgreSQL
 * Esto activa las políticas RLS para aislar datos por tenant
 *
 * @param tenantId - UUID del tenant actual
 * @param isSuperAdmin - Si es super admin, puede ver todos los datos
 */
export async function setTenantContext(
  tenantId: string | null,
  isSuperAdmin: boolean = false,
): Promise<void> {
  if (isSuperAdmin) {
    await prisma.$executeRawUnsafe(`SET app.is_super_admin = 'true'`);
    await prisma.$executeRawUnsafe(`SET app.current_tenant_id = ''`);
  } else if (tenantId) {
    await prisma.$executeRawUnsafe(`SET app.is_super_admin = 'false'`);
    await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`);
  } else {
    throw new Error('Tenant ID is required for non-super-admin operations');
  }
}

/**
 * Limpia el contexto de tenant de la sesión
 */
export async function clearTenantContext(): Promise<void> {
  await prisma.$executeRawUnsafe(`SET app.current_tenant_id = ''`);
  await prisma.$executeRawUnsafe(`SET app.is_super_admin = 'false'`);
}

/**
 * Ejecuta una función con contexto de tenant aislado
 * Útil para garantizar que el contexto se limpie después de la operación
 *
 * @param tenantId - UUID del tenant
 * @param fn - Función a ejecutar con el contexto
 */
export async function withTenantContext<T>(
  tenantId: string,
  fn: () => Promise<T>,
): Promise<T> {
  await setTenantContext(tenantId);
  try {
    return await fn();
  } finally {
    await clearTenantContext();
  }
}

/**
 * Ejecuta una función con contexto de super admin (bypass RLS)
 *
 * @param fn - Función a ejecutar con permisos elevados
 */
export async function withSuperAdminContext<T>(fn: () => Promise<T>): Promise<T> {
  await setTenantContext(null, true);
  try {
    return await fn();
  } finally {
    await clearTenantContext();
  }
}

export { PrismaClient };
