// NestJS 12 is ESM-only, so Jest runs in native ESM mode (`node --experimental-vm-modules`).

/** @type {import('ts-jest').TsJestTransformerOptions} */
const tsJest = { tsconfig: 'tsconfig.json', useESM: true };

/** @type {import('jest').Config['projects'][number]} */
const base = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', tsJest] },
  // Source files import each other with `.js` extensions (Node ESM rules).
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};

/** @type {import('jest').Config} */
export default {
  projects: [
    {
      ...base,
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
    },
    {
      ...base,
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      globalSetup: '<rootDir>/test/global-setup.ts',
      setupFiles: ['<rootDir>/test/integration/setup-env.ts'],
      testTimeout: 30000,
    },
  ],
};
