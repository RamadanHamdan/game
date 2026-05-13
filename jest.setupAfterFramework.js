/**
 * Jest Setup After Framework — runs after test framework (expect, jest, etc.) is available
 */
import '@testing-library/jest-dom';

// ── Mock sessionStorage ─────────────────────────────────────────────────────
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, writable: true });

// ── Mock localStorage ───────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// ── Reset mocks between tests ───────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorageMock.clear();
  localStorageMock.clear();
});
