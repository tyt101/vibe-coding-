/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    '!app/api/**/__tests__/**',
    '!**/*.d.ts',
  ],
  coverageReporters: ['text', 'text-summary', 'html'],
};
