import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for accessing a route
 * @param roles - Array of allowed roles
 * @example
 * @Roles('Manager', 'Admin')
 * @Get('reports')
 * async getReports() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
