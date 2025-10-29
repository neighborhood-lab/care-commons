module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  moduleNameMapper: {
    '@care-commons/core': '<rootDir>/../../packages/core/src',
    '@care-commons/caregiver-staff': '<rootDir>/../caregiver-staff/src',
    '@care-commons/scheduling-visits': '<rootDir>/../scheduling-visits/src',
  },
  passWithNoTests: true,
};
