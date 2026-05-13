/**
 * Jest Setup — global mocks & environment configuration
 * NOTE: @testing-library/jest-dom is loaded via setupFilesAfterEnv
 */

// ── Polyfill TextEncoder/TextDecoder for jose library ───────────────────────
const { TextEncoder: TE, TextDecoder: TD } = require('util');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TE;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TD;

// ── Polyfill structuredClone for jose library ───────────────────────────────
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    if (obj === undefined) return undefined;
    return JSON.parse(JSON.stringify(obj));
  };
}

// ── Mock window.AudioContext for SoundManager tests ─────────────────────────
const mockOscillator = {
  type: '',
  frequency: { value: 0, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
  detune: { value: 0 },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

const mockGainNode = {
  gain: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
  connect: jest.fn(),
};

const mockFilterNode = {
  type: '',
  frequency: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
  Q: { value: 0 },
  connect: jest.fn(),
};

const mockBufferSource = {
  buffer: null,
  connect: jest.fn(),
  start: jest.fn(),
};

const mockAudioContext = {
  currentTime: 0,
  sampleRate: 44100,
  state: 'running',
  destination: {},
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({ ...mockGainNode })),
  createBiquadFilter: jest.fn(() => ({ ...mockFilterNode })),
  createBufferSource: jest.fn(() => ({ ...mockBufferSource })),
  createBuffer: jest.fn((channels, length, sampleRate) => ({
    getChannelData: jest.fn(() => new Float32Array(length)),
  })),
  resume: jest.fn(() => Promise.resolve()),
  suspend: jest.fn(() => Promise.resolve()),
};

if (typeof window !== 'undefined') {
  window.AudioContext = jest.fn(() => mockAudioContext);
  window.webkitAudioContext = jest.fn(() => mockAudioContext);
}

// ── Mock next/navigation ────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ── Mock framer-motion (simplify for testing) ───────────────────────────────
jest.mock('framer-motion', () => {
  const React = require('react');
  const actual = {
    motion: new Proxy({}, {
      get: (_, tag) => React.forwardRef((props, ref) => {
        const { initial, animate, exit, whileHover, whileTap, layout, transition, variants, ...rest } = props;
        return React.createElement(tag, { ...rest, ref });
      }),
    }),
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
    useMotionValue: (val) => ({ get: () => val, set: jest.fn() }),
  };
  return actual;
});

// ── Mock @capacitor modules ─────────────────────────────────────────────────
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
    getPlatform: jest.fn(() => 'web'),
  },
}));

jest.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: jest.fn() },
  Directory: { Documents: 'DOCUMENTS' },
}));

jest.mock('@capacitor/share', () => ({
  Share: { share: jest.fn() },
}));

// ── Global fetch mock ───────────────────────────────────────────────────────
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve('[]'),
  })
);
