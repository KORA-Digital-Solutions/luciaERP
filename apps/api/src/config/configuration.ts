import * as Joi from 'joi';

export const configuration = () => ({
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Redis (for sessions/cache)
  redis: {
    url: process.env.REDIS_URL,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },

  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // MFA
  mfa: {
    issuer: process.env.MFA_ISSUER || 'LuciaERP',
  },

  // Email (placeholder for future)
  email: {
    from: process.env.EMAIL_FROM || 'noreply@luciaerp.com',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
  },

  // Veri*Factu (placeholder for future)
  verifactu: {
    enabled: process.env.VERIFACTU_ENABLED === 'true',
    aeatEndpoint: process.env.AEAT_ENDPOINT,
    certificatePath: process.env.AEAT_CERTIFICATE_PATH,
  },
});

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required().min(32),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  REDIS_URL: Joi.string().optional(),
  CORS_ORIGIN: Joi.string().optional(),
  MFA_ISSUER: Joi.string().default('LuciaERP'),
});

export type Configuration = ReturnType<typeof configuration>;
