import type { Preview } from '@storybook/react';

// spec G-002 Section 2-1 / Section 7 #2
// D8: CSS import 없음 — monorepo에 Tailwind 미설치, C-5 완전 준수
// preview.ts는 순수 TypeScript 설정만 포함
const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
