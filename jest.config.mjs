/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node', // Puppeteer needs Node environment
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Add any other Jest configurations needed for your project below
  // For example, module name mappings for aliases:
  // moduleNameMapper: {
  //   '^@/components/(.*)$': '<rootDir>/components/$1',
  //   '^@/lib/(.*)$': '<rootDir>/lib/$1',
  //   // ... other aliases
  // },
  // Setup files after env
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
