import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'topgrid',
  tagline: 'TanStack Table 기반 Headless React 그리드 — MIT 코어 + Enterprise Pro',
  url: 'https://topgrid.platree.com',
  baseUrl: '/',
  favicon: 'img/favicon.svg',
  onBrokenLinks: 'throw',
  // Docusaurus v4 migration: onBrokenMarkdownLinks moved under markdown.hooks.
  markdown: { hooks: { onBrokenMarkdownLinks: 'warn' } },
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
  },
  // 1st-party 방문 비컨(정확 UV/세션/PV) — admin-server 가 수집·집계. src/clientModules/beacon.js 참조.
  clientModules: ['./src/clientModules/beacon.js'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/og-image.png',
    metadata: [
      {
        name: 'description',
        content:
          'topgrid — TanStack Table v8 기반 Headless React 그리드. 가상화·피벗·집계·서버사이드·차트 17종·스프레드시트. MIT 코어 + Pro, 31 패키지.',
      },
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'topgrid',
      logo: { alt: 'topgrid', src: 'img/logo.svg' },
      items: [
        { type: 'doc', docId: 'getting-started', position: 'left', label: '시작하기' },
        { type: 'doc', docId: 'api-reference', position: 'left', label: 'API' },
        { type: 'doc', docId: 'comparison', position: 'left', label: '기능 비교' },
        { to: '/migration/live-demos', position: 'left', label: '예제' },
        { to: '/pricing', position: 'left', label: '가격' },
        // 인터랙티브 컴포넌트 데모(Storybook). `pnpm build:site` 가 static/storybook 으로
        // 빌드 → docusaurus build 가 /storybook/ 로 번들(href 라 onBrokenLinks 미검사).
        { href: 'pathname:///storybook/', position: 'right', label: '데모', target: '_blank' },
        { href: 'https://github.com/alladins/topgrid', position: 'right', label: 'GitHub', target: '_blank' },
        { type: 'localeDropdown', position: 'right' },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: '문서',
          items: [
            { label: '시작하기', to: '/getting-started' },
            { label: 'API 레퍼런스', to: '/api-reference' },
            { label: '차트', to: '/charting' },
            { label: 'Next.js / SSR', to: '/nextjs-ssr' },
          ],
        },
        {
          title: '제품',
          items: [
            { label: '소개', to: '/intro' },
            { label: '기능 비교', to: '/comparison' },
            { label: '가격', to: '/pricing' },
            { label: '예제', to: '/migration/live-demos' },
            { label: '데모 (Storybook)', href: 'pathname:///storybook/' },
          ],
        },
        {
          title: '리소스',
          items: [
            { label: 'GitHub', href: 'https://github.com/alladins/topgrid' },
            { label: '도입 문의', to: '/pricing#inquiry' },
          ],
        },
      ],
      copyright: `© 2026 platree · topgrid — TanStack Table 기반 Headless React 그리드`,
    },
  } satisfies Preset.ThemeConfig,
  // 자동 API 레퍼런스: docusaurus-plugin-typedoc 체인(버전 정합 이슈) 대신 자체 생성기 사용.
  // `pnpm --dir apps/docs gen:api` (apps/docs/scripts/gen-api.mjs) 가 typedoc 을 JSON 추출기로만
  // 써서 소스 TSDoc → docs/api/<pkg>.md (한국어) 생성. 사이드바 '패키지별 API (자동 생성)' 로 노출.
  // 영어(i18n/en)는 후속 단계. API 소스 변경 시 gen:api 재실행 후 커밋.
};

export default config;
