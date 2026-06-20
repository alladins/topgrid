import { defineConfig, devices } from '@playwright/test';

// Real-browser smoke of the example app (= the published @topgrid/grid facade end-to-end).
// Port 9013 is outside the Windows Hyper-V excluded range (5975-6074). Run `pnpm build:example` first.
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: false,
  retries: 1,
  reporter: [['line']],
  use: { baseURL: 'http://127.0.0.1:9013', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npx http-server .. -p 9013 -a 127.0.0.1 -s',
    url: 'http://127.0.0.1:9013/index.html',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
