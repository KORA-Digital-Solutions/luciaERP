import { PrismaClient, Plan, TenantStatus, UserRole, UserStatus, VatType } from './generated/prisma';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Seed de datos iniciales para desarrollo
 */
async function main() {
  console.log('Seeding database...');

  // Limpiar datos existentes (solo en desarrollo!)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.invoiceLine.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.client.deleteMany();
    await prisma.service.deleteMany();
    await prisma.location.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
  }

  // 1. Crear tenant de demostración
  console.log('Creating demo tenant...');
  const demoTenant = await prisma.tenant.create({
    data: {
      name: 'Salón Demo Beauty',
      slug: 'demo-beauty',
      plan: Plan.PROFESSIONAL,
      status: TenantStatus.ACTIVE,
      moduleStock: true,
      moduleMarketing: true,
      moduleHealthcare: false,
      moduleCommissions: true,
      taxId: 'B12345678',
      taxAddress: 'Calle Demo 123, 28001 Madrid',
      verifactuEnabled: false,
    },
  });

  // 2. Crear ubicación principal
  console.log('📍 Creating demo location...');
  const demoLocation = await prisma.location.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Sede Principal',
      address: 'Calle Demo 123',
      city: 'Madrid',
      postalCode: '28001',
      country: 'ES',
      phone: '+34 911 234 567',
      email: 'contacto@demo-beauty.com',
      isPrimary: true,
      isActive: true,
    },
  });

  // 3. Crear usuario admin del tenant
  console.log('Creating demo users...');
  // Hash simple para demo (en producción usar bcrypt)
  const demoPasswordHash = crypto
    .createHash('sha256')
    .update('demo123!')
    .digest('hex');

  const adminUser = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'admin@demo-beauty.com',
      passwordHash: demoPasswordHash,
      firstName: 'Admin',
      lastName: 'Demo',
      phone: '+34 600 123 456',
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      mfaEnabled: false,
    },
  });

  // Usuario empleado
  const employeeUser = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'empleado@demo-beauty.com',
      passwordHash: demoPasswordHash,
      firstName: 'María',
      lastName: 'García',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  // 4. Crear servicios
  console.log('Creating demo services...');
  const services = await prisma.service.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        name: 'Corte de pelo',
        description: 'Corte de pelo personalizado',
        durationMinutes: 30,
        priceNet: 25.0,
        vatType: VatType.STANDARD,
        category: 'Peluquería',
        color: '#FF6B6B',
        isActive: true,
      },
      {
        tenantId: demoTenant.id,
        name: 'Tinte',
        description: 'Aplicación de tinte profesional',
        durationMinutes: 90,
        priceNet: 45.0,
        vatType: VatType.STANDARD,
        category: 'Peluquería',
        color: '#4ECDC4',
        isActive: true,
      },
      {
        tenantId: demoTenant.id,
        name: 'Manicura',
        description: 'Manicura completa',
        durationMinutes: 45,
        priceNet: 20.0,
        vatType: VatType.STANDARD,
        category: 'Uñas',
        color: '#FFE66D',
        isActive: true,
      },
      {
        tenantId: demoTenant.id,
        name: 'Masaje relajante',
        description: 'Masaje corporal relajante de 60 minutos',
        durationMinutes: 60,
        priceNet: 50.0,
        vatType: VatType.REDUCED, // Servicios terapéuticos pueden tener IVA reducido
        category: 'Bienestar',
        color: '#95E1D3',
        isActive: true,
      },
    ],
  });

  // 5. Crear clientes de demostración
  console.log('👥 Creating demo clients...');
  const clients = await prisma.client.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        firstName: 'Laura',
        lastName: 'Martínez',
        email: 'laura.martinez@email.com',
        phone: '+34 612 345 678',
        birthDate: new Date('1990-05-15'),
        marketingConsent: true,
        marketingConsentDate: new Date(),
        isActive: true,
      },
      {
        tenantId: demoTenant.id,
        firstName: 'Carlos',
        lastName: 'López',
        email: 'carlos.lopez@email.com',
        phone: '+34 623 456 789',
        marketingConsent: false,
        isActive: true,
      },
      {
        tenantId: demoTenant.id,
        firstName: 'Ana',
        lastName: 'Rodríguez',
        email: 'ana.rodriguez@email.com',
        phone: '+34 634 567 890',
        birthDate: new Date('1985-11-22'),
        marketingConsent: true,
        marketingConsentDate: new Date(),
        isActive: true,
      },
    ],
  });

  // 6. Crear super admin (sin tenant)
  console.log('Creating super admin...');
  await prisma.user.create({
    data: {
      tenantId: null, // Sin tenant = super admin global
      email: 'superadmin@luciaerp.com',
      passwordHash: demoPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      mfaEnabled: true, // Super admin siempre con MFA
    },
  });

  // 7. Crear tenant de fisioterapia (para demostrar módulo sanitario)
  console.log('Creating healthcare tenant...');
  const healthcareTenant = await prisma.tenant.create({
    data: {
      name: 'Clínica Fisio Plus',
      slug: 'fisio-plus',
      plan: Plan.BUSINESS,
      status: TenantStatus.ACTIVE,
      moduleStock: false,
      moduleMarketing: true,
      moduleHealthcare: true, // Módulo sanitario activo
      moduleCommissions: true,
      complianceEnhanced: true, // Compliance reforzado
      dataRetentionMonths: 60, // 5 años mínimo para datos clínicos
      taxId: 'B87654321',
      taxAddress: 'Avenida Salud 45, 28020 Madrid',
      verifactuEnabled: true,
    },
  });

  await prisma.location.create({
    data: {
      tenantId: healthcareTenant.id,
      name: 'Clínica Principal',
      address: 'Avenida Salud 45',
      city: 'Madrid',
      postalCode: '28020',
      country: 'ES',
      phone: '+34 912 345 678',
      email: 'citas@fisio-plus.com',
      isPrimary: true,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: healthcareTenant.id,
      email: 'fisio@fisio-plus.com',
      passwordHash: demoPasswordHash,
      firstName: 'Dr. Pedro',
      lastName: 'Sánchez',
      role: UserRole.HEALTHCARE_PROFESSIONAL,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      mfaEnabled: true, // MFA obligatorio para profesionales sanitarios
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('   Beauty salon admin: admin@demo-beauty.com / demo123!');
  console.log('   Healthcare pro: fisio@fisio-plus.com / demo123!');
  console.log('   Super admin: superadmin@luciaerp.com / demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
