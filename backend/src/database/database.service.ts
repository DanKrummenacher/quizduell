import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { resolve } from 'node:path';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import * as schema from './schema.js';

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Both `src/database` and `dist/database` sit two levels below the backend root. */
const MIGRATIONS_FOLDER = resolve(import.meta.dirname, '../../drizzle');

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private database: Database | null = null;
  private close: (() => Promise<void>) | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  get db(): Database {
    if (!this.database) {
      throw new Error('Database is not connected');
    }
    return this.database;
  }

  async connect(): Promise<void> {
    if (this.config.databaseUrl) {
      await this.connectPostgres(this.config.databaseUrl);
    } else {
      await this.connectInMemory();
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close?.();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.db.execute('select 1');
      return true;
    } catch {
      return false;
    }
  }

  private async connectPostgres(url: string): Promise<void> {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');

    const pool = new Pool({
      connectionString: url,
      max: 10,
      ssl: requiresSsl(url) ? { rejectUnauthorized: false } : undefined,
    });
    pool.on('error', (error) =>
      this.logger.error(`Postgres pool error: ${error.message}`),
    );

    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    this.database = db;
    this.close = () => pool.end();
    this.logger.log('Connected to Postgres, migrations applied');
  }

  private async connectInMemory(): Promise<void> {
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');

    const client = new PGlite();
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    this.database = db;
    this.close = () => client.close();
    this.logger.warn('No DATABASE_URL set, using a temporary in-memory database');
  }
}

/** Managed Postgres providers (e.g. Render external URLs) require TLS. */
function requiresSsl(url: string): boolean {
  const host = new URL(url).hostname;
  return (
    !['localhost', '127.0.0.1', '::1', 'postgres'].includes(host) &&
    host.includes('.')
  );
}
