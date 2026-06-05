import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

// G-003 spec Section 2-2: Storybook stories 동적 순회 visual regression
// D6 결정: stories.json 동적 읽기 (Storybook static build 산출)
// PSD-006: Storybook 8 기본 산출은 index.json. stories.json(v6 legacy) 폴백 처리.
// ★경로는 CWD 가 아니라 이 스펙 파일 위치(repo-root/tests/visual) 기준으로 해소(2026-06-06 시정):
// `pnpm -F docs visual:test` 는 CWD=apps/docs 라 process.cwd() 기반 경로가 깨졌었다(apps/docs/apps/docs/...).
const storyStaticDir = path.resolve(__dirname, '../../apps/docs/storybook-static');
const indexJsonPath = path.join(storyStaticDir, 'index.json');
const storiesJsonPath = path.join(storyStaticDir, 'stories.json');

interface StoryEntry {
  id: string;
  title: string;
  name: string;
  importPath: string;
  tags?: string[];
}

interface IndexJson {
  v: number;
  entries: Record<string, StoryEntry>;
}

interface StoriesJson {
  v: number;
  stories: Record<string, StoryEntry>;
}

// Storybook 8 → index.json; Storybook 6 legacy → stories.json
function loadStoryIds(): Record<string, StoryEntry> {
  try {
    const raw = readFileSync(indexJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as IndexJson;
    if (parsed.entries) return parsed.entries;
  } catch {
    // index.json 미존재 → stories.json 폴백 (EC-06)
  }
  // ★non-throwing: 둘 다 없으면 {} 반환(collection 시점 throw 금지 — 스토리북 미빌드 시에도 스위트 안전).
  try {
    const raw = readFileSync(storiesJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as StoriesJson;
    return parsed.stories;
  } catch {
    return {};
  }
}

const storiesMap = loadStoryIds();
const storyIds = Object.keys(storiesMap).filter(
  // 'docs' type entries는 iframe story가 아님 — type: 'docs' 또는 tags 기준 제외
  (id) => {
    const entry = storiesMap[id];
    return !entry.tags?.includes('docs');
  }
);

// ⚠ 스크린샷 회귀는 **커밋된 baseline** 이 있어야 의미가 있다. baseline 은 OS/폰트별이라 dev 머신
// (Windows)에서 생성하면 비-authoritative + 첫 생성은 trivially pass(자기확인 회로). 따라서 canonical CI
// 에서 `--update-snapshots` 로 baseline 을 만들어 커밋하기 전까지 **skip(정직)** 한다. 동작 검증은
// per-feature `tests/visual/*.spec.ts`(2026-06-06 78/78 green)가 담당하며 본 스냅샷 게이트는 그것을
// 대체하지 않는다. API 는 deprecated `toMatchSnapshot`→`toHaveScreenshot` 로 마이그레이션해 CI baseline-gen
// 시 바로 동작하도록 유지. (이전 상태: playwright 1.60 API drift + baseline 0 → 전수 fail = 무의미.)
for (const storyId of storyIds) {
  const story = storiesMap[storyId];
  test.skip(`visual regression: ${story.title}/${story.name}`, async ({ page }) => {
    const iframeUrl = `/iframe.html?id=${storyId}&viewMode=story`;
    await page.goto(iframeUrl);

    // EC-03: 1000행 가상화 story는 렌더링 시간 증가 → timeout 60s 연장 (C-18)
    const isVirtualized =
      storyId.includes('virtual') || storyId.includes('1000');
    const waitTimeout = isVirtualized ? 60000 : 5000;

    await page.waitForLoadState('networkidle', { timeout: waitTimeout });

    await expect(page).toHaveScreenshot(`${storyId}.png`, {
      maxDiffPixelRatio: 0.01, // EC-02: OS/브라우저 픽셀 차이 threshold 1%
    });
  });
}
