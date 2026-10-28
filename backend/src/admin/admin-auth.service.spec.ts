import { hashPassword, verifyPassword } from './admin-auth.service.js';

describe('admin password hashing', () => {
  it('verifies the password it hashed and nothing else', async () => {
    const stored = await hashPassword('correct horse battery');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
    expect(await verifyPassword('correct horse batter', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('salts every hash', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });

  it('refuses stored values it does not understand', async () => {
    expect(await verifyPassword('x', 'plain')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$$')).toBe(false);
  });
});
