import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  tenantId: string | null;
  role: string;
  permissions: string[];
}

/**
 * Decorator to extract current user from request
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: CurrentUserData) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
