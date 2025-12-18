// =============================================================================
// Auth DTOs
// =============================================================================

export interface LoginRequestDto {
  email: string;
  password: string;
  /** Código TOTP si MFA habilitado */
  mfaCode?: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
  /** True si se requiere verificación MFA */
  requiresMfa?: boolean;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Slug del tenant al que registrarse (si aplica) */
  tenantSlug?: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface SetupMfaResponseDto {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface VerifyMfaRequestDto {
  code: string;
}

// =============================================================================
// User DTOs
// =============================================================================

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  mfaEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'USER'
  | 'HEALTHCARE_PROFESSIONAL';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

// =============================================================================
// Tenant DTOs
// =============================================================================

export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  modules: TenantModules;
  createdAt: string;
}

export type TenantPlan = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';

export interface TenantModules {
  stock: boolean;
  marketing: boolean;
  healthcare: boolean;
  commissions: boolean;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan?: TenantPlan;
  taxId?: string;
  taxAddress?: string;
}

export interface UpdateTenantDto {
  name?: string;
  plan?: TenantPlan;
  taxId?: string;
  taxAddress?: string;
  modules?: Partial<TenantModules>;
}

// =============================================================================
// Client/Patient DTOs
// =============================================================================

export interface ClientDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  gender?: Gender | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country: string;
  documentType?: DocumentType | null;
  documentNumber?: string | null;
  marketingConsent: boolean;
  healthDataConsent: boolean;
  isActive: boolean;
  createdAt: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type DocumentType = 'DNI' | 'NIE' | 'PASSPORT' | 'OTHER';

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  marketingConsent?: boolean;
  healthDataConsent?: boolean;
  notes?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

// =============================================================================
// Service DTOs
// =============================================================================

export interface ServiceDto {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceNet: number;
  vatType: VatType;
  vatRate: number;
  priceGross: number;
  category?: string | null;
  color?: string | null;
  requiresHealthcareProfessional: boolean;
  isActive: boolean;
}

export type VatType = 'STANDARD' | 'REDUCED' | 'SUPER_REDUCED' | 'EXEMPT';

export interface CreateServiceDto {
  name: string;
  description?: string;
  durationMinutes: number;
  priceNet: number;
  vatType?: VatType;
  category?: string;
  color?: string;
  requiresHealthcareProfessional?: boolean;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {
  isActive?: boolean;
}

// =============================================================================
// Appointment DTOs
// =============================================================================

export interface AppointmentDto {
  id: string;
  client: ClientDto;
  service: ServiceDto;
  location: LocationDto;
  professional?: UserDto | null;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  internalNotes?: string | null;
  clientNotes?: string | null;
  reminderSent: boolean;
  createdAt: string;
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface CreateAppointmentDto {
  clientId: string;
  serviceId: string;
  locationId: string;
  professionalId?: string;
  startTime: string;
  internalNotes?: string;
  clientNotes?: string;
}

export interface UpdateAppointmentDto {
  serviceId?: string;
  locationId?: string;
  professionalId?: string;
  startTime?: string;
  status?: AppointmentStatus;
  internalNotes?: string;
  clientNotes?: string;
}

// =============================================================================
// Location DTOs
// =============================================================================

export interface LocationDto {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  timezone: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface CreateLocationDto {
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  isPrimary?: boolean;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {
  isActive?: boolean;
}

// =============================================================================
// Invoice DTOs (Veri*Factu ready)
// =============================================================================

export interface InvoiceDto {
  id: string;
  series: string;
  number: number;
  invoiceCode: string;
  type: InvoiceType;
  issueDate: string;
  operationDate?: string | null;
  dueDate?: string | null;
  customer: InvoiceCustomerDto;
  lines: InvoiceLineDto[];
  subtotal: number;
  totalVat: number;
  total: number;
  status: InvoiceStatus;
  /** Hash SHA-256 del contenido (Veri*Factu) */
  contentHash?: string | null;
  /** Código QR para verificación */
  qrCode?: string | null;
  /** ID de envío a AEAT */
  aeatSubmissionId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type InvoiceType = 'STANDARD' | 'SIMPLIFIED' | 'RECTIFYING';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SUBMITTED' | 'PAID' | 'CANCELLED';

export interface InvoiceCustomerDto {
  name: string;
  taxId?: string | null;
  address?: string | null;
}

export interface InvoiceLineDto {
  id: string;
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatType: VatType;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface CreateInvoiceDto {
  clientId?: string;
  type?: InvoiceType;
  issueDate?: string;
  operationDate?: string;
  dueDate?: string;
  customerName?: string;
  customerTaxId?: string;
  customerAddress?: string;
  lines: CreateInvoiceLineDto[];
  notes?: string;
}

export interface CreateInvoiceLineDto {
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  vatType?: VatType;
}

// =============================================================================
// Pagination & Common DTOs
// =============================================================================

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;
}

export interface PaginationMetaDto {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationQueryDto {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiErrorDto {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

export interface ApiSuccessDto<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}
