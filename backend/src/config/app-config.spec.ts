import { loadAppConfig } from './app-config.js';

describe('loadAppConfig', () => {
  it('uses development defaults', () => {
    const config = loadAppConfig({});
    expect(config.production).toBe(false);
    expect(config.port).toBe(3000);
    expect(config.databaseUrl).toBe('');
    expect(config.corsOrigins).toContain('http://localhost:4200');
    expect(config.seedSampleQuestions).toBe(true);
    expect(config.testControl).toBe(false);
    expect(config.adminPassword).toBe('admin');
  });

  it('parses production settings', () => {
    const config = loadAppConfig({
      NODE_ENV: 'production',
      PORT: '10000',
      DATABASE_URL: 'postgres://u:p@db.example.com/x',
      CORS_ORIGINS: 'https://playduelio.onrender.com/, https://example.ch',
      ADMIN_PASSWORD: 'a-long-admin-secret',
    });
    expect(config.adminPassword).toBe('a-long-admin-secret');
    expect(config.port).toBe(10000);
    expect(config.seedSampleQuestions).toBe(false);
    expect(config.corsOrigins).toEqual([
      'https://playduelio.onrender.com',
      'https://example.ch',
    ]);
  });

  it('refuses incomplete production settings', () => {
    expect(() =>
      loadAppConfig({ NODE_ENV: 'production', TEST_CONTROL: 'true' }),
    ).toThrow(
      /DATABASE_URL[\s\S]*CORS_ORIGINS[\s\S]*TEST_CONTROL[\s\S]*ADMIN_PASSWORD/,
    );
  });
});
