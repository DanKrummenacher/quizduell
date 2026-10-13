export const APP_CONFIG = Symbol('APP_CONFIG');

export interface AppConfig {
  port: number;
  production: boolean;
  /** Postgres connection string. Empty means: use an in-memory database. */
  databaseUrl: string;
  /** Origins allowed to call the API and open sockets. */
  corsOrigins: string[];
  /** Password for the admin area. Empty disables the admin login. */
  adminPassword: string;
  jwtSecret: string;
}

const DEV_JWT_SECRET = 'playduelio-dev-secret-change-me';
const DEV_ORIGINS = ['http://localhost:4200', 'http://127.0.0.1:4200'];

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const production = env['NODE_ENV'] === 'production';
  const errors: string[] = [];

  const port = Number(env['PORT'] ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    errors.push('PORT must be a positive integer');
  }

  const databaseUrl = env['DATABASE_URL']?.trim() ?? '';
  if (production && !databaseUrl) {
    errors.push('DATABASE_URL is required in production');
  }

  const corsOrigins = (env['CORS_ORIGINS'] ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (production && corsOrigins.length === 0) {
    errors.push('CORS_ORIGINS is required in production');
  }

  const adminPassword = env['ADMIN_PASSWORD'] ?? '';
  if (production && adminPassword.length < 12) {
    errors.push('ADMIN_PASSWORD must be at least 12 characters in production');
  }

  const jwtSecret = env['JWT_SECRET'] ?? (production ? '' : DEV_JWT_SECRET);
  if (production && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    port,
    production,
    databaseUrl,
    corsOrigins: corsOrigins.length > 0 ? corsOrigins : DEV_ORIGINS,
    adminPassword,
    jwtSecret,
  };
}
