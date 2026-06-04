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
  themeConfig: {
    navbar: {
      title: 'topgrid',
      items: [
        { type: 'doc', docId: 'intro', position: 'left', label: '문서' },
        { type: 'doc', docId: 'comparison', position: 'left', label: '기능 비교' },
        { to: '/migration/live-demos', position: 'left', label: '예제' },
        // 인터랙티브 컴포넌트 데모(Storybook). `pnpm build:site` 가 static/storybook 으로
        // 빌드 → docusaurus build 가 /storybook/ 로 번들(href 라 onBrokenLinks 미검사).
        { href: '/storybook/', position: 'left', label: '데모(Storybook)', target: '_blank' },
      ],
    },
  } satisfies Preset.ThemeConfig,
  // NOTE: 자동 API 레퍼런스(docusaurus-plugin-typedoc)는 typedoc 버전 정합 이슈로
  // 임시 비활성. 수기 문서 우선 배포 후 후속으로 복구 예정.
};

export default config;
