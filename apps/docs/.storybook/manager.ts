import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

// 사이드바 좌상단 브랜드를 메인 문서 사이트로 가는 링크로 사용한다.
// 배포 시 storybook 은 /storybook/ 에 서빙되므로 brandUrl '/' = 문서 사이트 루트로 이동.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: '← TOPGRID 문서 사이트',
    brandUrl: '/',
    brandTarget: '_self',
    // 문서 사이트와 동일한 blue 브랜드 정합.
    colorPrimary: '#2563eb',
    colorSecondary: '#2563eb',
    appBg: '#f7f9fc',
    appContentBg: '#ffffff',
    appBorderColor: '#e8ecf3',
    appBorderRadius: 8,
    barSelectedColor: '#2563eb',
    barHoverColor: '#2563eb',
    inputBorderRadius: 6,
  }),
});
