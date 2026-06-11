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
  }),
});
