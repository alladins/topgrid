import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'topgrid',
  tagline: 'Headless React grid',
  url: 'https://topgrid.platree.com',
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
        docs: { sidebarPath: './sidebars.ts', routeBasePath: '/' },
        blog: false,
      } satisfies Preset.Options,
    ],
  ],
  // NOTE: 자동 API 레퍼런스(docusaurus-plugin-typedoc)는 typedoc 버전 정합 이슈로
  // 임시 비활성. 수기 문서 우선 배포 후 후속으로 복구 예정.
};

export default config;
