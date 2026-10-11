/**
 * Only pure modules are unit-tested here: templates, data mutations and
 * scoring. Anything importing react-native needs the RN preset and a native
 * mock stack, which buys little for logic that is already thin.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/templates/**/*.ts',
    'src/data/**/*.ts',
    'src/services/completeness.ts',
  ],
};
