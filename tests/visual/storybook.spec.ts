import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

// G-003 spec Section 2-2: Storybook stories 동적 순회 visual regression
// D6 결정: stories.json 동적 읽기 (Storybook static build 산출)
// PSD-006: Storybook 8 기본 산출은 index.json. stories.json(v6 legacy) 폴백 처리.
const storyStaticDir = path.resolve(process.cwd(), 'apps/docs/storybook-static');
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
  const raw = readFileSync(storiesJsonPath, 'utf-8');
  const parsed = JSON.parse(raw) as StoriesJson;
  return parsed.stories;
}

const storiesMap = loadStoryIds();
const storyIds = Object.keys(storiesMap).filter(
  // 'docs' type entries는 iframe story가 아님 — type: 'docs' 또는 tags 기준 제외
  (id) => {
    const entry = storiesMap[id];
    return !entry.tags?.includes('docs');
  }
);

for (const storyId of storyIds) {
  const story = storiesMap[storyId];
  test(`visual regression: ${story.title}/${story.name}`, async ({ page }) => {
    const iframeUrl = `/iframe.html?id=${storyId}&viewMode=story`;
    await page.goto(iframeUrl);

    // EC-03: 1000행 가상화 story는 렌더링 시간 증가 → timeout 60s 연장 (C-18)
    const isVirtualized =
      storyId.includes('virtual') || storyId.includes('1000');
    const waitTimeout = isVirtualized ? 60000 : 5000;

    await page.waitForLoadState('networkidle', { timeout: waitTimeout });

    await expect(page).toMatchSnapshot(`${storyId}.png`, {
      maxDiffPixelRatio: 0.01, // EC-02: OS/브라우저 픽셀 차이 threshold 1%
    });
  });
}
