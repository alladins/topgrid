import type { StorybookConfig } from '@storybook/react-vite';

// spec G-002 Section 2-1 / Section 7 #1
// D4: @storybook/react-vite framework (webpack 미사용, Vite 기반 monorepo 일관성)
// C-25 glob: ../../../packages/*/stories/ — apps/docs/.storybook 기준 3단계 상위로 이동 후 packages/ 접근
// specCodeDefects[0]: spec Section 2-1 glob '../../packages/...' → path error (apps/packages/ 미존재).
//   실제 올바른 경로는 '../../../packages/...' (monorepo root 기준). C-30 executable 권위 채택.
const config: StorybookConfig = {
  stories: [
    // 모든 패키지의 stories 디렉토리를 단일 glob로 수집
    // apps/docs/.storybook/ 기준: ../../../packages = monorepo root/packages ✓
    '../../../packages/*/stories/**/*.stories.@(ts|tsx)',
    // MOD-GRID-99-B residual-4 (Wave 1-5 시각 검증 보강): per-component stories 추가 수집
    // 13 패키지의 `src/__stories__/` 경로 (~32 파일) — glob gap 해소 (spec §1.2, D-E inline 수정).
    // 직속 `src/*.stories.tsx` (CSF3 placeholder) 는 의도적으로 제외 — runtime component string ref 미해결.
    '../../../packages/*/src/__stories__/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
