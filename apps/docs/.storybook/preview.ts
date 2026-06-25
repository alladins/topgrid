import type { Preview } from '@storybook/react';
// 데모 캔버스에 Tailwind 주입 — 그리드 컴포넌트가 Tailwind 유틸로 스타일링되므로
// 소비자 환경과 동일하게 렌더된다. 데모 전용(발행 패키지/테스트 정확성과 무관).
import './tailwind.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // 스토리를 캔버스 좌상단에 붙이지 않고 여백을 준다(레이아웃 정렬).
    layout: 'padded',
  },
};

export default preview;
