// spec body authority — C-33: this file follows spec Section 2-1 with C-5 drift applied (customCss: [])
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'TOMIS Grid',
  tagline: 'Headless React grid for TOMIS',
  url: 'https://grid.tomis.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
  },
  presets: [
    [
      'classic',
      {
        docs: { sidebarPath: './sidebars.ts' },
        blog: false,
        theme: { customCss: [] }, // C-5 drift: custom.css 신규 파일 금지 → 빈 배열
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        // AC-002: 13개 패키지 TypeDoc entryPoints (spec Section 2-1)
        entryPoints: [
          '../../packages/grid/src/index.ts',
          '../../packages/grid-core/src/index.ts',
          '../../packages/grid-export/src/index.ts',
          '../../packages/grid-features/src/index.ts',
          '../../packages/grid-license/src/index.ts',
          '../../packages/grid-pro-agg/src/index.ts',
          '../../packages/grid-pro-datamap/src/index.ts',
          '../../packages/grid-pro-header/src/index.ts',
          '../../packages/grid-pro-master/src/index.ts',
          '../../packages/grid-pro-merging/src/index.ts',
          '../../packages/grid-pro-range/src/index.ts',
          '../../packages/grid-pro-tracking/src/index.ts',
          '../../packages/grid-renderers/src/index.ts',
        ],
        entryPointStrategy: 'packages',
        out: 'api',
        sidebar: { categoryLabel: 'API Reference' },
      },
    ],
  ],
};

export default config;
