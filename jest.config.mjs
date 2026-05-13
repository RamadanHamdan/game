/**
 * Jest Configuration for EduQuiz Game Project
 * Supports Next.js + React 19 + ESM modules
 */
export default {
  testEnvironment: 'jsdom',

  // Transform ESM + JSX via Babel
  transform: {
    '^.+\\.(js|jsx|mjs)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
  },

  // Handle module aliases (matching jsconfig.json's @/ alias)
  moduleNameMapper: {
    // CSS / style imports → identity proxy
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Image / asset imports
    '\\.(jpg|jpeg|png|gif|svg|webp|ico)$': '<rootDir>/__mocks__/fileMock.js',
    // Next.js @ alias
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Ignore these from transforms
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|@supabase|uuid|xlsx|framer-motion|lucide-react|@dnd-kit)/)',
  ],

  // Setup files before framework (mocks that don't need expect/jest globals)
  setupFiles: ['<rootDir>/jest.setup.js'],

  // Setup files after env (jest-dom matchers, storage mocks)
  setupFilesAfterEnv: ['<rootDir>/jest.setupAfterFramework.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx}',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'lib/**/*.{js,jsx}',
    'hooks/**/*.{js,jsx}',
    'components/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/.next/**',
  ],

  // Verbose output
  verbose: true,
};
