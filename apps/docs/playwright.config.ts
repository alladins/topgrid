import { defineConfig, devices } from '@playwright/test';

// visual regression config. ★apps/docs 에 두는 이유: @playwright/test 가 여기 node_modules 에 설치돼
// 있어 config 로딩이 해소된다(root 에 두면 root 에 @playwright/test 부재로 MODULE_NOT_FOUND). testDir 은
// repo-root 의 tests/visual 을 가리킨다. Storybook static(localhost:6006) 대상. 2026-06-06 인프라 시정.
export default defineConfig({
  testDir: '../../tests/visual',
  fullyParallel: false, // screenshot 재현성 (storybook.spec baseline 대비)
  // MOD-GRID-58: 스위트가 커지며(100+) scroll/click/animation 타이밍 민감 테스트가 머신 부하 시
  // 간헐 timeout → flake. 이들은 타겟 재실행 시 항상 green(코드 무관, 환경적). retries 로 흡수해
  // full-suite 게이트를 안정화한다(clean 테스트는 1회 통과; flake 만 재시도). CI/로컬 공통.
  retries: 2,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:6006',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
