# LuciaERP - Backend API

API REST construida con **NestJS** para el sistema ERP multi-tenant.

## 📁 Estructura del Proyecto

```
apps/api/src/
├── main.ts                    # Entry point
├── app.module.ts              # Root module
├── config/
│   └── configuration.ts       # Variables de entorno y validación
├── common/
│   ├── decorators/            # Decoradores personalizados
│   │   ├── current-user.decorator.ts   # @CurrentUser() - Usuario autenticado
│   │   ├── tenant.decorator.ts         # @TenantId() - ID del tenant actual
│   │   ├── permissions.decorator.ts    # @RequirePermissions() - Autorización
│   │   └── public.decorator.ts         # @Public() - Rutas sin auth
│   └── middleware/
│       ├── tenant.middleware.ts        # Extrae tenant del header/subdomain
│       └── logger.middleware.ts        # Logging de requests
└── modules/
    ├── database/              # Prisma client
    ├── auth/                  # Autenticación JWT + MFA
    ├── health/                # Health check endpoints
    ├── tenants/               # Gestión de tenants (Super Admin)
    ├── users/                 # Gestión de usuarios
    ├── clients/               # Clientes/Pacientes
    ├── services/              # Servicios ofrecidos
    ├── appointments/          # Citas/Reservas
    └── invoices/              # Facturación
```

## 🔐 Módulo Auth (`/auth`)

Autenticación y autorización con JWT y MFA opcional.

### Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Login con email/password | ❌ |
| `POST` | `/auth/register` | Registro de usuario | ❌ |
| `POST` | `/auth/refresh` | Renovar access token | ❌ |
| `POST` | `/auth/logout` | Cerrar sesión (revoca tokens) | ✅ |
| `GET` | `/auth/me` | Perfil del usuario actual | ✅ |
| `POST` | `/auth/mfa/setup` | Configurar MFA (TOTP) | ✅ |
| `POST` | `/auth/mfa/enable` | Activar MFA | ✅ |
| `POST` | `/auth/mfa/disable` | Desactivar MFA | ✅ |

### Flujo de Login

```
1. POST /auth/login { email, password, tenantSlug? }
2. Si MFA habilitado → { requiresMfa: true }
3. POST /auth/login { email, password, mfaCode }
4. Retorna { accessToken, refreshToken, user }
```

### Tokens

- **Access Token**: 15 minutos, contiene `{ sub, email, tenantId, role, permissions }`
- **Refresh Token**: 7 días, almacenado en DB, rotación automática

### Seguridad

- Bloqueo de cuenta después de 5 intentos fallidos (30 min)
- Hash de contraseñas con bcrypt (12 rounds)
- MFA con TOTP (compatible con Google Authenticator)

---

## 🏢 Módulo Tenants (`/tenants`)

Gestión de organizaciones/empresas clientes.

### Endpoints

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/tenants` | Listar todos los tenants | `tenant:read` |
| `GET` | `/tenants/:id` | Obtener tenant por ID | `tenant:read` |
| `GET` | `/tenants/slug/:slug` | Obtener tenant por slug | `tenant:read` |
| `POST` | `/tenants` | Crear tenant | `tenant:create` |
| `PATCH` | `/tenants/:id` | Actualizar tenant | `tenant:update` |
| `DELETE` | `/tenants/:id` | Eliminar tenant | `tenant:delete` |

### Modelo de datos

```typescript
interface Tenant {
  id: string;
  name: string;              // "Clínica Dental Madrid"
  slug: string;              // "clinica-dental-madrid"
  plan: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
  
  // Feature flags
  moduleStock: boolean;      // Inventario
  moduleMarketing: boolean;  // Campañas
  moduleHealthcare: boolean; // Historias clínicas
  moduleCommissions: boolean; // Comisiones
  
  // Compliance
  complianceEnhanced: boolean; // MFA obligatorio
  dataRetentionMonths: number; // 36 por defecto
  
  // Veri*Factu
  taxId: string;             // NIF/CIF
  taxAddress: string;
  verifactuEnabled: boolean;
}
```

---

## 👥 Módulo Users (`/users`)

Gestión de usuarios dentro de un tenant.

### Endpoints

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/users` | Listar usuarios del tenant | `user:read` |
| `GET` | `/users/:id` | Obtener usuario por ID | `user:read` |
| `POST` | `/users` | Crear usuario | `user:create` |
| `PATCH` | `/users/:id` | Actualizar usuario | `user:update` |
| `DELETE` | `/users/:id` | Eliminar usuario | `user:delete` |

### Roles

| Rol | Descripción |
|-----|-------------|
| `SUPER_ADMIN` | Administrador global (multi-tenant) |
| `OWNER` | Dueño del negocio |
| `MANAGER` | Gerente/Encargado |
| `USER` | Usuario básico |
| `HEALTHCARE_PROFESSIONAL` | Profesional sanitario (acceso a historias) |

---

## 👤 Módulo Clients (`/clients`)

Gestión de clientes/pacientes del negocio.

### Endpoints

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/clients` | Listar clientes | `client:read` |
| `GET` | `/clients/:id` | Obtener cliente por ID | `client:read` |
| `GET` | `/clients/search` | Buscar clientes (autocompletado) | `client:read` |
| `GET` | `/clients/stats` | Estadísticas de clientes | `client:read` |
| `POST` | `/clients` | Crear cliente | `client:create` |
| `PATCH` | `/clients/:id` | Actualizar cliente | `client:update` |
| `DELETE` | `/clients/:id` | Eliminar cliente | `client:delete` |

### Modelo de datos

```typescript
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  
  // Dirección
  address?: string;
  city?: string;
  postalCode?: string;
  country: string; // default: 'ES'
  
  // Documentación
  documentType?: 'DNI' | 'NIE' | 'PASSPORT' | 'OTHER';
  documentNumber?: string;
  
  // RGPD
  marketingConsent: boolean;
  marketingConsentDate?: Date;
  healthDataConsent: boolean;
  healthDataConsentDate?: Date;
  
  isActive: boolean;
}
```

---

## 🛠️ Módulo Services (`/services`)

Gestión de servicios ofrecidos por el negocio.

### Endpoints

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/services` | Listar servicios | `service:read` |
| `GET` | `/services/:id` | Obtener servicio por ID | `service:read` |
| `GET` | `/services/stats` | Estadísticas de servicios | `service:read` |
| `POST` | `/services` | Crear servicio | `service:create` |
| `PATCH` | `/services/:id` | Actualizar servicio | `service:update` |
| `DELETE` | `/services/:id` | Eliminar servicio | `service:delete` |

### Modelo de datos

```typescript
interface Service {
  id: string;
  name: string;              // "Corte de pelo"
  description?: string;
  durationMinutes: number;   // 30
  priceNet: number;          // 25.00 (sin IVA)
  vatType: 'STANDARD' | 'REDUCED' | 'SUPER_REDUCED' | 'EXEMPT';
  category?: string;         // "Peluquería"
  color?: string;            // "#3B82F6" (para calendario)
  requiresHealthcareProfessional: boolean;
  isActive: boolean;
}
```

### Tipos de IVA (España 2025)

| Tipo | Porcentaje | Uso |
|------|------------|-----|
| `STANDARD` | 21% | General |
| `REDUCED` | 10% | Servicios sanitarios |
| `SUPER_REDUCED` | 4% | Productos básicos |
| `EXEMPT` | 0% | Exenciones |

---

## 📅 Módulo Appointments (`/appointments`)

Gestión de citas y calendario.

### Endpoints

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/appointments` | Listar citas | `appointment:read` |
| `GET` | `/appointments/calendar` | Vista calendario | `appointment:read` |
| `GET` | `/appointments/availability` | Comprobar disponibilidad | `appointment:read` |
| `GET` | `/appointments/:id` | Obtener cita por ID | `appointment:read` |
| `GET` | `/appointments/stats` | Estadísticas | `appointment:read` |
| `POST` | `/appointments` | Crear cita | `appointment:create` |
| `PATCH` | `/appointments/:id` | Actualizar cita | `appointment:update` |
| `PATCH` | `/appointments/:id/status` | Cambiar estado | `appointment:update` |
| `DELETE` | `/appointments/:id` | Cancelar cita | `appointment:cancel` |

### Estados de cita

| Estado | Descripción |
|--------|-------------|
| `SCHEDULED` | Programada |
| `CONFIRMED` | Confirmada por el cliente |
| `IN_PROGRESS` | En curso |
| `COMPLETED` | Completada |
| `CANCELLED` | Cancelada |
| `NO_SHOW` | Cliente no asistió |

### Validaciones

- **Conflictos**: No permite solapamiento de citas para el mismo profesional
- **Horario**: Validación de horario laboral (configurable)
- **Disponibilidad**: Endpoint para comprobar slots libres

---

## 🧾 Módulo Invoices (`/invoices`)

Facturación preparada para Veri*Factu.

### Endpoints

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/invoices` | Listar facturas | `invoice:read` |
| `GET` | `/invoices/:id` | Obtener factura por ID | `invoice:read` |
| `GET` | `/invoices/stats` | Estadísticas | `invoice:read` |
| `POST` | `/invoices` | Crear factura (borrador) | `invoice:create` |
| `PATCH` | `/invoices/:id` | Actualizar borrador | `invoice:update` |
| `POST` | `/invoices/:id/issue` | Emitir factura (inmutable) | `invoice:issue` |
| `POST` | `/invoices/:id/paid` | Marcar como pagada | `invoice:update` |
| `DELETE` | `/invoices/:id` | Cancelar/eliminar | `invoice:delete` |

### Estados de factura

| Estado | Descripción |
|--------|-------------|
| `DRAFT` | Borrador (editable) |
| `ISSUED` | Emitida (inmutable) |
| `SUBMITTED` | Enviada a AEAT (Veri*Factu) |
| `PAID` | Pagada |
| `CANCELLED` | Anulada (con rectificativa) |

### Tipos de factura

| Tipo | Descripción |
|------|-------------|
| `STANDARD` | Factura completa (requiere NIF cliente) |
| `SIMPLIFIED` | Factura simplificada (< 400€) |
| `RECTIFYING` | Factura rectificativa |

### Veri*Factu (Pendiente)

- [ ] Hash SHA-256 encadenado
- [ ] Envío a AEAT
- [ ] Generación de QR
- [ ] Código CSV

---

## 🔧 Configuración

### Variables de entorno (.env)

```bash
# Base de datos
DATABASE_URL="postgresql://lucia:lucia_dev_password@localhost:5432/lucia_dev"

# JWT
JWT_SECRET="tu-secreto-super-seguro"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# API
PORT=3001
NODE_ENV="development"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"
```

### Ejecución

```bash
# Desarrollo
pnpm --filter @lucia/api dev

# Producción
pnpm --filter @lucia/api build
pnpm --filter @lucia/api start:prod

# Tests
pnpm --filter @lucia/api test
```

---

## 🛡️ Seguridad

### Multi-tenancy

- **Row Level Security (RLS)**: Aplicado en PostgreSQL
- **TenantMiddleware**: Extrae tenantId de header `X-Tenant-ID` o subdomain
- **Aislamiento**: Cada query filtra por tenantId automáticamente

### Rate Limiting

```typescript
{
  short: { ttl: 1000, limit: 10 },   // 10 req/seg
  medium: { ttl: 60000, limit: 100 }, // 100 req/min
  long: { ttl: 3600000, limit: 1000 } // 1000 req/hora
}
```

### Auditoría

Todas las acciones críticas se registran en `AuditLog`:

```typescript
interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;      // 'LOGIN', 'CREATE_CLIENT', etc.
  entityType?: string; // 'Client', 'Invoice'
  entityId?: string;
  metadata?: object;   // Datos adicionales
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

---

## 📚 Swagger / OpenAPI

Documentación interactiva disponible en:

```
http://localhost:3001/api
```

Generada automáticamente con `@nestjs/swagger`.
