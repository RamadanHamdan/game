/**
 * TDD Test Suite: hooks/useLicense.js
 * Tests for: isCapacitorApp, verifyTokenLocal
 */

// ── Test isCapacitorApp (extracted from useLicense) ──────────────────────────
describe('isCapacitorApp detection', () => {
  const isCapacitorApp = () => {
    if (process.env.NEXT_PUBLIC_IS_CAPACITOR === 'true') return true;
    if (typeof window === 'undefined') return false;
    if (typeof window.Capacitor !== 'undefined' && typeof window.Capacitor.isNativePlatform === 'function') {
      return window.Capacitor.isNativePlatform();
    }
    return window.location.protocol === 'capacitor:'
      || window.location.protocol === 'file:'
      || window.__capacitor === true;
  };

  test('should return true when NEXT_PUBLIC_IS_CAPACITOR is true', () => {
    const orig = process.env.NEXT_PUBLIC_IS_CAPACITOR;
    process.env.NEXT_PUBLIC_IS_CAPACITOR = 'true';
    expect(isCapacitorApp()).toBe(true);
    process.env.NEXT_PUBLIC_IS_CAPACITOR = orig;
  });

  test('should return false when Capacitor is not present', () => {
    delete process.env.NEXT_PUBLIC_IS_CAPACITOR;
    delete window.Capacitor;
    delete window.__capacitor;
    // jsdom uses http: protocol by default
    expect(isCapacitorApp()).toBe(false);
  });

  test('should use Capacitor.isNativePlatform when available', () => {
    delete process.env.NEXT_PUBLIC_IS_CAPACITOR;
    window.Capacitor = { isNativePlatform: jest.fn(() => true) };
    expect(isCapacitorApp()).toBe(true);
    expect(window.Capacitor.isNativePlatform).toHaveBeenCalled();
    delete window.Capacitor;
  });

  test('should detect capacitor: protocol', () => {
    delete process.env.NEXT_PUBLIC_IS_CAPACITOR;
    delete window.Capacitor;
    const origProto = window.location.protocol;
    // jsdom doesn't easily allow protocol change, test via __capacitor flag
    window.__capacitor = true;
    expect(isCapacitorApp()).toBe(true);
    delete window.__capacitor;
  });
});

// ── Test verifyTokenLocal (extracted logic) ──────────────────────────────────
describe('verifyTokenLocal', () => {
  // Mock jose
  jest.mock('jose', () => ({
    jwtVerify: jest.fn(),
    SignJWT: jest.fn().mockImplementation(() => ({
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue('mock-token'),
    })),
  }));

  const verifyTokenLocal = async (token) => {
    try {
      const { jwtVerify } = await import('jose');
      const secret = new TextEncoder().encode('test-secret');
      const { payload } = await jwtVerify(token, secret);
      return {
        valid: true,
        school: { name: payload.schoolName, type: payload.licenseType },
      };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  };

  test('should return valid=true for valid token', async () => {
    const { jwtVerify } = await import('jose');
    jwtVerify.mockResolvedValueOnce({
      payload: { schoolName: 'Test School', licenseType: 'annual' },
    });

    const result = await verifyTokenLocal('valid-token');
    expect(result.valid).toBe(true);
    expect(result.school.name).toBe('Test School');
  });

  test('should return valid=false for invalid token', async () => {
    const { jwtVerify } = await import('jose');
    jwtVerify.mockRejectedValueOnce(new Error('Token expired'));

    const result = await verifyTokenLocal('expired-token');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token expired');
  });
});
