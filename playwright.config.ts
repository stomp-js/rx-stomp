import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './spec',
  testMatch: '**/*.spec.ts',
  timeout: 30000,
  projects: [
    { name: 'node' },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  tsconfig: './tsconfig.spec.json',
});
