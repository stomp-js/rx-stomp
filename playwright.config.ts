import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './spec',
  testMatch: '**/*.spec.ts',
  timeout: 30000,
  workers: 1,
  projects: [{ name: 'node' }],
  tsconfig: './tsconfig.spec.json',
});
