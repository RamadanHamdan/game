/**
 * TDD Test Suite: lib/licenseServer.js
 * Tests for: generateLicenseKey, signLicenseToken, verifyLicenseToken
 * 
 * jose is mocked because it requires WebCrypto (Uint8Array keys) which
 * jsdom doesn't fully support. We test our wrapper logic, not jose internals.
 */

// Polyfill structuredClone
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock jose to avoid WebCrypto dependency
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation((payload) => {
    const instance = {
      _payload: payload,
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockImplementation(async () => {
        // Produce a fake but structurally valid JWT (3 parts)
        const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
        const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
        const sig = Buffer.from('mock-signature').toString('base64url');
        return `${header}.${body}.${sig}`;
      }),
    };
    return instance;
  }),
  jwtVerify: jest.fn().mockImplementation(async (token, secret) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      // Simulate signature check — our mock tokens have 'mock-signature'
      const sig = Buffer.from(parts[2], 'base64url').toString();
      if (sig !== 'mock-signature') throw new Error('signature verification failed');
      return { payload };
    } catch (e) {
      throw new Error(e.message || 'verification failed');
    }
  }),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid-1234') }));

// Set env vars
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.LICENSE_JWT_SECRET = 'test-jwt-secret-32chars-minimum!!';

describe('licenseServer', () => {
  let generateLicenseKey, signLicenseToken, verifyLicenseToken;

  beforeAll(async () => {
    const mod = await import('../../lib/licenseServer.js');
    generateLicenseKey = mod.generateLicenseKey;
    signLicenseToken = mod.signLicenseToken;
    verifyLicenseToken = mod.verifyLicenseToken;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // generateLicenseKey
  // ══════════════════════════════════════════════════════════════════════════
  describe('generateLicenseKey', () => {
    test('should return string in XXXX-XXXX-XXXX-XXXX format', () => {
      const key = generateLicenseKey();
      expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    test('should not contain ambiguous chars (0, O, 1, I)', () => {
      for (let i = 0; i < 50; i++) {
        const key = generateLicenseKey();
        expect(key).not.toMatch(/[01OI]/);
      }
    });

    test('should generate unique keys', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) keys.add(generateLicenseKey());
      expect(keys.size).toBeGreaterThan(90);
    });

    test('should have exactly 19 characters (16 alphanumeric + 3 dashes)', () => {
      expect(generateLicenseKey().length).toBe(19);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // signLicenseToken
  // ══════════════════════════════════════════════════════════════════════════
  describe('signLicenseToken', () => {
    test('should return a JWT string with 3 dot-separated parts', async () => {
      const token = await signLicenseToken({ licenseId: '123', schoolName: 'Test' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should call SignJWT with the provided payload', async () => {
      const { SignJWT } = require('jose');
      await signLicenseToken({ licenseId: 'abc' });
      expect(SignJWT).toHaveBeenCalledWith({ licenseId: 'abc' });
    });

    test('should set HS256 algorithm', async () => {
      const { SignJWT } = require('jose');
      await signLicenseToken({ test: true });
      const instance = SignJWT.mock.results[SignJWT.mock.results.length - 1].value;
      expect(instance.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
    });

    test('should set expiration time', async () => {
      const { SignJWT } = require('jose');
      await signLicenseToken({ test: true });
      const instance = SignJWT.mock.results[SignJWT.mock.results.length - 1].value;
      expect(instance.setExpirationTime).toHaveBeenCalledWith('12h');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // verifyLicenseToken
  // ══════════════════════════════════════════════════════════════════════════
  describe('verifyLicenseToken', () => {
    test('should verify a valid token and return payload', async () => {
      const token = await signLicenseToken({ licenseId: '123' });
      const result = await verifyLicenseToken(token);
      expect(result.valid).toBe(true);
      expect(result.payload.licenseId).toBe('123');
    });

    test('should reject an invalid token', async () => {
      const result = await verifyLicenseToken('not.a.valid-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject a tampered token (bad signature)', async () => {
      const token = await signLicenseToken({ licenseId: '123' });
      // Replace the signature part with garbage
      const parts = token.split('.');
      parts[2] = Buffer.from('tampered-sig').toString('base64url');
      const tampered = parts.join('.');
      const result = await verifyLicenseToken(tampered);
      expect(result.valid).toBe(false);
    });
  });
});
