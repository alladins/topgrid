import { defineConfig, devices } from '@playwright/test';

// Real-browser e2e for the Vue chart. Port 9011 is outside the Windows Hyper-V excluded range
// (5975-6074). Playwright builds nothing — run `pnpm build:e2e` first to produce e2e/app.js.
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: false,
  retries: 1,
  reporter: [['line']],
  use: { baseURL: 'http://127.0.0.1:9011', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npx http-server . -p 9011 -a 127.0.0.1 -s',
    url: 'http://127.0.0.1:9011/index.html',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
