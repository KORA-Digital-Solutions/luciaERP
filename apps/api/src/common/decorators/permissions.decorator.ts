import { SetMetadata } from '@nestjs/common';
import { Permission } from '@lucia/shared-types';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for a route
 * @example
 * @RequirePermissions('client:read', 'client:update')
 * @Get(':id')
 * findOne() { ... }
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
