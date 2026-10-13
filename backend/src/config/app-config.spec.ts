import { loadAppConfig } from './app-config.js';

describe('loadAppConfig', () => {
  it('uses development defaults', () => {
    const config = loadAppConfig({});
    expect(config.production).toBe(false);
    expect(config.port).toBe(3000);
    expect(config.databaseUrl).toBe('');
    expect(config.corsOrigins).toContain('http://localhost:4200');
    expect(config.jwtSecret.length).toBeGreaterThan(0);
  });

  it('parses production settings', () => {
    const config = loadAppConfig({
      NODE_ENV: 'production',
      PORT: '10000',
      DATABASE_URL: 'postgres://u:p@db.example.com/x',
      CORS_ORIGINS: 'https://playduelio.onrender.com/, https://example.ch',
      ADMIN_PASSWORD: 'a-very-long-password',
      JWT_SECRET: 'x'.repeat(40),
    });
    expect(config.port).toBe(10000);
    expect(config.corsOrigins).toEqual([
      'https://playduelio.onrender.com',
      'https://example.ch',
    ]);
  });

  it('refuses incomplete production settings', () => {
    expect(() =>
      loadAppConfig({ NODE_ENV: 'production', ADMIN_PASSWORD: 'short' }),
    ).toThrow(
      /DATABASE_URL[\s\S]*CORS_ORIGINS[\s\S]*ADMIN_PASSWORD[\s\S]*JWT_SECRET/,
    );
  });
});
