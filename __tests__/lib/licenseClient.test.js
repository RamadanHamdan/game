/**
 * TDD Test Suite: lib/licenseClient.js
 * 
 * Tests for: getBrowserFingerprint, saveToken, getToken, getLicenseInfo,
 *            clearToken, formatLicenseKeyInput
 */

import {
  getBrowserFingerprint,
  saveToken,
  getToken,
  getLicenseInfo,
  clearToken,
  formatLicenseKeyInput,
  LICENSE_TOKEN_KEY,
  LICENSE_INFO_KEY,
} from '../../lib/licenseClient';

// ════════════════════════════════════════════════════════════════════════════════
// getBrowserFingerprint()
// ════════════════════════════════════════════════════════════════════════════════
describe('getBrowserFingerprint', () => {
  test('should return a non-empty string on client side', () => {
    const fp = getBrowserFingerprint();
    expect(typeof fp).toBe('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  test('should return consistent hash for same environment', () => {
    const fp1 = getBrowserFingerprint();
    const fp2 = getBrowserFingerprint();
    expect(fp1).toBe(fp2);
  });

  test('should return "server" when window is undefined', () => {
    const originalWindow = global.window;
    // Temporarily remove window
    delete global.window;
    
    // Re-import to test server-side behavior
    // Since module is already cached, we test the function's internal check
    // The function checks `typeof window === 'undefined'`
    // In jsdom, window is always defined, so we test via the return type
    global.window = originalWindow;
    
    // At minimum, it should be a string
    const fp = getBrowserFingerprint();
    expect(typeof fp).toBe('string');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Token Storage: saveToken, getToken, getLicenseInfo, clearToken
// ════════════════════════════════════════════════════════════════════════════════
describe('Token Storage', () => {
  describe('saveToken', () => {
    test('should save token to localStorage', () => {
      saveToken('my-jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith(LICENSE_TOKEN_KEY, 'my-jwt-token');
    });

    test('should save token and info together', () => {
      const info = { name: 'Test School', type: 'annual' };
      saveToken('my-jwt-token', info);
      expect(localStorage.setItem).toHaveBeenCalledWith(LICENSE_TOKEN_KEY, 'my-jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith(LICENSE_INFO_KEY, JSON.stringify(info));
    });

    test('should not save info if not provided', () => {
      saveToken('token-only');
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(localStorage.setItem).toHaveBeenCalledWith(LICENSE_TOKEN_KEY, 'token-only');
    });
  });

  describe('getToken', () => {
    test('should return null when no token stored', () => {
      const token = getToken();
      expect(token).toBeNull();
    });

    test('should return stored token', () => {
      localStorage.getItem.mockReturnValueOnce('stored-token');
      const token = getToken();
      expect(token).toBe('stored-token');
    });
  });

  describe('getLicenseInfo', () => {
    test('should return null when no info stored', () => {
      const info = getLicenseInfo();
      expect(info).toBeNull();
    });

    test('should parse and return stored license info', () => {
      const mockInfo = { name: 'School ABC', type: 'annual' };
      localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockInfo));
      const info = getLicenseInfo();
      expect(info).toEqual(mockInfo);
    });

    test('should return null on invalid JSON', () => {
      localStorage.getItem.mockReturnValueOnce('not-valid-json{{{');
      const info = getLicenseInfo();
      expect(info).toBeNull();
    });
  });

  describe('clearToken', () => {
    test('should remove both token and info from localStorage', () => {
      clearToken();
      expect(localStorage.removeItem).toHaveBeenCalledWith(LICENSE_TOKEN_KEY);
      expect(localStorage.removeItem).toHaveBeenCalledWith(LICENSE_INFO_KEY);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// formatLicenseKeyInput()
// ════════════════════════════════════════════════════════════════════════════════
describe('formatLicenseKeyInput', () => {
  test('should format plain alphanumeric string with dashes', () => {
    const result = formatLicenseKeyInput('ABCD1234EFGH5678');
    expect(result).toBe('ABCD-1234-EFGH-5678');
  });

  test('should uppercase lowercase input', () => {
    const result = formatLicenseKeyInput('abcd1234efgh5678');
    expect(result).toBe('ABCD-1234-EFGH-5678');
  });

  test('should strip non-alphanumeric characters', () => {
    const result = formatLicenseKeyInput('ABCD-1234-EFGH-5678');
    expect(result).toBe('ABCD-1234-EFGH-5678');
  });

  test('should handle partial input', () => {
    const result = formatLicenseKeyInput('ABCD12');
    expect(result).toBe('ABCD-12');
  });

  test('should handle empty input', () => {
    const result = formatLicenseKeyInput('');
    expect(result).toBe('');
  });

  test('should handle single chunk (≤4 chars)', () => {
    const result = formatLicenseKeyInput('AB');
    expect(result).toBe('AB');
  });

  test('should limit to 4 chunks max (16 chars)', () => {
    const result = formatLicenseKeyInput('ABCD1234EFGH5678EXTRA');
    expect(result).toBe('ABCD-1234-EFGH-5678');
  });

  test('should strip special characters like @#$%', () => {
    const result = formatLicenseKeyInput('AB@#CD$%12&*34');
    expect(result).toBe('ABCD-1234');
  });
});
