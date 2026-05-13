/**
 * TDD Test Suite: lib/licenseClientDirect.js
 * Tests for: normalizeKey, supabaseHeaders, activateLicenseDirect
 */

// Mock jose
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation((payload) => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
}));

// Set env vars before import
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_LICENSE_JWT_SECRET = 'test-secret';

describe('licenseClientDirect', () => {
  let activateLicenseDirect;

  beforeEach(async () => {
    jest.resetModules();
    global.fetch = jest.fn();
    const mod = await import('../../lib/licenseClientDirect.js');
    activateLicenseDirect = mod.activateLicenseDirect;
  });

  test('should return error when license not found', async () => {
    // supabaseSelect returns empty array → null
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('[]'),
    });

    const result = await activateLicenseDirect('ABCD-1234-EFGH-5678', 'fp123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('tidak ditemukan');
  });

  test('should return error when license is inactive', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([{
        id: '1', key: 'ABCD-1234-EFGH-5678', is_active: false,
        school_name: 'Test', license_type: 'annual', max_devices: 5,
      }])),
    });

    const result = await activateLicenseDirect('ABCD-1234-EFGH-5678', 'fp123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('dinonaktifkan');
  });

  test('should return error when license is expired', async () => {
    const pastDate = new Date('2020-01-01').toISOString();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([{
        id: '1', key: 'ABCD-1234-EFGH-5678', is_active: true,
        expires_at: pastDate, school_name: 'Test', license_type: 'annual',
      }])),
    });

    const result = await activateLicenseDirect('ABCD-1234-EFGH-5678', 'fp123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('kadaluarsa');
  });

  test('should return error when device is blocked', async () => {
    // License found
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([{
        id: '1', key: 'ABCD-1234-EFGH-5678', is_active: true,
        expires_at: null, school_name: 'Test', license_type: 'annual', max_devices: 5,
      }])),
    });
    // Existing activation (blocked)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([{
        id: 'act1', license_id: '1', device_fingerprint: 'fp123', is_blocked: true,
      }])),
    });

    const result = await activateLicenseDirect('ABCD-1234-EFGH-5678', 'fp123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('diblokir');
  });

  test('should succeed for existing non-blocked activation', async () => {
    // License found
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([{
        id: '1', key: 'ABCD-1234-EFGH-5678', is_active: true,
        expires_at: null, school_name: 'Test School', license_type: 'annual', max_devices: 5,
      }])),
    });
    // Existing activation (not blocked)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([{
        id: 'act1', license_id: '1', device_fingerprint: 'fp123', is_blocked: false,
      }])),
    });
    // Update last_seen
    global.fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

    const result = await activateLicenseDirect('ABCD-1234-EFGH-5678', 'fp123');
    expect(result.success).toBe(true);
    expect(result.token).toBe('mock-jwt-token');
    expect(result.school.name).toBe('Test School');
  });

  test('should reject when max devices reached', async () => {
    // License found
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([{
        id: '1', key: 'ABCD-1234-EFGH-5678', is_active: true,
        expires_at: null, school_name: 'Test', license_type: 'annual', max_devices: 1,
      }])),
    });
    // No existing activation
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('[]'),
    });
    // Count returns 1 (max reached)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('[]'),
      headers: { get: () => '0-0/1' },
    });

    const result = await activateLicenseDirect('ABCD-1234-EFGH-5678', 'fp123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('batas maksimum');
  });
});
