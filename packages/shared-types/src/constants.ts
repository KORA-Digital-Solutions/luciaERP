// =============================================================================
// API Routes Constants
// =============================================================================

export const API_ROUTES = {
  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    MFA: {
      SETUP: '/auth/mfa/setup',
      ENABLE: '/auth/mfa/enable',
      DISABLE: '/auth/mfa/disable',
      VERIFY: '/auth/mfa/verify',
    },
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  TENANTS: {
    BASE: '/tenants',
    BY_ID: (id: string) => `/tenants/${id}`,
    BY_SLUG: (slug: string) => `/tenants/slug/${slug}`,
  },
  CLIENTS: {
    BASE: '/clients',
    BY_ID: (id: string) => `/clients/${id}`,
    SEARCH: '/clients/search',
    EXPORT: '/clients/export',
  },
  SERVICES: {
    BASE: '/services',
    BY_ID: (id: string) => `/services/${id}`,
  },
  APPOINTMENTS: {
    BASE: '/appointments',
    BY_ID: (id: string) => `/appointments/${id}`,
    CALENDAR: '/appointments/calendar',
    AVAILABILITY: '/appointments/availability',
  },
  LOCATIONS: {
    BASE: '/locations',
    BY_ID: (id: string) => `/locations/${id}`,
  },
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id: string) => `/invoices/${id}`,
    ISSUE: (id: string) => `/invoices/${id}/issue`,
    CANCEL: (id: string) => `/invoices/${id}/cancel`,
    PDF: (id: string) => `/invoices/${id}/pdf`,
    SUBMIT_AEAT: (id: string) => `/invoices/${id}/submit-aeat`,
  },
  HEALTH: '/health',
} as const;

// =============================================================================
// VAT Rates by Type (Spain 2025)
// =============================================================================

export const VAT_RATES: Record<string, number> = {
  STANDARD: 21,
  REDUCED: 10,
  SUPER_REDUCED: 4,
  EXEMPT: 0,
} as const;

// =============================================================================
// Permissions Constants
// =============================================================================

export const PERMISSIONS = {
  // Tenants (Super Admin only)
  TENANT_CREATE: 'tenant:create',
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',
  TENANT_MANAGE_BILLING: 'tenant:manage-billing',

  // Users
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage-roles',

  // Clients
  CLIENT_CREATE: 'client:create',
  CLIENT_READ: 'client:read',
  CLIENT_UPDATE: 'client:update',
  CLIENT_DELETE: 'client:delete',
  CLIENT_EXPORT: 'client:export',

  // Services
  SERVICE_CREATE: 'service:create',
  SERVICE_READ: 'service:read',
  SERVICE_UPDATE: 'service:update',
  SERVICE_DELETE: 'service:delete',

  // Appointments
  APPOINTMENT_CREATE: 'appointment:create',
  APPOINTMENT_READ: 'appointment:read',
  APPOINTMENT_UPDATE: 'appointment:update',
  APPOINTMENT_CANCEL: 'appointment:cancel',

  // Invoices
  INVOICE_CREATE: 'invoice:create',
  INVOICE_READ: 'invoice:read',
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_DELETE: 'invoice:delete',
  INVOICE_ISSUE: 'invoice:issue',
  INVOICE_CANCEL: 'invoice:cancel',

  // Stock (module)
  STOCK_READ: 'stock:read',
  STOCK_MANAGE: 'stock:manage',

  // Marketing (module)
  MARKETING_READ: 'marketing:read',
  MARKETING_SEND: 'marketing:send',

  // Healthcare (module)
  HEALTHCARE_READ: 'healthcare:read',
  HEALTHCARE_WRITE: 'healthcare:write',

  // Audit
  AUDIT_READ: 'audit:read',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role-based default permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  OWNER: Object.values(PERMISSIONS).filter(
    (p) => !p.startsWith('tenant:') || p === PERMISSIONS.TENANT_READ,
  ),
  MANAGER: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.CLIENT_DELETE,
    PERMISSIONS.CLIENT_EXPORT,
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_ISSUE,
    PERMISSIONS.STOCK_READ,
    PERMISSIONS.STOCK_MANAGE,
    PERMISSIONS.MARKETING_READ,
    PERMISSIONS.MARKETING_SEND,
    PERMISSIONS.REPORTS_READ,
  ],
  USER: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.INVOICE_READ,
  ],
  HEALTHCARE_PROFESSIONAL: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.HEALTHCARE_READ,
    PERMISSIONS.HEALTHCARE_WRITE,
  ],
} as const;

// =============================================================================
// Module Feature Flags
// =============================================================================

export const MODULES = {
  STOCK: 'stock',
  MARKETING: 'marketing',
  HEALTHCARE: 'healthcare',
  COMMISSIONS: 'commissions',
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

// =============================================================================
// Date/Time Constants
// =============================================================================

export const DEFAULT_TIMEZONE = 'Europe/Madrid';
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
export const TIME_FORMAT = 'HH:mm';

// =============================================================================
// Validation Constants
// =============================================================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PHONE_PATTERN: /^\+?[0-9\s\-().]{6,20}$/,
  SPANISH_NIF_PATTERN: /^[0-9]{8}[A-Z]$/,
  SPANISH_NIE_PATTERN: /^[XYZ][0-9]{7}[A-Z]$/,
  SPANISH_CIF_PATTERN: /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/,
} as const;

// =============================================================================
// Error Codes
// =============================================================================

export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'AUTH_001',
  ACCOUNT_LOCKED: 'AUTH_002',
  MFA_REQUIRED: 'AUTH_003',
  INVALID_MFA_CODE: 'AUTH_004',
  TOKEN_EXPIRED: 'AUTH_005',
  TOKEN_INVALID: 'AUTH_006',
  EMAIL_NOT_VERIFIED: 'AUTH_007',

  // Tenant errors
  TENANT_NOT_FOUND: 'TENANT_001',
  TENANT_SUSPENDED: 'TENANT_002',
  TENANT_LIMIT_EXCEEDED: 'TENANT_003',
  MODULE_NOT_ENABLED: 'TENANT_004',

  // Resource errors
  NOT_FOUND: 'RESOURCE_001',
  ALREADY_EXISTS: 'RESOURCE_002',
  CONFLICT: 'RESOURCE_003',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_001',

  // Invoice errors
  INVOICE_ALREADY_ISSUED: 'INVOICE_001',
  INVOICE_CANNOT_BE_CANCELLED: 'INVOICE_002',

  // Permission errors
  FORBIDDEN: 'PERMISSION_001',
  INSUFFICIENT_PERMISSIONS: 'PERMISSION_002',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
