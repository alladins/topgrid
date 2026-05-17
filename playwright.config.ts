import { defineConfig, devices } from '@playwright/test';

// G-003 spec Section 2-1: Playwright 설정 (visual regression)
// D5 결정: Playwright OSS Apache-2.0 채택 (Chromatic 미채택)
// D6 결정: Storybook static 빌드 (storybook-static/) iframe URL 순회
const config = defineConfig({
  testDir: './tests/visual',
  fullyParallel: false, // screenshot 재현성 위해 sequential
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:6006', // Storybook static 서버 URL
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Storybook static 서버 — CI에서는 외부 기동 (workflow에서 npx http-server 선행)
  // 로컬: pnpm -F docs storybook → localhost:6006 대기 후 실행
});

export default config;
